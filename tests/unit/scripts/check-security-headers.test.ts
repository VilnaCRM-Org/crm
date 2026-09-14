import { execFile } from 'node:child_process';
import { createServer, type Server } from 'node:http';
import { resolve } from 'node:path';

import {
  CSP_HEADER,
  documentHeaders,
  loadPolicy,
  responseHeaders,
} from '../../../scripts/security-headers';

type HeaderList = Array<{ key: string; value: string }>;

const projectRoot = resolve(__dirname, '../../..');
const GATE = resolve(projectRoot, 'scripts/ci/check-security-headers.mjs');
const SHELL = [
  '<!doctype html><html><head>',
  '<script defer src="/static/js/main.abc123.js"></script>',
  '</head></html>',
].join('');
const RUNTIME_ORIGIN = 'https://api.vilnacrm.example';

const baseline = (): HeaderList => {
  const policy = loadPolicy();

  return [
    ...responseHeaders(policy),
    ...documentHeaders(policy, ['http://localhost:8080', 'http://localhost:4000']),
  ];
};

const cacheControlFor = (path: string): string => {
  if (path.startsWith('/static/')) return 'public, max-age=31536000, immutable';
  if (path === '/site.webmanifest') return 'public, max-age=3600';
  return 'no-cache';
};

async function serve(
  headers: HeaderList,
  cacheControl: (path: string) => string = cacheControlFor
): Promise<{ url: string; close: () => Promise<void> }> {
  const documentKeys = new Set([CSP_HEADER, ...loadPolicy().document.headers.map((h) => h.key)]);
  const server: Server = createServer((request, response) => {
    const path = request.url ?? '/';
    const isDocument = path === '/' || path === '/sign-in';
    for (const { key, value } of headers) {
      if (isDocument || !documentKeys.has(key)) response.setHeader(key, value);
    }
    response.setHeader('Cache-Control', cacheControl(path));
    response.writeHead(200, { 'Content-Type': path === '/' ? 'text/html' : 'text/plain' });
    response.end(path === '/' ? SHELL : 'ok');
  });
  await new Promise<void>((done) => server.listen(0, '127.0.0.1', done));
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;
  return {
    url: `http://127.0.0.1:${port}`,
    close: () => new Promise<void>((done) => server.close(() => done())),
  };
}

type GateRun = { status: number; stderr: string; stdout: string };

const runNode = (args: string[]): Promise<GateRun> =>
  new Promise((done) => {
    execFile('node', args, { cwd: projectRoot, encoding: 'utf8' }, (error, stdout, stderr) => {
      const status = error && typeof error.code === 'number' ? error.code : error ? 1 : 0;
      done({ status, stderr, stdout });
    });
  });

const runGate = (url: string, ...extra: string[]): Promise<GateRun> =>
  runNode([GATE, '--url', url, ...extra]);

const withHeader = (headers: HeaderList, key: string, value: string): HeaderList =>
  headers.map((header) => (header.key === key ? { key, value } : header));

const withoutHeader = (headers: HeaderList, key: string): HeaderList =>
  headers.filter((header) => header.key !== key);

const cspOf = (headers: HeaderList): string =>
  headers.find((header) => header.key === CSP_HEADER)?.value ?? '';

describe('scripts/ci/check-security-headers.mjs (issue #113)', () => {
  it('passes when every probed response carries the committed baseline', async () => {
    const server = await serve(baseline());
    try {
      const { status, stdout } = await runGate(server.url);

      expect(status).toBe(0);
      expect(stdout).toContain('4 responses from');
    } finally {
      await server.close();
    }
  });

  it('passes when the runtime API origin is present in connect-src', async () => {
    const headers = baseline();
    const server = await serve(
      withHeader(
        headers,
        CSP_HEADER,
        cspOf(headers).replace('connect-src', `connect-src ${RUNTIME_ORIGIN}`)
      )
    );
    try {
      expect((await runGate(server.url, '--expect-connect', RUNTIME_ORIGIN)).status).toBe(0);
    } finally {
      await server.close();
    }
  });

  it.each<[string, (headers: HeaderList) => HeaderList, string]>([
    [
      'X-Content-Type-Options is dropped',
      (headers): HeaderList => withoutHeader(headers, 'X-Content-Type-Options'),
      'missing X-Content-Type-Options',
    ],
    [
      'the CSP is dropped',
      (headers): HeaderList => withoutHeader(headers, CSP_HEADER),
      `missing ${CSP_HEADER}`,
    ],
    [
      'HSTS is shortened',
      (headers): HeaderList => withHeader(headers, 'Strict-Transport-Security', 'max-age=60'),
      'Strict-Transport-Security is "max-age=60"',
    ],
    [
      'script-src gains unsafe-eval',
      (headers): HeaderList =>
        withHeader(
          headers,
          CSP_HEADER,
          cspOf(headers).replace("script-src 'self'", "script-src 'self' 'unsafe-eval'")
        ),
      "script-src is \"'self' 'unsafe-eval'\"",
    ],
    [
      'frame-ancestors is widened',
      (headers): HeaderList =>
        withHeader(
          headers,
          CSP_HEADER,
          cspOf(headers).replace("frame-ancestors 'none'", "frame-ancestors 'self'")
        ),
      'frame-ancestors is "\'self\'"',
    ],
    [
      'connect-src gains a wildcard',
      (headers): HeaderList =>
        withHeader(headers, CSP_HEADER, cspOf(headers).replace('connect-src', 'connect-src *')),
      'connect-src carries unauthorized source *',
    ],
    [
      'connect-src gains an origin the baseline never authorized',
      (headers): HeaderList =>
        withHeader(
          headers,
          CSP_HEADER,
          cspOf(headers).replace('connect-src', 'connect-src https://exfil.example')
        ),
      'connect-src carries unauthorized source https://exfil.example',
    ],
    [
      'a directive is repeated so the browser would enforce the first, weaker one',
      (headers): HeaderList =>
        withHeader(headers, CSP_HEADER, `script-src 'unsafe-inline'; ${cspOf(headers)}`),
      'repeats the script-src directive',
    ],
    [
      'an undeclared directive relaxes what script-src locked',
      (headers): HeaderList =>
        withHeader(headers, CSP_HEADER, `${cspOf(headers)}; script-src-elem 'unsafe-inline'`),
      'carries undeclared directive script-src-elem',
    ],
    [
      'a directive disappears',
      (headers): HeaderList =>
        withHeader(headers, CSP_HEADER, cspOf(headers).replace("; object-src 'none'", '')),
      'lacks object-src',
    ],
  ])('fails when %s', async (_label, weaken, finding) => {
    const server = await serve(weaken(baseline()));
    try {
      const { status, stderr } = await runGate(server.url);

      expect(status).toBe(1);
      expect(stderr).toContain(finding);
    } finally {
      await server.close();
    }
  });

  it('fails when the expected runtime origin never reached connect-src', async () => {
    const server = await serve(baseline());
    try {
      const { status, stderr } = await runGate(server.url, '--expect-connect', RUNTIME_ORIGIN);

      expect(status).toBe(1);
      expect(stderr).toContain(`connect-src lacks ${RUNTIME_ORIGIN}`);
    } finally {
      await server.close();
    }
  });

  it('fails when the immutable static-asset Cache-Control rule regresses', async () => {
    const server = await serve(baseline(), (path) =>
      path.startsWith('/static/') ? 'no-store' : cacheControlFor(path)
    );
    try {
      const { status, stderr } = await runGate(server.url);

      expect(status).toBe(1);
      expect(stderr).toContain(
        'Cache-Control is "no-store", expected "public, max-age=31536000, immutable"'
      );
    } finally {
      await server.close();
    }
  });

  it('refuses to run without a base URL', async () => {
    const result = await runNode([GATE]);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('--url <base-url> is required');
  });

  it('fails closed when the server is unreachable', async () => {
    const { status, stderr } = await runGate('http://127.0.0.1:9');

    expect(status).toBe(1);
    expect(stderr).toContain('check-security-headers:');
  });
});
