// scripts/ci/check-storybook-static.mjs
//
// Sub-path gate for the published Storybook (issue #310). GitHub Pages serves this repository's
// Storybook from https://vilnacrm-org.github.io/crm/, so every asset the static build references
// must resolve inside that sub-path. A root-absolute reference outside it (`/sb-manager/…`) or a
// `<base href="/">` points at the github.io origin root and 404s, which the build itself never
// reports. This gate reads the emitted `storybook-static/` and fails when:
//   - `index.json` is missing, unparseable, or lists no story (a build that published nothing);
//   - `index.html` or `iframe.html` is missing;
//   - an HTML `src`/`href`, an inline module `import`, a CSS `url()`, or a JavaScript dynamic
//     `import()` of a `.js`/`.mjs` chunk is root-absolute and outside the base path (a browser
//     resolves no extension, so an extensionless specifier in a vendor bundle is never a chunk);
//   - a `<base href>` or the webpack runtime's public path is root-absolute and outside the base
//     path, which re-roots every lazy chunk and font the preview loads;
//   - a reference names a file that is not in the build (an asset that would 404).
//
// Runs as `node scripts/ci/check-storybook-static.mjs [dir] [base-path]` from
// `make check-storybook-static`. A reference under the base path (`/crm/x.js` for `/crm/`) is
// resolved against the build root. Its own behaviour is pinned by
// tests/unit/scripts/check-storybook-static.test.ts.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const REQUIRED_PAGES = ['index.html', 'iframe.html'];
const EXTERNAL = /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i;
const CSS_URL = /\burl\(\s*["']?([^"')]+?)["']?\s*\)/g;
const DYNAMIC_IMPORT = /\bimport\(\s*["']((?:\.{1,2})?\/[^"']+)["']\s*\)/g;
const CHUNK_IMPORT = /\bimport\(\s*["']((?:\.{1,2})?\/[^"']+\.m?js(?:[?#][^"']*)?)["']\s*\)/g;
const REFERENCES = {
  '.html': [
    /\s(?:src|href)\s*=\s*["']([^"']*)["']/gi,
    /\bimport\s*(?:[^'"]*?\sfrom\s*)?["']((?:\.{1,2})?\/[^"']+)["']/g,
    CSS_URL,
    DYNAMIC_IMPORT,
  ],
  '.css': [CSS_URL],
  '.js': [CHUNK_IMPORT],
};
const BASE_HREF = /<base\s[^>]*href\s*=\s*["']([^"']*)["']/gi;
const WEBPACK_PUBLIC_PATH = /\.p\s*=\s*["'](\/[^"']*)["']/g;
const WEBPACK_RUNTIME = /^runtime~.*\.js$/;

/**
 * @param {string} dir directory to walk
 * @returns {string[]} every file below `dir`, as absolute paths
 */
function listFiles(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry);
    return statSync(full).isDirectory() ? listFiles(full) : [full];
  });
}

/**
 * @param {string} source file contents
 * @param {RegExp[]} patterns reference patterns whose first group is the URL
 * @returns {string[]} the referenced URLs, trimmed, empty ones dropped
 */
function referencesIn(source, patterns) {
  return patterns
    .flatMap((pattern) => [...source.matchAll(pattern)].map((match) => match[1].trim()))
    .filter(Boolean);
}

/**
 * @param {string} base the Pages base path, `/` when the site is served from the origin root
 * @param {string} reference a root-absolute URL
 * @returns {boolean} whether the reference stays inside the base path
 */
function insideBase(base, reference) {
  return reference === base.replace(/\/$/, '') || reference.startsWith(base);
}

/**
 * @param {{root: string, base: string}} build the build directory and its Pages base path
 * @param {string} file the file holding the reference
 * @param {string} reference the URL as written
 * @returns {string|null} a finding, or null when the reference resolves inside the build
 */
function checkReference(build, file, reference) {
  if (EXTERNAL.test(reference)) return null;
  const where = path.relative(build.root, file);
  if (reference.startsWith('/') && !insideBase(build.base, reference)) {
    return `${where}: root-absolute reference "${reference}" escapes the Pages base path ${build.base}`;
  }
  const local = decodeURI(reference.split(/[?#]/)[0]);
  const target = local.startsWith('/')
    ? path.join(build.root, local.slice(build.base.length))
    : path.resolve(path.dirname(file), local);
  const relative = path.relative(build.root, target);
  if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    return `${where}: reference "${reference}" resolves outside the build`;
  }
  return existsSync(target) ? null : `${where}: reference "${reference}" names a missing file`;
}

/**
 * @param {string} root the build directory
 * @returns {string[]} findings about the story index
 */
function checkIndex(root) {
  const indexPath = path.join(root, 'index.json');
  if (!existsSync(indexPath)) return ['index.json is missing; the build published no index'];
  try {
    const entries = Object.values(JSON.parse(readFileSync(indexPath, 'utf8')).entries ?? {});
    return entries.some((entry) => entry.type === 'story')
      ? []
      : ['index.json lists no story; the build published an empty catalogue'];
  } catch (error) {
    return [`index.json is not valid JSON: ${error.message}`];
  }
}

/**
 * @param {{root: string, base: string}} build the build directory and its Pages base path
 * @param {string} file a file in the build
 * @param {string} source its contents
 * @returns {string[]} findings for a base href or webpack public path outside the base path
 */
function checkRebasing(build, file, source) {
  const where = path.relative(build.root, file);
  const bases = file.endsWith('.html') ? referencesIn(source, [BASE_HREF]) : [];
  const publicPaths = WEBPACK_RUNTIME.test(path.basename(file))
    ? referencesIn(source, [WEBPACK_PUBLIC_PATH])
    : [];
  return [
    ...bases
      .filter((href) => href.startsWith('/') && !insideBase(build.base, href))
      .map((href) => `${where}: <base href="${href}"> is outside the Pages base path`),
    ...publicPaths
      .filter((publicPath) => !insideBase(build.base, publicPath))
      .map(
        (publicPath) => `${where}: webpack public path "${publicPath}" is outside the base path`
      ),
  ];
}

/**
 * @param {{root: string, base: string}} build the build directory and its Pages base path
 * @param {string} file an HTML, CSS or JavaScript file in the build
 * @returns {string[]} findings for that file
 */
function checkFile(build, file) {
  const source = readFileSync(file, 'utf8');
  const findings = referencesIn(source, REFERENCES[path.extname(file)])
    .map((reference) => checkReference(build, file, reference))
    .filter(Boolean);
  return [...findings, ...checkRebasing(build, file, source)];
}

/**
 * @param {{root: string, base: string}} build the build directory and its Pages base path
 * @returns {string[]} every finding for the build
 */
function checkBuild(build) {
  if (!existsSync(build.root) || !statSync(build.root).isDirectory()) {
    return [`${build.root} does not exist; run 'make storybook-build' first`];
  }
  const missingPages = REQUIRED_PAGES.filter(
    (page) => !existsSync(path.join(build.root, page))
  ).map((page) => `${page} is missing from the build`);
  const fileFindings = listFiles(build.root)
    .filter((file) => path.extname(file) in REFERENCES)
    .flatMap((file) => checkFile(build, file));
  return [...checkIndex(build.root), ...missingPages, ...fileFindings];
}

const rawBase = process.argv[3] ?? '/';
const build = {
  root: path.resolve(process.argv[2] ?? 'storybook-static'),
  base: `/${rawBase.replace(/^\/+|\/+$/g, '')}/`.replace(/^\/\/$/, '/'),
};
const findings = checkBuild(build);

if (findings.length > 0) {
  console.error(`Storybook build is not publishable under ${build.base} (${findings.length}):`);
  findings.forEach((finding) => console.error(`  - ${finding}`));
  process.exit(1);
}

console.log(
  `Storybook build in ${path.relative(process.cwd(), build.root) || '.'} resolves under ${build.base}.`
);
