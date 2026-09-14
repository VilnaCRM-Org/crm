import fs from 'fs';
import path from 'path';

jest.mock('k6', () => ({ check: jest.fn() }), { virtual: true });

type K6Globals = { __ENV: Record<string, string | undefined>; open: (file: string) => string };

const k6 = globalThis as unknown as K6Globals;
const configPath = path.resolve(__dirname, '../../load/config.json.dist');
const configSource = fs.readFileSync(configPath, 'utf8');

const baseUrlOf = async (
  endpoint: string,
  env: Record<string, string | undefined>
): Promise<string> => {
  k6.__ENV = env;
  k6.open = (file: string): string => {
    if (file === 'config.json') throw new Error('absent');
    return configSource;
  };
  jest.resetModules();
  const { default: Utils } = (await import('../../load/utils/utils.js')) as {
    default: new (endpoint?: string) => { getBaseUrl(): string };
  };
  return new Utils(endpoint).getBaseUrl();
};

describe('k6 target override (issue #148)', () => {
  it('keeps the config hosts when nothing is overridden', async () => {
    expect(await baseUrlOf('homepage', {})).toBe('http://prod:3001');
    expect(await baseUrlOf('signup', {})).toBe('http://mockoon:8080');
  });

  it('repoints an endpoint that inherits the top-level host through LOAD_TARGET_URL', async () => {
    expect(
      await baseUrlOf('homepage', { LOAD_TARGET_URL: 'https://staging.vilnacrm.example/' })
    ).toBe('https://staging.vilnacrm.example');
  });

  it('never repoints an endpoint with its own host through the generic variable', async () => {
    expect(await baseUrlOf('signup', { LOAD_TARGET_URL: 'https://staging.vilnacrm.example' })).toBe(
      'http://mockoon:8080'
    );
  });

  it('repoints an endpoint through its own LOAD_TARGET_URL_<ENDPOINT> variable', async () => {
    expect(
      await baseUrlOf('signup', {
        LOAD_TARGET_URL: 'https://staging.vilnacrm.example',
        LOAD_TARGET_URL_SIGNUP: 'https://api-staging.vilnacrm.example',
      })
    ).toBe('https://api-staging.vilnacrm.example');
  });

  it('treats an empty override as unset', async () => {
    expect(await baseUrlOf('homepage', { LOAD_TARGET_URL: '   ' })).toBe('http://prod:3001');
  });

  it('accepts an origin with a path prefix and a port', async () => {
    expect(await baseUrlOf('homepage', { LOAD_TARGET_URL: 'https://10.0.0.5:8080/crm/' })).toBe(
      'https://10.0.0.5:8080/crm'
    );
  });

  it.each(['http://localhost:3001', 'http://127.0.0.1:3001', 'http://prod:3001/app'])(
    'keeps plain http for the local or container target %s',
    async (value) => {
      expect(await baseUrlOf('homepage', { LOAD_TARGET_URL: value })).toBe(value);
    }
  );

  it.each(['http://staging.vilnacrm.example', 'http://10.0.0.5:8080'])(
    'refuses plain http for the remote target %s, which would carry credentials in cleartext',
    async (value) => {
      await expect(baseUrlOf('signup', { LOAD_TARGET_URL_SIGNUP: value })).rejects.toThrow(
        'LOAD_TARGET_URL_SIGNUP must use https for a remote target'
      );
    }
  );

  it.each([
    'staging.vilnacrm.example',
    'ftp://files.example',
    'not a url',
    'https://staging.vilnacrm.example/path with space',
    'https://staging.vilnacrm.example/?q=1',
    'https://staging.vilnacrm.example/#fragment',
    'https://user:pass@staging.vilnacrm.example',
    'https://staging.vilnacrm.example/a b',
  ])('aborts on the malformed target %p', async (value) => {
    const reason = 'must be an absolute http(s) origin with an optional path';
    const message = `${reason}, got "${value}"`;

    await expect(baseUrlOf('homepage', { LOAD_TARGET_URL: value })).rejects.toThrow(
      `LOAD_TARGET_URL ${message}`
    );
  });

  it('names the endpoint-specific variable in its own error', async () => {
    await expect(baseUrlOf('signup', { LOAD_TARGET_URL_SIGNUP: 'nope' })).rejects.toThrow(
      'LOAD_TARGET_URL_SIGNUP must be an absolute http(s) origin with an optional path'
    );
  });
});

describe('k6 budgets are calibrated and documented (issue #148)', () => {
  const config = JSON.parse(configSource) as {
    endpoints: Record<
      string,
      Record<string, { threshold?: number }> & {
        thresholds?: { errorRate: Record<string, number>; checkPassRate: Record<string, number> };
      }
    >;
  };
  const usage = fs.readFileSync(path.resolve(__dirname, '../../load/usage.md'), 'utf8');

  it.each([
    ['homepage', 'smoke', 1000],
    ['homepage', 'average', 1500],
    ['homepage', 'stress', 3000],
    ['homepage', 'spike', 5000],
    ['signup', 'smoke', 1500],
    ['signup', 'average', 2000],
    ['signup', 'stress', 4000],
    ['signup', 'spike', 6000],
  ])('%s %s keeps its p(99) budget at %d ms', (endpoint, scenario, budget) => {
    expect(config.endpoints[endpoint]?.[scenario]?.threshold).toBe(budget);
    expect(usage).toMatch(new RegExp(`\\| ${endpoint}\\s+\\| ${scenario}\\s+\\|`));
    expect(usage).toContain(`${String(budget).replace(/(\d)(\d{3})$/, '$1 $2')} ms`);
  });

  it('keeps the gate scenarios at a near-zero failure tolerance', () => {
    expect(config.endpoints.signup?.thresholds?.errorRate).toEqual({
      smoke: 0,
      average: 0,
      stress: 0.02,
      spike: 0.05,
    });
    expect(config.endpoints.signup?.thresholds?.checkPassRate).toEqual({
      smoke: 0.99,
      average: 0.99,
      stress: 0.95,
      spike: 0.9,
    });
  });

  it('passes the target overrides through the k6 compose service', () => {
    const compose = fs.readFileSync(
      path.resolve(__dirname, '../../../docker-compose.test.yml'),
      'utf8'
    );

    expect(compose).toContain('- LOAD_TARGET_URL=${LOAD_TARGET_URL-}');
    expect(compose).toContain('- LOAD_TARGET_URL_SIGNUP=${LOAD_TARGET_URL_SIGNUP-}');
    expect(usage).toContain('LOAD_TARGET_URL_SIGNUP=https://');
  });
});
