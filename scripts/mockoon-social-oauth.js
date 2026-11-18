#!/usr/bin/env node
/**
 * scripts/mockoon-social-oauth.js - add the user-service social OAuth routes to the Mockoon
 * environment imported from the pinned OpenAPI spec (specs/social-sign-in, story S1.1).
 *
 * WHY: the pinned spec (OPENAPI_SPEC_VERSION) predates GET /api/auth/social/{provider} and its
 * callback, and an OpenAPI import could only replay the spec's example redirect anyway. These
 * routes make the whole browser round trip work locally: initiate -> consent -> SPA callback ->
 * credentialed relay to the callback route. See src/api/contracts/README.md,
 * "Pending REST operations"; delete this script with the pin bump that brings the routes in.
 *
 * Modes (MOCKOON_OAUTH_MODE):
 *   mock      every provider redirects to a Mockoon-hosted consent page with one link per outcome
 *   provider  a provider whose MOCKOON_OAUTH_<P>_CLIENT_ID is set redirects to its real consent
 *             screen; the rest keep the mock page. The callback answers success for any code, so
 *             no client secret is ever needed.
 *
 * Run by scripts/docker/mockoon-entrypoint.sh at container start:
 *   node scripts/mockoon-social-oauth.js <imported-env.json> <output-env.json>
 */

'use strict';

const crypto = require('crypto');
const fs = require('fs');

const MODES = ['mock', 'provider'];
const PROVIDERS = ['google', 'github', 'facebook', 'twitter'];
const FLOW_COOKIE = 'oauth_flow_binding';
const CONSENT_PATH = '__mock-oauth';

const AUTHORIZE_URLS = {
  google: {
    base: 'https://accounts.google.com/o/oauth2/v2/auth',
    params: { response_type: 'code', scope: 'openid email profile', prompt: 'select_account' },
  },
  github: {
    base: 'https://github.com/login/oauth/authorize',
    params: { scope: 'read:user user:email' },
  },
  facebook: { base: 'https://www.facebook.com/v19.0/dialog/oauth', params: { scope: 'email' } },
  twitter: {
    base: 'https://x.com/i/oauth2/authorize',
    params: {
      response_type: 'code',
      scope: 'users.read tweet.read',
      code_challenge: 'mock-challenge',
      code_challenge_method: 'plain',
    },
  },
};

// One consent-page link per backend outcome; `code` selects the callback response below.
const SCENARIOS = [
  { code: 'mock-success', label: 'Allow', status: 200, body: { kind: 'direct' } },
  { code: 'mock-2fa', label: 'Allow (2FA account)', status: 200, body: { kind: 'pending' } },
  { code: 'mock-expired', label: 'Expired state', status: 422, errorCode: 'state_expired' },
  { code: 'mock-invalid-state', label: 'Invalid state', status: 422, errorCode: 'invalid_state' },
  {
    code: 'mock-unverified',
    label: 'Unverified email',
    status: 422,
    errorCode: 'unverified_provider_email',
  },
  {
    code: 'mock-no-email',
    label: 'No email shared',
    status: 422,
    errorCode: 'provider_email_unavailable',
  },
  { code: 'mock-duplicate', label: 'Duplicate email', status: 409, errorCode: 'duplicate_email' },
  {
    code: 'mock-mismatch',
    label: 'Provider mismatch',
    status: 400,
    errorCode: 'provider_mismatch',
  },
  {
    code: 'mock-unavailable',
    label: 'Provider unavailable',
    status: 503,
    errorCode: 'provider_unavailable',
  },
];

function fail(message) {
  throw new Error(`mockoon-social-oauth: ${message}`);
}

function header(key, value) {
  return { key, value };
}

function response(fields) {
  return {
    uuid: crypto.randomUUID(),
    body: '',
    latency: 0,
    statusCode: 200,
    label: '',
    headers: [],
    bodyType: 'INLINE',
    filePath: '',
    databucketID: '',
    sendFileAsBody: false,
    rules: [],
    rulesOperator: 'OR',
    disableTemplating: false,
    fallbackTo404: false,
    default: false,
    crudKey: 'id',
    callbacks: [],
    ...fields,
  };
}

function route(method, endpoint, documentation, responses) {
  return {
    uuid: crypto.randomUUID(),
    type: 'http',
    documentation,
    method,
    endpoint,
    responses,
    responseMode: null,
    streamingMode: null,
    streamingInterval: 0,
  };
}

function rule(target, modifier, operator, value = '') {
  return { target, modifier, value, invert: false, operator };
}

function corsHeaders(spaOrigin) {
  return [
    header('Access-Control-Allow-Origin', spaOrigin),
    header('Access-Control-Allow-Credentials', 'true'),
    header('Vary', 'Origin'),
  ];
}

function problem(status, errorCode, detail, spaOrigin) {
  return {
    statusCode: status,
    headers: [header('Content-Type', 'application/problem+json'), ...corsHeaders(spaOrigin)],
    body: JSON.stringify({
      type: `/errors/${status}`,
      title: 'An error occurred',
      detail,
      status,
      error_code: errorCode,
    }),
  };
}

function authorizeLocation(provider, clientId, spaOrigin) {
  const { base, params } = AUTHORIZE_URLS[provider];
  const query = new URLSearchParams({
    ...params,
    client_id: clientId,
    redirect_uri: `${spaOrigin}/auth/callback/${provider}`,
  });

  return `${base}?${query.toString()}&state={{getGlobalVar 'oauthState'}}`;
}

function initiateResponse(provider, options) {
  const clientId = options.mode === 'provider' ? options.clientIds[provider] : '';
  const location = clientId
    ? authorizeLocation(provider, clientId, options.spaOrigin)
    : `/${CONSENT_PATH}/${provider}/authorize?state={{getGlobalVar 'oauthState'}}`;

  return response({
    statusCode: 302,
    label: clientId
      ? `Redirect to the real ${provider} consent screen`
      : 'Redirect to mock consent',
    rules: [rule('params', 'provider', 'equals', provider)],
    // Mockoon renders Set-Cookie before the other headers, so the state is generated there and
    // read back by Location: the flow cookie and the `state` query then carry the same value.
    headers: [
      header(
        'Set-Cookie',
        `{{setGlobalVar 'oauthState' (faker 'string.uuid')}}${FLOW_COOKIE}={{getGlobalVar 'oauthState'}}; ` +
          'Path=/api/auth/social; HttpOnly; SameSite=Lax'
      ),
      header('Location', location),
      header('Cache-Control', 'no-store'),
    ],
  });
}

function initiateRoute(options) {
  const unsupported = problem(
    400,
    'unsupported_provider',
    'Unsupported OAuth provider "{{urlParam \'provider\'}}".',
    options.spaOrigin
  );

  return route('get', 'api/auth/social/:provider', 'Start social OAuth flow (local mock).', [
    ...PROVIDERS.map((provider) => initiateResponse(provider, options)),
    response({ ...unsupported, label: 'Unsupported provider', default: true }),
  ]);
}

function consentPage(spaOrigin) {
  const callback = `${spaOrigin}/auth/callback/{{urlParam 'provider'}}`;
  const state = "{{queryParam 'state'}}";
  const links = SCENARIOS.map(
    ({ code, label }) =>
      `<li><a href="${callback}?code=${code}&amp;state=${state}">${label}</a></li>`
  );
  links.push(`<li><a href="${callback}?error=access_denied&amp;state=${state}">Deny</a></li>`);

  return [
    '<!doctype html>',
    '<html lang="en">',
    '<head><meta charset="utf-8"><title>Mock {{urlParam \'provider\'}} consent</title></head>',
    '<body>',
    "<main><h1>Mock {{urlParam 'provider'}} consent</h1>",
    '<p>Local Mockoon stand-in for the provider screen. Pick an outcome:</p>',
    `<ul>${links.join('')}</ul></main>`,
    '</body>',
    '</html>',
  ].join('\n');
}

function consentRoute(spaOrigin) {
  return route('get', `${CONSENT_PATH}/:provider/authorize`, 'Mock provider consent page.', [
    response({
      label: 'Consent page',
      default: true,
      headers: [header('Content-Type', 'text/html; charset=utf-8')],
      body: consentPage(spaOrigin),
    }),
  ]);
}

function successBody(kind) {
  return kind === 'pending'
    ? { '2fa_enabled': true, pending_session_id: "{{faker 'string.uuid'}}" }
    : {
        '2fa_enabled': false,
        access_token: "mock-access-{{faker 'string.alphanumeric' 32}}",
        refresh_token: "mock-refresh-{{faker 'string.alphanumeric' 32}}",
      };
}

function scenarioResponse(scenario, spaOrigin) {
  const fields = scenario.errorCode
    ? problem(scenario.status, scenario.errorCode, scenario.label, spaOrigin)
    : {
        statusCode: scenario.status,
        headers: [header('Content-Type', 'application/json'), ...corsHeaders(spaOrigin)],
        body: JSON.stringify(successBody(scenario.body.kind)),
      };

  return response({
    ...fields,
    label: scenario.label,
    rules: [rule('query', 'code', 'equals', scenario.code)],
  });
}

function callbackRoute(spaOrigin) {
  const missing = problem(
    400,
    'missing_oauth_parameters',
    'Missing OAuth code, state or flow-binding cookie.',
    spaOrigin
  );
  const [direct] = SCENARIOS;

  return route('get', 'api/auth/social/:provider/callback', 'Social OAuth callback (local mock).', [
    response({
      ...missing,
      label: 'Missing parameters',
      rules: [
        rule('cookie', FLOW_COOKIE, 'null'),
        rule('query', 'code', 'null'),
        rule('query', 'state', 'null'),
      ],
    }),
    ...SCENARIOS.map((scenario) => scenarioResponse(scenario, spaOrigin)),
    response({ ...scenarioResponse(direct, spaOrigin), rules: [], default: true }),
  ]);
}

function preflightRoute(spaOrigin) {
  return route('options', 'api/auth/social/:provider/callback', 'Credentialed CORS preflight.', [
    response({
      statusCode: 204,
      label: 'Preflight',
      default: true,
      headers: [
        ...corsHeaders(spaOrigin),
        header('Access-Control-Allow-Methods', 'GET, OPTIONS'),
        header(
          'Access-Control-Allow-Headers',
          'Accept, Content-Type, X-Request-Id, X-Correlation-Id'
        ),
        header('Access-Control-Max-Age', '600'),
      ],
    }),
  ]);
}

function readOptions(env) {
  const mode = env.MOCKOON_OAUTH_MODE || 'mock';
  if (!MODES.includes(mode)) {
    fail(`MOCKOON_OAUTH_MODE="${mode}" is not one of: ${MODES.join(', ')}.`);
  }
  const spaOrigin = (env.MOCKOON_SPA_ORIGIN || '').replace(/\/+$/, '');
  if (!/^https?:\/\/[^/]+$/.test(spaOrigin)) {
    fail(`MOCKOON_SPA_ORIGIN="${spaOrigin}" must be an origin such as http://localhost:3000.`);
  }
  const clientIds = Object.fromEntries(
    PROVIDERS.map((provider) => [
      provider,
      (env[`MOCKOON_OAUTH_${provider.toUpperCase()}_CLIENT_ID`] || '').trim(),
    ])
  );

  return { mode, spaOrigin, clientIds };
}

function socialRoutes(options) {
  return [
    preflightRoute(options.spaOrigin),
    callbackRoute(options.spaOrigin),
    initiateRoute(options),
    consentRoute(options.spaOrigin),
  ];
}

function addSocialRoutes(environment, env) {
  const options = readOptions(env);
  const routes = socialRoutes(options);
  const endpoints = new Set(routes.map(({ method, endpoint }) => `${method} ${endpoint}`));
  const clash = environment.routes.find(({ method, endpoint }) =>
    endpoints.has(`${method} ${endpoint}`)
  );
  if (clash) {
    fail(
      `the imported spec already declares ${clash.method} ${clash.endpoint}; delete this overlay.`
    );
  }

  return {
    ...environment,
    routes: [...routes, ...environment.routes],
    rootChildren: [
      ...routes.map(({ uuid }) => ({ type: 'route', uuid })),
      ...environment.rootChildren,
    ],
  };
}

function main(argv, env) {
  const [input, output] = argv;
  if (!input || !output) fail('usage: mockoon-social-oauth.js <imported.json> <output.json>');
  const merged = addSocialRoutes(JSON.parse(fs.readFileSync(input, 'utf8')), env);
  fs.writeFileSync(output, `${JSON.stringify(merged, null, 2)}\n`);
  const { mode } = readOptions(env);
  process.stdout.write(`mockoon-social-oauth: added social OAuth routes (mode: ${mode})\n`);
}

if (require.main === module) {
  try {
    main(process.argv.slice(2), process.env);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exit(1);
  }
}

module.exports = { MODES, PROVIDERS, SCENARIOS, addSocialRoutes, readOptions, main };
