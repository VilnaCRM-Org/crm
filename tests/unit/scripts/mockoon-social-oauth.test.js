const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  MODES,
  PROVIDERS,
  SCENARIOS,
  addSocialRoutes,
  readOptions,
  main,
} = require('../../../scripts/mockoon-social-oauth');

const SPA = 'http://localhost:3000';

const importedEnv = () => ({
  uuid: 'env',
  routes: [{ uuid: 'health', method: 'get', endpoint: 'api/health', responses: [] }],
  rootChildren: [{ type: 'route', uuid: 'health' }],
  cors: true,
});

const merge = (env = {}) => addSocialRoutes(importedEnv(), { MOCKOON_SPA_ORIGIN: SPA, ...env });

const routeOf = (environment, method, endpoint) =>
  environment.routes.find((r) => r.method === method && r.endpoint === endpoint);

const headerOf = (response, key) => response.headers.find((h) => h.key === key)?.value;

const initiate = (environment, provider) =>
  routeOf(environment, 'get', 'api/auth/social/:provider').responses.find(
    (r) => r.rules[0]?.value === provider
  );

describe('mockoon-social-oauth', () => {
  describe('readOptions', () => {
    it('defaults to mock mode and trims a trailing slash off the SPA origin', () => {
      expect(readOptions({ MOCKOON_SPA_ORIGIN: `${SPA}/` })).toEqual({
        mode: 'mock',
        spaOrigin: SPA,
        clientIds: { google: '', github: '', facebook: '', twitter: '' },
      });
    });

    it('reads a trimmed client id per provider', () => {
      const { clientIds } = readOptions({
        MOCKOON_SPA_ORIGIN: SPA,
        MOCKOON_OAUTH_MODE: 'provider',
        MOCKOON_OAUTH_GOOGLE_CLIENT_ID: ' g-id ',
        MOCKOON_OAUTH_GITHUB_CLIENT_ID: 'gh-id',
      });

      expect(clientIds).toEqual({ google: 'g-id', github: 'gh-id', facebook: '', twitter: '' });
    });

    it('rejects an unknown mode, naming the allowed ones', () => {
      expect(() => readOptions({ MOCKOON_SPA_ORIGIN: SPA, MOCKOON_OAUTH_MODE: 'live' })).toThrow(
        'MOCKOON_OAUTH_MODE="live" is not one of: mock, provider.'
      );
      expect(MODES).toEqual(['mock', 'provider']);
    });

    it.each(['', 'localhost:3000', 'http://localhost:3000/app', 'ftp://localhost'])(
      'rejects the SPA origin %p',
      (origin) => {
        expect(() => readOptions({ MOCKOON_SPA_ORIGIN: origin })).toThrow('must be an origin');
      }
    );
  });

  describe('addSocialRoutes', () => {
    it('puts the four social routes ahead of the imported ones and keeps those', () => {
      const merged = merge();

      expect(merged.routes.map((r) => `${r.method} ${r.endpoint}`)).toEqual([
        'options api/auth/social/:provider/callback',
        'get api/auth/social/:provider/callback',
        'get api/auth/social/:provider',
        'get __mock-oauth/:provider/authorize',
        'get api/health',
      ]);
      expect(merged.rootChildren.map((c) => c.uuid)).toEqual(merged.routes.map((r) => r.uuid));
      expect(merged.cors).toBe(true);
    });

    it('refuses to shadow a route the imported spec already declares', () => {
      const env = importedEnv();
      env.routes.push({ method: 'get', endpoint: 'api/auth/social/:provider', responses: [] });

      expect(() => addSocialRoutes(env, { MOCKOON_SPA_ORIGIN: SPA })).toThrow(
        'the imported spec already declares get api/auth/social/:provider; delete this overlay.'
      );
    });

    it('binds the flow cookie and the state to one generated value', () => {
      const response = initiate(merge(), 'google');

      expect(response.statusCode).toBe(302);
      expect(headerOf(response, 'Set-Cookie')).toBe(
        "{{setGlobalVar 'oauthState' (faker 'string.uuid')}}oauth_flow_binding=" +
          "{{getGlobalVar 'oauthState'}}; Path=/api/auth/social; HttpOnly; SameSite=Lax"
      );
      expect(headerOf(response, 'Cache-Control')).toBe('no-store');
      expect(response.headers.map((h) => h.key)).toEqual([
        'Set-Cookie',
        'Location',
        'Cache-Control',
      ]);
    });

    it.each(PROVIDERS)('sends %s to the mock consent page in mock mode', (provider) => {
      const merged = merge({ MOCKOON_OAUTH_GOOGLE_CLIENT_ID: 'ignored-in-mock-mode' });

      expect(headerOf(initiate(merged, provider), 'Location')).toBe(
        `/__mock-oauth/${provider}/authorize?state={{getGlobalVar 'oauthState'}}`
      );
    });

    it('sends a provider with a client id to its real consent screen in provider mode', () => {
      const merged = merge({
        MOCKOON_OAUTH_MODE: 'provider',
        MOCKOON_OAUTH_GOOGLE_CLIENT_ID: 'g-id',
        MOCKOON_OAUTH_GITHUB_CLIENT_ID: 'gh-id',
        MOCKOON_OAUTH_FACEBOOK_CLIENT_ID: 'fb-id',
        MOCKOON_OAUTH_TWITTER_CLIENT_ID: 'x-id',
      });
      const location = (provider) => new URL(headerOf(initiate(merged, provider), 'Location'));

      expect(location('google').origin + location('google').pathname).toBe(
        'https://accounts.google.com/o/oauth2/v2/auth'
      );
      expect(Object.fromEntries(location('google').searchParams)).toEqual({
        response_type: 'code',
        scope: 'openid email profile',
        prompt: 'select_account',
        client_id: 'g-id',
        redirect_uri: `${SPA}/auth/callback/google`,
        state: "{{getGlobalVar 'oauthState'}}",
      });
      expect(Object.fromEntries(location('github').searchParams)).toEqual({
        scope: 'read:user user:email',
        client_id: 'gh-id',
        redirect_uri: `${SPA}/auth/callback/github`,
        state: "{{getGlobalVar 'oauthState'}}",
      });
      expect(location('facebook').href).toContain('https://www.facebook.com/v19.0/dialog/oauth?');
      expect(location('facebook').searchParams.get('scope')).toBe('email');
      expect(location('twitter').href).toContain('https://x.com/i/oauth2/authorize?');
      expect(location('twitter').searchParams.get('code_challenge_method')).toBe('plain');
    });

    it('keeps a provider without a client id on the mock page in provider mode', () => {
      const merged = merge({ MOCKOON_OAUTH_MODE: 'provider', MOCKOON_OAUTH_GOOGLE_CLIENT_ID: 'g' });

      expect(initiate(merged, 'github').label).toBe('Redirect to mock consent');
      expect(initiate(merged, 'google').label).toBe('Redirect to the real google consent screen');
    });

    it('answers an unknown provider with the unsupported_provider problem by default', () => {
      const fallback = routeOf(merge(), 'get', 'api/auth/social/:provider').responses.at(-1);

      expect(fallback).toMatchObject({ default: true, statusCode: 400, rules: [] });
      expect(JSON.parse(fallback.body)).toMatchObject({ error_code: 'unsupported_provider' });
      expect(headerOf(fallback, 'Content-Type')).toBe('application/problem+json');
    });

    it('lists every scenario and a deny link on the consent page', () => {
      const [page] = routeOf(merge(), 'get', '__mock-oauth/:provider/authorize').responses;
      const callback = `${SPA}/auth/callback/{{urlParam 'provider'}}`;

      expect(page).toMatchObject({ default: true, statusCode: 200 });
      expect(headerOf(page, 'Content-Type')).toBe('text/html; charset=utf-8');
      for (const { code, label } of SCENARIOS) {
        expect(page.body).toContain(
          `<a href="${callback}?code=${code}&amp;state={{queryParam 'state'}}">${label}</a>`
        );
      }
      expect(page.body).toContain(
        `<a href="${callback}?error=access_denied&amp;state={{queryParam 'state'}}">Deny</a>`
      );
      expect(page.body).toContain('<html lang="en">');
    });

    it('answers missing parameters first, then each scenario code, then success', () => {
      const { responses } = routeOf(merge(), 'get', 'api/auth/social/:provider/callback');
      const [missing, ...rest] = responses;

      expect(missing.rulesOperator).toBe('OR');
      expect(missing.rules.map((r) => [r.target, r.modifier, r.operator])).toEqual([
        ['cookie', 'oauth_flow_binding', 'null'],
        ['query', 'code', 'null'],
        ['query', 'state', 'null'],
      ]);
      expect(JSON.parse(missing.body).error_code).toBe('missing_oauth_parameters');
      expect(rest.slice(0, -1).map((r) => [r.rules[0].value, r.statusCode])).toEqual(
        SCENARIOS.map((s) => [s.code, s.status])
      );
      expect(rest.at(-1)).toMatchObject({ default: true, statusCode: 200, rules: [] });
      expect(responses.filter((r) => r.default)).toHaveLength(1);
    });

    it('returns the two documented success bodies and the problem bodies', () => {
      const { responses } = routeOf(merge(), 'get', 'api/auth/social/:provider/callback');
      const byCode = (code) => responses.find((r) => r.rules[0]?.value === code);

      expect(Object.keys(JSON.parse(byCode('mock-success').body))).toEqual([
        '2fa_enabled',
        'access_token',
        'refresh_token',
      ]);
      expect(JSON.parse(byCode('mock-2fa').body)).toEqual({
        '2fa_enabled': true,
        pending_session_id: "{{faker 'string.uuid'}}",
      });
      expect(JSON.parse(byCode('mock-unavailable').body)).toEqual({
        type: '/errors/503',
        title: 'An error occurred',
        detail: 'Provider unavailable',
        status: 503,
        error_code: 'provider_unavailable',
      });
    });

    it('allows credentialed CORS from the SPA origin only, never a wildcard', () => {
      const merged = merge();
      const [preflight] = routeOf(
        merged,
        'options',
        'api/auth/social/:provider/callback'
      ).responses;
      const { responses } = routeOf(merged, 'get', 'api/auth/social/:provider/callback');

      expect(preflight.statusCode).toBe(204);
      expect(headerOf(preflight, 'Access-Control-Allow-Headers')).toBe(
        'Accept, Content-Type, X-Request-Id, X-Correlation-Id'
      );
      expect(headerOf(preflight, 'Access-Control-Allow-Methods')).toBe('GET, OPTIONS');
      for (const response of [preflight, ...responses]) {
        expect(headerOf(response, 'Access-Control-Allow-Origin')).toBe(SPA);
        expect(headerOf(response, 'Access-Control-Allow-Credentials')).toBe('true');
        expect(headerOf(response, 'Vary')).toBe('Origin');
      }
    });
  });

  describe('main', () => {
    let dir;

    beforeEach(() => {
      dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mockoon-social-'));
    });

    afterEach(() => {
      fs.rmSync(dir, { recursive: true, force: true });
    });

    it('writes the merged environment and reports the mode', () => {
      const input = path.join(dir, 'base.json');
      const output = path.join(dir, 'env.json');
      fs.writeFileSync(input, JSON.stringify(importedEnv()));
      const write = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);

      main([input, output], { MOCKOON_SPA_ORIGIN: SPA, MOCKOON_OAUTH_MODE: 'provider' });

      expect(JSON.parse(fs.readFileSync(output, 'utf8')).routes).toHaveLength(5);
      expect(fs.readFileSync(output, 'utf8').endsWith('}\n')).toBe(true);
      expect(write).toHaveBeenCalledWith(
        'mockoon-social-oauth: added social OAuth routes (mode: provider)\n'
      );
      write.mockRestore();
    });

    it('requires both paths', () => {
      expect(() => main([path.join(dir, 'base.json')], {})).toThrow(
        'usage: mockoon-social-oauth.js <imported.json> <output.json>'
      );
    });
  });
});
