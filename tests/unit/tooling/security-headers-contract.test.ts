/**
 * @jest-environment @stryker-mutator/jest-runner/jest-env/node
 */

import fs from 'fs';
import path from 'path';

import Ajv from 'ajv';

import { CSP_HEADER, loadPolicy, parseCsp } from '../../../scripts/security-headers';

const repoRoot = path.resolve(__dirname, '..', '..', '..');

const readRepoFile = (relativePath: string): string =>
  fs.readFileSync(path.join(repoRoot, relativePath), 'utf-8');

const readJson = <T>(relativePath: string): T => JSON.parse(readRepoFile(relativePath)) as T;

const directivesOf = (contents: string): string => contents.replace(/^[ \t]*#.*$/gm, '');

const recipeOf = (makefile: string, target: string): string => {
  const match = makefile.match(new RegExp(`^${target}:.*\\n((?:\\t.*\\n)+)`, 'm'));

  expect(match).not.toBeNull();

  return match?.[1] ?? '';
};

type ServeConfig = {
  headers: Array<{ source: string; headers: Array<{ key: string; value: string }> }>;
};

const policy = loadPolicy();
const serveConfig = readJson<ServeConfig>('serve.json');
const securityRule = serveConfig.headers.find((rule) => rule.source === policy.source);
const servedCsp = parseCsp(
  securityRule?.headers.find((header) => header.key === CSP_HEADER)?.value ?? ''
);

describe('browser security-header baseline (issue #113)', () => {
  it('validates config/security-headers.json against its schema', () => {
    const ajv = new Ajv({ allErrors: true });
    const validate = ajv.compile(readJson<object>('config/security-headers.schema.json'));

    expect(validate(readJson<object>('config/security-headers.json'))).toBe(true);
  });

  it('rejects an unknown top-level policy key through the schema', () => {
    const ajv = new Ajv({ allErrors: true });
    const validate = ajv.compile(readJson<object>('config/security-headers.schema.json'));

    expect(validate({ ...readJson<object>('config/security-headers.json'), extra: true })).toBe(
      false
    );
  });

  it('declares the complete header set the issue requires', () => {
    expect(policy.headers.map((header) => header.key)).toEqual([
      'Strict-Transport-Security',
      'X-Frame-Options',
      'X-Content-Type-Options',
      'Referrer-Policy',
      'Permissions-Policy',
      'Cross-Origin-Opener-Policy',
      'Cross-Origin-Resource-Policy',
    ]);
  });

  it('keeps script-src strict and scopes the Emotion accommodation to style-src alone', () => {
    const { directives } = policy.contentSecurityPolicy;

    expect(directives['script-src']).toEqual(["'self'"]);
    expect(directives['style-src']).toEqual(["'self'", "'unsafe-inline'"]);
    expect(
      Object.entries(directives).filter(([, sources]) => sources.includes("'unsafe-inline'"))
    ).toEqual([['style-src', ["'self'", "'unsafe-inline'"]]]);
    expect(directives['default-src']).toEqual(["'self'"]);
    expect(directives['frame-ancestors']).toEqual(["'none'"]);
    expect(directives['base-uri']).toEqual(["'self'"]);
    expect(directives['object-src']).toEqual(["'none'"]);
  });

  it('derives connect-src from the build-time and runtime API variables the app reads', () => {
    expect(policy.contentSecurityPolicy.connectSrcFromEnv).toEqual({
      build: ['REACT_APP_MOCKOON_URL', 'REACT_APP_GRAPHQL_URL', 'REACT_APP_SENTRY_DSN'],
      runtime: ['APP_CONFIG_API_BASE_URL', 'APP_CONFIG_GRAPHQL_URL'],
    });

    const rawEnv = readRepoFile('src/config/env/raw-env.ts');
    const renderer = readRepoFile('scripts/render-app-config.js');

    for (const variable of policy.contentSecurityPolicy.connectSrcFromEnv.build) {
      expect(rawEnv).toContain(`process.env.${variable}`);
    }
    for (const variable of policy.contentSecurityPolicy.connectSrcFromEnv.runtime) {
      expect(renderer).toContain(`'${variable}'`);
    }
  });

  it('applies the security rule to every response and carries the build-time API origins', () => {
    expect(serveConfig.headers[0]?.source).toBe(policy.source);
    expect(policy.source).toBe('**');
    expect(servedCsp['connect-src']).toEqual([
      "'self'",
      'http://localhost:8080',
      'http://localhost:4000',
    ]);
    for (const { key, value } of policy.headers) {
      expect(securityRule?.headers).toContainEqual({ key, value });
    }
  });

  it('preserves the pre-existing Cache-Control rules verbatim', () => {
    expect(policy.cacheControl).toEqual([
      { source: '/', value: 'no-cache' },
      { source: '/index.html', value: 'no-cache' },
      { source: '/site.webmanifest', value: 'public, max-age=3600' },
      { source: '/static/**', value: 'public, max-age=31536000, immutable' },
    ]);
    for (const { source, value } of policy.cacheControl) {
      expect(serveConfig.headers).toContainEqual({
        source,
        headers: [{ key: 'Cache-Control', value }],
      });
    }
  });

  it('keeps the HTML shell free of a duplicated meta CSP', () => {
    expect(readRepoFile('public/index.html')).not.toMatch(/http-equiv/i);
  });

  it('ships the renderer, the shared module and the policy in the runtime image', () => {
    const dockerfile = readRepoFile('Dockerfile');

    expect(dockerfile).toContain(
      'COPY --chown=node:node scripts/docker-entrypoint.sh scripts/render-app-config.js ' +
        'scripts/render-security-headers.js scripts/security-headers.js ./scripts/'
    );
    expect(dockerfile).toContain('COPY --chown=node:node config/security-headers.json ./config/');
  });

  it('extends connect-src at container start, after the app-config render and before exec', () => {
    const entrypoint = directivesOf(readRepoFile('scripts/docker-entrypoint.sh'));
    const appConfig = entrypoint.indexOf('node "$APP_CONFIG_RENDERER" "$APP_CONFIG_HTML"');
    const headers = entrypoint.indexOf('node "$SECURITY_HEADERS_RENDERER" "$SERVE_CONFIG"');
    const handoff = entrypoint.indexOf('exec "$@"');

    expect(appConfig).toBeGreaterThan(-1);
    expect(headers).toBeGreaterThan(appConfig);
    expect(handoff).toBeGreaterThan(headers);
    expect(entrypoint).toContain('SERVE_CONFIG="${SERVE_CONFIG:-${APP_ROOT}/serve.json}"');
    expect(entrypoint).toContain('serve config not found at');
    expect(entrypoint).toContain('security-headers renderer not found at');
  });

  it('serves the same baseline from the RSBuild dev server', () => {
    const rsbuildConfig = readRepoFile('rsbuild.config.ts');

    expect(rsbuildConfig).toContain(
      "import { loadPolicy, originsFromEnv, securityHeaders } from './scripts/security-headers';"
    );
    expect(rsbuildConfig).toMatch(/server:\s*\{[^}]*headers: devSecurityHeaders/s);
  });

  it('gates serve.json drift inside make lint and probes the production image in CI', () => {
    const makefile = readRepoFile('Makefile');
    const lintTargets = makefile.match(/^lint: (.+?) ##/m)?.[1]?.split(/\s+/) ?? [];
    const ciLintTargets = makefile.match(/^CI_LINT_TARGETS\s*=\s*(.+)$/m)?.[1]?.split(/\s+/) ?? [];

    expect(lintTargets).toContain('lint-security-headers');
    expect(ciLintTargets).toContain('lint-security-headers');
    expect(recipeOf(makefile, 'lint-security-headers')).toContain(
      'node $(SERVE_CONFIG_GENERATOR) --check'
    );
    expect(recipeOf(makefile, 'security-headers-generate')).toContain(
      'node $(SERVE_CONFIG_GENERATOR)\n'
    );
    expect(recipeOf(makefile, 'check-security-headers')).toContain(
      'docker build -t $(SECURITY_HEADERS_PROBE_IMAGE) -f Dockerfile --target production .'
    );
    expect(recipeOf(makefile, 'check-security-headers')).toContain(
      'sh $(SECURITY_HEADERS_GATE_RUNNER)'
    );
    expect(makefile).toContain('SERVE_CONFIG_GENERATOR      = scripts/generate-serve-config.js');
    expect(makefile).toContain(
      'SECURITY_HEADERS_GATE_RUNNER = scripts/ci/check-security-headers.sh'
    );
  });

  it('runs the production-image probe on every pull request from the security workflow', () => {
    const workflow = directivesOf(readRepoFile('.github/workflows/security-testing.yml'));
    const job = workflow.slice(workflow.indexOf('security-headers:'));

    expect(job).toContain("if: github.event_name == 'pull_request'");
    expect(job).toContain('run: make check-security-headers');
    expect(job).toContain('persist-credentials: false');
  });

  it('documents the baseline, the style-src decision and the change procedure', () => {
    const security = readRepoFile('SECURITY.md');

    for (const { key } of policy.headers) {
      expect(security).toContain(`\`${key}\``);
    }
    expect(security).toContain("'unsafe-inline'");
    expect(security).toContain('make security-headers-generate');
    expect(security).toContain('make lint-security-headers');
    expect(security).toContain('make check-security-headers');
    expect(security).toContain('config/security-headers.json');
  });
});
