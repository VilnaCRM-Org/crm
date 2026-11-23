const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  PROVIDER_PATTERN,
  REDIRECT_URI_PATTERN,
  STATE_PATTERN,
  SCENARIOS,
  addConsentRoute,
  main,
} = require('../../../scripts/mockoon-social-oauth');

const importedEnv = () => ({
  uuid: 'env',
  routes: [{ uuid: 'health', method: 'get', endpoint: 'api/health', responses: [] }],
  rootChildren: [{ type: 'route', uuid: 'health' }],
  cors: true,
});

describe('mockoon-social-oauth', () => {
  it('puts the consent page ahead of the imported routes and keeps them', () => {
    const merged = addConsentRoute(importedEnv());

    expect(merged.routes.map((r) => `${r.method} ${r.endpoint}`)).toEqual([
      'get __mock-oauth/:provider/authorize',
      'get api/health',
    ]);
    expect(merged.rootChildren.map((c) => c.uuid)).toEqual(merged.routes.map((r) => r.uuid));
    expect(merged.cors).toBe(true);
  });

  it('refuses to shadow a consent route the imported spec already declares', () => {
    const env = importedEnv();
    env.routes.push({ method: 'get', endpoint: '__mock-oauth/:provider/authorize', responses: [] });

    expect(() => addConsentRoute(env)).toThrow(
      'the imported spec already declares __mock-oauth/:provider/authorize; delete this overlay.'
    );
  });

  it('links every scenario and a denial back to the redirect URI with the given state', () => {
    const [response] = addConsentRoute(importedEnv()).routes[0].responses;
    const back = "{{queryParam 'redirect_uri'}}";
    const state = "{{queryParam 'state'}}";

    expect(response).toMatchObject({ default: false, statusCode: 200, rulesOperator: 'AND' });
    expect(response.headers).toEqual([{ key: 'Content-Type', value: 'text/html; charset=utf-8' }]);
    for (const [code, label] of Object.entries(SCENARIOS)) {
      expect(response.body).toContain(
        `<a href="${back}?code=${code}&amp;state=${state}">${label}</a>`
      );
    }
    expect(response.body).toContain(
      `<a href="${back}?error=access_denied&amp;state=${state}">Deny</a>`
    );
    expect(response.body).toContain('<html lang="en">');
    expect(Object.keys(SCENARIOS)).toEqual([
      'mock-success',
      'mock-2fa',
      'mock-expired',
      'mock-unverified',
      'mock-no-email',
      'mock-duplicate',
      'mock-unavailable',
    ]);
  });

  describe('reflected input', () => {
    const rules = () => addConsentRoute(importedEnv()).routes[0].responses[0].rules;
    const matches = (pattern, value) => new RegExp(pattern).test(value);

    it('renders the page only when the provider, redirect URI and state all match', () => {
      expect(rules()).toEqual([
        {
          target: 'params',
          modifier: 'provider',
          value: PROVIDER_PATTERN,
          invert: false,
          operator: 'regex',
        },
        {
          target: 'query',
          modifier: 'redirect_uri',
          value: REDIRECT_URI_PATTERN,
          invert: false,
          operator: 'regex',
        },
        {
          target: 'query',
          modifier: 'state',
          value: STATE_PATTERN,
          invert: false,
          operator: 'regex',
        },
      ]);
    });

    it('rejects anything else with a plain-text 400 that reflects nothing', () => {
      const [, rejected] = addConsentRoute(importedEnv()).routes[0].responses;

      expect(rejected).toMatchObject({
        default: true,
        statusCode: 400,
        body: 'Invalid mock consent request.',
        rules: [],
        headers: [{ key: 'Content-Type', value: 'text/plain; charset=utf-8' }],
      });
    });

    it.each([
      ['http://localhost:3000/auth/callback/google', true],
      ['https://crm.localhost:3001/auth/callback/twitter', true],
      ['http://localhost/auth/callback/github', true],
      ['http://evil.test/auth/callback/google', false],
      ['http://localhost.evil.test/auth/callback/google', false],
      ['javascript:alert(1)//localhost/auth/callback/google', false],
      ['http://localhost:3000/auth/callback/google"><script>', false],
      ['http://localhost:3000/auth/callback/myspace', false],
      ['http://localhost:3000/sign-in', false],
    ])('accepts %s as a redirect URI: %s', (value, expected) => {
      expect(matches(REDIRECT_URI_PATTERN, value)).toBe(expected);
    });

    it.each([
      ['3f2504e0-4f89-41d3-9a0c-0305e82c3301', true],
      ['link.3f2504e0-4f89-41d3-9a0c-0305e82c3301', true],
      ['linkx3f2504e0-4f89-41d3-9a0c-0305e82c3301', false],
      ['link.', false],
      ['"><script>alert(1)</script>', false],
      ['3F2504E0-4F89-41D3-9A0C-0305E82C3301', false],
      ['', false],
    ])('accepts %s as a state: %s', (value, expected) => {
      expect(matches(STATE_PATTERN, value)).toBe(expected);
    });

    it.each([
      ['google', true],
      ['twitter', true],
      ['<b>google</b>', false],
      ['googlex', false],
    ])('accepts %s as a provider: %s', (value, expected) => {
      expect(matches(PROVIDER_PATTERN, value)).toBe(expected);
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

    it('writes the merged environment and reports it', () => {
      const input = path.join(dir, 'base.json');
      const output = path.join(dir, 'env.json');
      fs.writeFileSync(input, JSON.stringify(importedEnv()));
      const write = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);

      try {
        main([input, output]);

        expect(JSON.parse(fs.readFileSync(output, 'utf8')).routes).toHaveLength(2);
        expect(fs.readFileSync(output, 'utf8').endsWith('}\n')).toBe(true);
        expect(write).toHaveBeenCalledWith('mockoon-social-oauth: added the mock consent page\n');
      } finally {
        write.mockRestore();
      }
    });

    it('requires both paths', () => {
      expect(() => main([path.join(dir, 'base.json')])).toThrow(
        'usage: mockoon-social-oauth.js <imported.json> <output.json>'
      );
    });
  });
});
