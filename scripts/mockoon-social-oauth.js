#!/usr/bin/env node
/**
 * scripts/mockoon-social-oauth.js - add a mock OAuth provider consent page to the Mockoon
 * environment imported from the pinned OpenAPI spec (specs/social-sign-in).
 *
 * WHY: social sign-in runs through the user-service GraphQL mutations, which the local Apollo mock
 * answers (docker/apollo-server/lib/social-sign-in-resolvers.ts). In OAUTH_MODE=mock that mock's
 * authorization URL points here instead of at Google or GitHub: a page with one link per outcome,
 * each sending the browser back to the `redirect_uri` it was given with a scenario code and the
 * `state` it was given. This is a stand-in for the provider, not for user-service.
 *
 * Run by scripts/docker/mockoon-entrypoint.sh at container start:
 *   node scripts/mockoon-social-oauth.js <imported-env.json> <output-env.json>
 */

'use strict';

const crypto = require('crypto');
const fs = require('fs');

const CONSENT_ENDPOINT = '__mock-oauth/:provider/authorize';

// One link per outcome, scenario code -> link text; the Apollo mock maps each code to its
// user-service answer.
const SCENARIOS = Object.freeze({
  'mock-success': 'Allow',
  'mock-2fa': 'Allow (2FA account)',
  'mock-expired': 'Expired state',
  'mock-unverified': 'Unverified email',
  'mock-no-email': 'No email shared',
  'mock-duplicate': 'Duplicate email',
  'mock-unavailable': 'Provider unavailable',
});

// Every reflected value is constrained before the page renders, so nothing a request carries can
// inject markup: a local SPA callback URL for a known provider, a v4 UUID state, a known provider.
const PROVIDERS = '(google|github|facebook|twitter)';
const PROVIDER_PATTERN = `^${PROVIDERS}$`;
const LOCAL_ORIGIN = 'https?://(localhost|[a-z0-9-]+\\.localhost)(:[0-9]{1,5})?';
const REDIRECT_URI_PATTERN = `^${LOCAL_ORIGIN}/auth/callback/${PROVIDERS}$`;
const STATE_PATTERN = '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';

function fail(message) {
  throw new Error(`mockoon-social-oauth: ${message}`);
}

function consentPage() {
  const back = "{{queryParam 'redirect_uri'}}";
  const state = "{{queryParam 'state'}}";
  const links = Object.entries(SCENARIOS).map(
    ([code, label]) => `<li><a href="${back}?code=${code}&amp;state=${state}">${label}</a></li>`
  );
  links.push(`<li><a href="${back}?error=access_denied&amp;state=${state}">Deny</a></li>`);

  return [
    '<!doctype html>',
    '<html lang="en">',
    '<head><meta charset="utf-8"><title>Mock {{urlParam \'provider\'}} consent</title></head>',
    '<body>',
    "<main><h1>Mock {{urlParam 'provider'}} consent</h1>",
    '<p>Local stand-in for the provider screen. Pick an outcome:</p>',
    `<ul>${links.join('')}</ul></main>`,
    '</body>',
    '</html>',
  ].join('\n');
}

function rule(target, modifier, value) {
  return { target, modifier, value, invert: false, operator: 'regex' };
}

function response(overrides) {
  return {
    uuid: crypto.randomUUID(),
    latency: 0,
    bodyType: 'INLINE',
    filePath: '',
    databucketID: '',
    sendFileAsBody: false,
    disableTemplating: false,
    fallbackTo404: false,
    crudKey: 'id',
    callbacks: [],
    ...overrides,
  };
}

function consentRoute() {
  return {
    uuid: crypto.randomUUID(),
    type: 'http',
    documentation: 'Mock OAuth provider consent page (social sign-in).',
    method: 'get',
    endpoint: CONSENT_ENDPOINT,
    responses: [
      response({
        body: consentPage(),
        statusCode: 200,
        label: 'Consent page',
        headers: [{ key: 'Content-Type', value: 'text/html; charset=utf-8' }],
        rules: [
          rule('params', 'provider', PROVIDER_PATTERN),
          rule('query', 'redirect_uri', REDIRECT_URI_PATTERN),
          rule('query', 'state', STATE_PATTERN),
        ],
        rulesOperator: 'AND',
        default: false,
      }),
      response({
        body: 'Invalid mock consent request.',
        statusCode: 400,
        label: 'Rejected consent request',
        headers: [{ key: 'Content-Type', value: 'text/plain; charset=utf-8' }],
        rules: [],
        rulesOperator: 'OR',
        default: true,
      }),
    ],
    responseMode: null,
    streamingMode: null,
    streamingInterval: 0,
  };
}

function addConsentRoute(environment) {
  if (environment.routes.some(({ endpoint }) => endpoint === CONSENT_ENDPOINT)) {
    fail(`the imported spec already declares ${CONSENT_ENDPOINT}; delete this overlay.`);
  }
  const route = consentRoute();

  return {
    ...environment,
    routes: [route, ...environment.routes],
    rootChildren: [{ type: 'route', uuid: route.uuid }, ...environment.rootChildren],
  };
}

function main(argv) {
  const [input, output] = argv;
  if (!input || !output) fail('usage: mockoon-social-oauth.js <imported.json> <output.json>');
  const merged = addConsentRoute(JSON.parse(fs.readFileSync(input, 'utf8')));
  fs.writeFileSync(output, `${JSON.stringify(merged, null, 2)}\n`);
  process.stdout.write('mockoon-social-oauth: added the mock consent page\n');
}

if (require.main === module) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exit(1);
  }
}

module.exports = {
  PROVIDER_PATTERN,
  REDIRECT_URI_PATTERN,
  STATE_PATTERN,
  SCENARIOS,
  addConsentRoute,
  main,
};
