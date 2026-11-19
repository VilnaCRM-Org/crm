const fs = require('fs');
const os = require('os');
const path = require('path');

const { SCENARIOS, addConsentRoute, main } = require('../../../scripts/mockoon-social-oauth');

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

    expect(response).toMatchObject({ default: true, statusCode: 200, rules: [] });
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

      main([input, output]);

      expect(JSON.parse(fs.readFileSync(output, 'utf8')).routes).toHaveLength(2);
      expect(fs.readFileSync(output, 'utf8').endsWith('}\n')).toBe(true);
      expect(write).toHaveBeenCalledWith('mockoon-social-oauth: added the mock consent page\n');
      write.mockRestore();
    });

    it('requires both paths', () => {
      expect(() => main([path.join(dir, 'base.json')])).toThrow(
        'usage: mockoon-social-oauth.js <imported.json> <output.json>'
      );
    });
  });
});
