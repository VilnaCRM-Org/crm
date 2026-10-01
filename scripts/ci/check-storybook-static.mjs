// scripts/ci/check-storybook-static.mjs
//
// Sub-path gate for the published Storybook (issue #310). GitHub Pages serves this repository's
// Storybook from https://vilnacrm-org.github.io/crm/, so every asset the static build references
// must resolve relative to the page that loads it. A root-absolute reference (`/sb-manager/…`) or
// a `<base href="/">` points at the github.io origin root and 404s, which the build itself never
// reports. This gate reads the emitted `storybook-static/` and fails when:
//   - `index.json` is missing, unparseable, or lists no story (a build that published nothing);
//   - `index.html` or `iframe.html` is missing;
//   - an HTML `src`/`href`, an inline module `import`, or a CSS `url()` is root-absolute;
//   - a `<base href>` is root-absolute;
//   - a relative reference names a file that is not in the build (an asset that would 404).
//
// Runs as `node scripts/ci/check-storybook-static.mjs [dir]` from `make check-storybook-static`.
// Its own behaviour is pinned by tests/unit/scripts/check-storybook-static.test.ts.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const REQUIRED_PAGES = ['index.html', 'iframe.html'];
const EXTERNAL = /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i;
const HTML_REFERENCES = [
  /\s(?:src|href)\s*=\s*["']([^"']*)["']/gi,
  /\bimport\s*(?:[^'"]*?\sfrom\s*)?["']([^"']+)["']/g,
  /\burl\(\s*["']?([^"')]+?)["']?\s*\)/g,
];
const CSS_REFERENCES = [/\burl\(\s*["']?([^"')]+?)["']?\s*\)/g];
const BASE_HREF = /<base\s[^>]*href\s*=\s*["']([^"']*)["']/gi;

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
 * @param {string} root the build directory
 * @param {string} file the file holding the reference
 * @param {string} reference the URL as written
 * @returns {string|null} a finding, or null when the reference resolves inside the build
 */
function checkReference(root, file, reference) {
  if (EXTERNAL.test(reference)) return null;
  const where = path.relative(root, file);
  if (reference.startsWith('/')) {
    return `${where}: root-absolute reference "${reference}" escapes the Pages sub-path`;
  }
  const target = path.resolve(path.dirname(file), decodeURI(reference.split(/[?#]/)[0]));
  if (path.relative(root, target).startsWith('..')) {
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
 * @param {string} root the build directory
 * @param {string} file an HTML or CSS file in the build
 * @returns {string[]} findings for that file
 */
function checkFile(root, file) {
  const source = readFileSync(file, 'utf8');
  const isHtml = file.endsWith('.html');
  const findings = referencesIn(source, isHtml ? HTML_REFERENCES : CSS_REFERENCES)
    .map((reference) => checkReference(root, file, reference))
    .filter(Boolean);
  if (!isHtml) return findings;
  const bases = referencesIn(source, [BASE_HREF]).filter((href) => href.startsWith('/'));
  return [
    ...findings,
    ...bases.map((href) => `${path.relative(root, file)}: <base href="${href}"> is root-absolute`),
  ];
}

/**
 * @param {string} root the build directory
 * @returns {string[]} every finding for the build
 */
function checkBuild(root) {
  if (!existsSync(root) || !statSync(root).isDirectory()) {
    return [`${root} does not exist; run 'make storybook-build' first`];
  }
  const missingPages = REQUIRED_PAGES.filter((page) => !existsSync(path.join(root, page))).map(
    (page) => `${page} is missing from the build`
  );
  const pageFindings = listFiles(root)
    .filter((file) => file.endsWith('.html') || file.endsWith('.css'))
    .flatMap((file) => checkFile(root, file));
  return [...checkIndex(root), ...missingPages, ...pageFindings];
}

const root = path.resolve(process.argv[2] ?? 'storybook-static');
const findings = checkBuild(root);

if (findings.length > 0) {
  console.error(`Storybook build is not publishable under a sub-path (${findings.length}):`);
  findings.forEach((finding) => console.error(`  - ${finding}`));
  process.exit(1);
}

console.log(`Storybook build in ${path.relative(process.cwd(), root) || '.'} resolves relatively.`);
