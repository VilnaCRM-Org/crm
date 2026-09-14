import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { buildHttpUrl } from '@tests/builders';

import {
  loadBuildEnv,
  renderServeJson as composeServeJson,
} from '../../../scripts/generate-serve-config';
import * as headerRenderer from '../../../scripts/render-security-headers';
import {
  CSP_HEADER,
  assertBaselineFloors,
  buildCsp,
  extendRuntimeConnectSrc,
  loadPolicy,
  originOf,
  originsFromEnv,
  parseCsp,
  renderServeConfig as composeServeConfig,
  serializeCsp,
} from '../../../scripts/security-headers';

type Policy = ReturnType<typeof loadPolicy>;

const projectRoot = resolve(__dirname, '../../..');

const clonePolicy = (): Policy => JSON.parse(JSON.stringify(loadPolicy())) as Policy;

type HeaderRules = { headers: Array<{ headers: Array<{ key: string; value: string }> }> };

const cspOf = (serveConfig: HeaderRules): string =>
  serveConfig.headers[0]?.headers.find((header) => header.key === CSP_HEADER)?.value ?? '';

describe('scripts/security-headers.js (issue #113)', () => {
  describe('originOf', () => {
    it('reduces an http(s) URL to its origin', () => {
      const url = buildHttpUrl();

      expect(originOf(`${url}/api/users?x=1`)).toBe(new URL(url).origin);
    });

    it.each(['', '   ', undefined, 'not a url', 'ftp://files.example/api', 'mailto:a@b.c'])(
      'returns null for %p',
      (raw) => {
        expect(originOf(raw)).toBeNull();
      }
    );
  });

  describe('originsFromEnv', () => {
    it('collects distinct origins in variable order and skips empty values', () => {
      const env = {
        A: 'https://api.example/v1',
        B: '',
        C: 'https://api.example/other',
        D: 'https://graphql.example/graphql',
      };

      expect(originsFromEnv(['A', 'B', 'C', 'D', 'E'], env)).toEqual([
        'https://api.example',
        'https://graphql.example',
      ]);
    });

    it('refuses a non-empty value that is not an absolute http(s) URL', () => {
      expect(() =>
        originsFromEnv(['APP_CONFIG_API_BASE_URL'], { APP_CONFIG_API_BASE_URL: 'nope' })
      ).toThrow('APP_CONFIG_API_BASE_URL must be an absolute http or https URL, got "nope".');
    });
  });

  describe('CSP serialization', () => {
    it('round-trips a policy through serialize and parse', () => {
      const directives = clonePolicy().contentSecurityPolicy.directives;

      expect(parseCsp(serializeCsp(directives))).toEqual(directives);
    });

    it('appends extra connect-src origins once and leaves every other directive untouched', () => {
      const policy = clonePolicy();
      const csp = parseCsp(buildCsp(policy, ['https://api.example', 'https://api.example']));

      expect(csp['connect-src']).toEqual(["'self'", 'https://api.example']);
      expect(csp['script-src']).toEqual(policy.contentSecurityPolicy.directives['script-src']);
      expect(csp['frame-ancestors']).toEqual(["'none'"]);
    });
  });

  describe('composeServeConfig (renderServeConfig)', () => {
    it('derives connect-src from the build-time env and keeps unrelated serve keys', () => {
      const policy = clonePolicy();
      const rendered = composeServeConfig(
        policy,
        {
          REACT_APP_MOCKOON_URL: 'http://localhost:8080',
          REACT_APP_GRAPHQL_URL: 'http://localhost:4000/graphql',
        },
        { cleanUrls: false }
      );

      expect(rendered.cleanUrls).toBe(false);
      expect(parseCsp(cspOf(rendered))['connect-src']).toEqual([
        "'self'",
        'http://localhost:8080',
        'http://localhost:4000',
      ]);
      expect(rendered.headers.map((rule) => rule.source)).toEqual([
        '**',
        '/',
        '/index.html',
        '/site.webmanifest',
        '/static/**',
      ]);
    });

    it('emits every static header of the policy after the CSP', () => {
      const policy = clonePolicy();
      const [security] = composeServeConfig(policy, {}).headers;

      expect(security?.headers.map((header) => header.key)).toEqual([
        CSP_HEADER,
        ...policy.headers.map((header) => header.key),
      ]);
    });
  });

  describe('extendRuntimeConnectSrc', () => {
    it('appends runtime API origins to connect-src, idempotently', () => {
      const policy = clonePolicy();
      const serveConfig = composeServeConfig(policy, {
        REACT_APP_MOCKOON_URL: 'http://localhost:8080',
      });
      const env = {
        APP_CONFIG_API_BASE_URL: 'https://api.example/api',
        APP_CONFIG_GRAPHQL_URL: 'https://graphql.example/graphql',
      };

      expect(extendRuntimeConnectSrc(serveConfig, policy, env)).toEqual([
        'https://api.example',
        'https://graphql.example',
      ]);
      extendRuntimeConnectSrc(serveConfig, policy, env);

      expect(parseCsp(cspOf(serveConfig))['connect-src']).toEqual([
        "'self'",
        'http://localhost:8080',
        'https://api.example',
        'https://graphql.example',
      ]);
    });

    it('leaves serve.json unchanged when no runtime override is set', () => {
      const policy = clonePolicy();
      const serveConfig = composeServeConfig(policy, {});
      const before = JSON.stringify(serveConfig);

      expect(extendRuntimeConnectSrc(serveConfig, policy, {})).toEqual([]);
      expect(JSON.stringify(serveConfig)).toBe(before);
    });

    it('refuses a serve.json that carries no CSP for the policy source', () => {
      expect(() => extendRuntimeConnectSrc({ headers: [] }, clonePolicy(), {})).toThrow(
        'serve.json carries no Content-Security-Policy header for source "**".'
      );
    });
  });

  describe('assertBaselineFloors', () => {
    it('accepts the committed policy', () => {
      expect(() => assertBaselineFloors(clonePolicy())).not.toThrow();
    });

    const withHeader = (policy: Policy, key: string, value: string): Policy => ({
      ...policy,
      headers: policy.headers.map((h) => (h.key === key ? { key, value } : h)),
    });
    const withoutHeader = (policy: Policy, key: string): Policy => ({
      ...policy,
      headers: policy.headers.filter((h) => h.key !== key),
    });
    const withDirective = (policy: Policy, directive: string, sources: string[]): Policy => ({
      ...policy,
      contentSecurityPolicy: {
        ...policy.contentSecurityPolicy,
        directives: { ...policy.contentSecurityPolicy.directives, [directive]: sources },
      },
    });
    const scriptSrc = (policy: Policy): string[] =>
      policy.contentSecurityPolicy.directives['script-src'] ?? [];

    it.each<[string, (policy: Policy) => Policy, string]>([
      [
        'nosniff removed',
        (policy): Policy => withoutHeader(policy, 'X-Content-Type-Options'),
        'X-Content-Type-Options is missing',
      ],
      [
        'HSTS max-age below 180 days',
        (policy): Policy =>
          withHeader(policy, 'Strict-Transport-Security', 'max-age=3600; includeSubDomains'),
        'Strict-Transport-Security "max-age=3600; includeSubDomains" is weaker',
      ],
      [
        'HSTS without includeSubDomains',
        (policy): Policy => withHeader(policy, 'Strict-Transport-Security', 'max-age=31536000'),
        'Strict-Transport-Security "max-age=31536000" is weaker',
      ],
      [
        'X-Frame-Options ALLOWALL',
        (policy): Policy => withHeader(policy, 'X-Frame-Options', 'ALLOWALL'),
        'X-Frame-Options "ALLOWALL" is weaker',
      ],
      [
        'unsafe-eval on script-src',
        (policy): Policy =>
          withDirective(policy, 'script-src', [...scriptSrc(policy), "'unsafe-eval'"]),
        "script-src must not carry 'unsafe-eval'",
      ],
      [
        'unsafe-inline on script-src',
        (policy): Policy =>
          withDirective(policy, 'script-src', [...scriptSrc(policy), "'unsafe-inline'"]),
        "script-src must not carry 'unsafe-inline'",
      ],
      [
        'frame-ancestors widened',
        (policy): Policy => withDirective(policy, 'frame-ancestors', ["'self'"]),
        "frame-ancestors must be exactly 'none'",
      ],
      [
        'object-src widened',
        (policy): Policy => withDirective(policy, 'object-src', ["'self'"]),
        "object-src must be exactly 'none'",
      ],
      [
        'default-src wildcard',
        (policy): Policy => withDirective(policy, 'default-src', ['*']),
        "default-src must be exactly 'self'",
      ],
      [
        'wildcard on any directive',
        (policy): Policy => withDirective(policy, 'img-src', ["'self'", '*']),
        'img-src must not carry the * wildcard',
      ],
    ])('rejects a policy with %s', (_label, weaken, message) => {
      expect(() => assertBaselineFloors(weaken(clonePolicy()))).toThrow(message);
    });
  });

  describe('loadPolicy', () => {
    it('refuses a malformed policy file', () => {
      const dir = mkdtempSync(join(tmpdir(), 'security-headers-'));
      const file = join(dir, 'policy.json');

      writeFileSync(file, JSON.stringify({ headers: [] }));

      expect(() => loadPolicy(file)).toThrow('config/security-headers.json is malformed');
    });

    it('refuses a weakened policy file', () => {
      const dir = mkdtempSync(join(tmpdir(), 'security-headers-'));
      const file = join(dir, 'policy.json');
      const policy = clonePolicy();

      policy.contentSecurityPolicy.directives['object-src'] = ["'self'"];
      writeFileSync(file, JSON.stringify(policy));

      expect(() => loadPolicy(file)).toThrow("object-src must be exactly 'none'");
    });
  });
});

describe('scripts/generate-serve-config.js (issue #113)', () => {
  it('expands dotenv references without touching process.env', () => {
    const dir = mkdtempSync(join(tmpdir(), 'serve-config-'));
    const dotenv = join(dir, '.env');

    writeFileSync(
      dotenv,
      [
        'WEBSITE_DOMAIN=localhost',
        'MOCKOON_PORT=8080',
        'REACT_APP_MOCKOON_URL=http://${WEBSITE_DOMAIN}:${MOCKOON_PORT}',
        '',
      ].join('\n')
    );

    expect(loadBuildEnv(dotenv)).toMatchObject({ REACT_APP_MOCKOON_URL: 'http://localhost:8080' });
    expect(process.env.WEBSITE_DOMAIN).toBeUndefined();
  });

  it('returns an empty environment when the dotenv file is absent', () => {
    expect(loadBuildEnv(join(tmpdir(), 'absent-serve-config', '.env'))).toEqual({});
  });

  it('renders the committed serve.json byte for byte from the committed policy and .env', () => {
    const policy = loadPolicy();
    const env = loadBuildEnv(join(projectRoot, '.env'));
    const committed = readFileSync(join(projectRoot, 'serve.json'), 'utf8');

    expect(composeServeJson(policy, env, JSON.parse(committed))).toBe(committed);
  });
});

describe('scripts/render-security-headers.js (issue #113)', () => {
  it('rewrites only the connect-src directive of the served config', () => {
    const policy = loadPolicy();
    const committed = readFileSync(join(projectRoot, 'serve.json'), 'utf8');
    const { origins, rendered } = headerRenderer.renderSecurityHeaders(
      committed,
      { APP_CONFIG_API_BASE_URL: 'https://api.vilnacrm.example/api' },
      policy
    );
    const before = parseCsp(cspOf(JSON.parse(committed)));
    const after = parseCsp(cspOf(JSON.parse(rendered)));

    expect(origins).toEqual(['https://api.vilnacrm.example']);
    expect(after['connect-src']).toEqual([
      ...(before['connect-src'] ?? []),
      'https://api.vilnacrm.example',
    ]);
    expect({ ...after, 'connect-src': undefined }).toEqual({ ...before, 'connect-src': undefined });
    expect(rendered.replace(/"value": "default-src[^"]*"/, '')).toBe(
      committed.replace(/"value": "default-src[^"]*"/, '')
    );
  });
});
