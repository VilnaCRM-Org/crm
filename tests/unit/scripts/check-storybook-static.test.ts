/**
 * @jest-environment @stryker-mutator/jest-runner/jest-env/node
 */
import { spawnSync } from 'child_process';
import { mkdtempSync, mkdirSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';

const SCRIPT = path.resolve(
  __dirname,
  '..',
  '..',
  '..',
  'scripts',
  'ci',
  'check-storybook-static.mjs'
);

const STORY_INDEX = JSON.stringify({
  v: 5,
  entries: { 'button--primary': { id: 'button--primary', type: 'story' } },
});

const MANAGER_PAGE = `<!doctype html>
<html>
  <head>
    <link rel="icon" type="image/svg+xml" href="./favicon.svg" />
    <link rel="prefetch" href="./sb-common-assets/nunito-sans-regular.woff2" as="font" />
    <link rel="stylesheet" href="https://example.com/remote.css" />
    <style>
      @font-face { src: url('./sb-common-assets/nunito-sans-regular.woff2') format('woff2'); }
    </style>
  </head>
  <body>
    <a href="#root">skip</a>
    <script type="module">
      import './sb-manager/globals-runtime.js';
      import './sb-manager/runtime.js';
    </script>
  </body>
</html>`;

const PREVIEW_PAGE = `<!doctype html>
<html>
  <head><base target="_parent" /></head>
  <body>
    <img src="data:image/png;base64,AAAA" alt="" />
    <script src="runtime~main.iframe.bundle.js?v=1"></script>
    <script src="./main.iframe.bundle.js#hash"></script>
  </body>
</html>`;

const VALID_BUILD: Record<string, string> = {
  'index.json': STORY_INDEX,
  'index.html': MANAGER_PAGE,
  'iframe.html': PREVIEW_PAGE,
  'favicon.svg': '<svg />',
  'sb-common-assets/nunito-sans-regular.woff2': 'font',
  'sb-common-assets/fonts.css': '@font-face { src: url(nunito-sans-regular.woff2); }',
  'sb-manager/globals-runtime.js': '',
  'sb-manager/runtime.js': '',
  'runtime~main.iframe.bundle.js': 'r.p="";r.l=(u)=>import("./main.iframe.bundle.js");',
  'main.iframe.bundle.js': 'const m=import("react");const g=import("./get");',
};

const makeBuild = (files: Record<string, string>): string => {
  const dir = mkdtempSync(path.join(tmpdir(), 'storybook-static-gate-'));
  for (const [name, contents] of Object.entries(files)) {
    const full = path.join(dir, name);
    mkdirSync(path.dirname(full), { recursive: true });
    writeFileSync(full, contents);
  }
  return dir;
};

const run = (dir: string, base?: string): { status: number | null; output: string } => {
  const args = base === undefined ? [SCRIPT, dir] : [SCRIPT, dir, base];
  const result = spawnSync(process.execPath, args, { encoding: 'utf8' });

  return { status: result.status, output: `${result.stdout}${result.stderr}` };
};

const withoutFile = (name: string): Record<string, string> =>
  Object.fromEntries(Object.entries(VALID_BUILD).filter(([file]) => file !== name));

describe('check-storybook-static (issue #310)', () => {
  it('passes a build whose every local reference resolves relatively', () => {
    const result = run(makeBuild(VALID_BUILD), '/crm/');

    expect(result.status).toBe(0);
    expect(result.output).toContain('resolves under /crm/.');
  });

  it('defaults to the origin root, where a root-absolute reference is in scope', () => {
    const page = PREVIEW_PAGE.replace('./main', '/main');
    const result = run(makeBuild({ ...VALID_BUILD, 'iframe.html': page }));

    expect(result.status).toBe(0);
    expect(result.output).toContain('resolves under /.');
  });

  it.each(['crm', '/crm', 'crm/', '//crm//'])('normalises the base path %s to /crm/', (base) => {
    const page = PREVIEW_PAGE.replace('./main', '/crm/main');
    const result = run(makeBuild({ ...VALID_BUILD, 'iframe.html': page }), base);

    expect(result.status).toBe(0);
    expect(result.output).toContain('resolves under /crm/.');
  });

  it('resolves a reference under the base path against the build root', () => {
    const page = PREVIEW_PAGE.replace('<base target="_parent" />', '<base href="/crm/" />')
      .replace('./main', '/crm/main')
      .replace('<body>', '<body><a href="/crm">home</a>');
    const passing = run(makeBuild({ ...VALID_BUILD, 'iframe.html': page }), '/crm/');
    const missing = run(makeBuild(withoutFile('main.iframe.bundle.js')), '/crm/');

    expect(passing.status).toBe(0);
    expect(missing.status).toBe(1);
    expect(missing.output).toContain(
      'runtime~main.iframe.bundle.js: reference "./main.iframe.bundle.js" names a missing file'
    );
  });

  it.each([
    ['an HTML src', 'iframe.html', PREVIEW_PAGE.replace('./main', '/main'), '"/main.iframe'],
    ['an HTML href', 'index.html', MANAGER_PAGE.replace('./favicon', '/favicon'), '"/favicon.svg"'],
    [
      'an inline module import',
      'index.html',
      MANAGER_PAGE.replace("'./sb-manager/runtime", "'/sb-manager/runtime"),
      '"/sb-manager/runtime.js"',
    ],
    [
      'a JavaScript dynamic import()',
      'runtime~main.iframe.bundle.js',
      'r.l=(u)=>import("/main.iframe.bundle.js");',
      '"/main.iframe.bundle.js"',
    ],
    [
      'a CSS url()',
      'sb-common-assets/fonts.css',
      '@font-face { src: url("/sb-common-assets/nunito-sans-regular.woff2"); }',
      '"/sb-common-assets/nunito-sans-regular.woff2"',
    ],
  ])('rejects a root-absolute reference in %s', (_label, file, contents, reference) => {
    const result = run(makeBuild({ ...VALID_BUILD, [file]: contents }), '/crm/');

    expect(result.status).toBe(1);
    expect(result.output).toContain(`${file}: root-absolute reference ${reference}`);
    expect(result.output).toContain('escapes the Pages base path /crm/');
  });

  it.each(['/', '/other/'])('rejects a base href of %s outside the base path', (href) => {
    const page = PREVIEW_PAGE.replace('<base target="_parent" />', `<base href="${href}" />`);
    const result = run(makeBuild({ ...VALID_BUILD, 'iframe.html': page }), '/crm/');

    expect(result.status).toBe(1);
    expect(result.output).toContain(
      `iframe.html: <base href="${href}"> is outside the Pages base path`
    );
  });

  it('rejects a webpack runtime whose public path leaves the base path', () => {
    const runtime = 'r.p="/";';
    const result = run(
      makeBuild({ ...VALID_BUILD, 'runtime~main.iframe.bundle.js': runtime }),
      '/crm/'
    );
    const elsewhere = run(makeBuild({ ...VALID_BUILD, 'vendor.js': runtime }), '/crm/');

    expect(result.status).toBe(1);
    expect(result.output).toContain(
      'runtime~main.iframe.bundle.js: webpack public path "/" is outside the base path'
    );
    expect(elsewhere.status).toBe(0);
  });

  it('rejects a relative reference to a file the build does not contain', () => {
    const result = run(makeBuild(withoutFile('sb-manager/runtime.js')));

    expect(result.status).toBe(1);
    expect(result.output).toContain(
      'index.html: reference "./sb-manager/runtime.js" names a missing file'
    );
  });

  it('rejects a relative reference that climbs out of the build', () => {
    const css = '@font-face { src: url(../../outside.woff2); }';
    const result = run(makeBuild({ ...VALID_BUILD, 'sb-common-assets/fonts.css': css }));

    expect(result.status).toBe(1);
    expect(result.output).toContain('reference "../../outside.woff2" resolves outside the build');
  });

  it('ignores bare module specifiers, which name packages rather than files', () => {
    const page = MANAGER_PAGE.replace(
      "import './sb-manager/runtime.js';",
      "import './sb-manager/runtime.js'; import 'react'; import x from \"react-dom\";"
    );
    const result = run(makeBuild({ ...VALID_BUILD, 'index.html': page }));

    expect(result.status).toBe(0);
  });

  it('checks only .js and .mjs chunk imports in emitted JavaScript', () => {
    const bundle = 'import("./get");import("./lazy.mjs?v=2");';
    const missing = run(makeBuild({ ...VALID_BUILD, 'vendor.js': bundle }));
    const present = run(makeBuild({ ...VALID_BUILD, 'vendor.js': bundle, 'lazy.mjs': '' }));

    expect(missing.status).toBe(1);
    expect(missing.output).toContain('(1):');
    expect(missing.output).toContain('vendor.js: reference "./lazy.mjs?v=2" names a missing file');
    expect(present.status).toBe(0);
  });

  it('keeps an in-build file whose name starts with two dots inside the build', () => {
    const result = run(
      makeBuild({ ...VALID_BUILD, 'fonts.css': 'src: url(..font.woff2);', '..font.woff2': '' })
    );

    expect(result.status).toBe(0);
  });

  it('rejects a reference that climbs to exactly the parent of the build', () => {
    const css = '@font-face { src: url(../..); }';
    const result = run(makeBuild({ ...VALID_BUILD, 'sb-common-assets/fonts.css': css }));

    expect(result.status).toBe(1);
    expect(result.output).toContain('reference "../.." resolves outside the build');
  });

  it.each(['index.html', 'iframe.html'])('rejects a build without %s', (page) => {
    const result = run(makeBuild(withoutFile(page)));

    expect(result.status).toBe(1);
    expect(result.output).toContain(`${page} is missing from the build`);
  });

  it.each([
    ['a missing index', withoutFile('index.json'), 'index.json is missing'],
    [
      'an index with no story',
      { ...VALID_BUILD, 'index.json': JSON.stringify({ v: 5, entries: {} }) },
      'index.json lists no story',
    ],
    [
      'an index without entries',
      { ...VALID_BUILD, 'index.json': JSON.stringify({ v: 5 }) },
      'index.json lists no story',
    ],
    [
      'an index holding only docs entries',
      {
        ...VALID_BUILD,
        'index.json': JSON.stringify({ v: 5, entries: { intro: { id: 'intro', type: 'docs' } } }),
      },
      'index.json lists no story',
    ],
    ['an unparseable index', { ...VALID_BUILD, 'index.json': '{' }, 'index.json is not valid JSON'],
  ])('rejects %s', (_label, files, message) => {
    const result = run(makeBuild(files));

    expect(result.status).toBe(1);
    expect(result.output).toContain(message);
  });

  it('reports every finding with its count, not only the first', () => {
    const result = run(makeBuild(withoutFile('iframe.html')));
    const broken = run(
      makeBuild({ ...withoutFile('iframe.html'), 'index.json': JSON.stringify({ entries: {} }) })
    );

    expect(result.output).toContain('(1):');
    expect(broken.output).toContain('(2):');
    expect(broken.output).toContain('index.json lists no story');
    expect(broken.output).toContain('iframe.html is missing from the build');
  });

  it('fails when the build directory does not exist', () => {
    const missing = path.join(makeBuild({}), 'storybook-static');
    const result = run(missing);

    expect(result.status).toBe(1);
    expect(result.output).toContain("does not exist; run 'make storybook-build' first");
  });
});
