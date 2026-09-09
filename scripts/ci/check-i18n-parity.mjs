#!/usr/bin/env node
/**
 * Localization parity gate (issue #151).
 *
 * Fails CI on any localization drift, reporting every violation it finds:
 *
 *   1. locale-file completeness — every `i18n/` catalog folder holds exactly
 *      en.json + uk.json, each parseable as a JSON object, and the generated
 *      output directory holds nothing but the merged catalog.
 *   2. catalog health — en/uk expose the same keys inside each folder, every
 *      translation is usable text, and no two folders claim the same key.
 *   3. merged-catalog freshness — the committed src/i18n/localization.json is
 *      semantically identical to what LocalizationGenerator produces today, and
 *      its own en/uk key sets match.
 *   4. undefined keys — no t() call site, and no key held in a *Key-named
 *      binding, references a key absent from either locale.
 *
 * Usage:
 *   node scripts/ci/check-i18n-parity.mjs            verify only (exit 1 on drift)
 *   node scripts/ci/check-i18n-parity.mjs --write     regenerate the merged catalog
 *
 * I18N_SCAN_ROOT (default `src`) and I18N_OUTPUT_DIR (default `<scanRoot>/i18n`)
 * are resolved against process.cwd() so the gate can be driven against fixtures.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';

import { collectKeyReferences, pluralFamily, resolvesKey } from './i18n-key-scan.mjs';
import { findDuplicateKeys } from './json-duplicate-keys.mjs';

const requireCjs = createRequire(import.meta.url);

const REQUIRED_LOCALES = ['en', 'uk'];
const CATALOG_DIR = 'i18n';
const MERGED_FILE = 'localization.json';
const REPORT_LIMIT = 20;
const REMEDY = 'node scripts/ci/check-i18n-parity.mjs --write';

function usage() {
  return [
    'Usage: node scripts/ci/check-i18n-parity.mjs [--write]',
    '',
    '  (no flags)  verify locale parity read-only; exit 1 on any violation',
    `  --write     regenerate ${MERGED_FILE} from the per-folder catalogs, then verify`,
    '',
    'Env: I18N_SCAN_ROOT (default src), I18N_OUTPUT_DIR (default <scanRoot>/i18n)',
  ].join('\n');
}

function parseArgs(argv) {
  let write = false;
  for (const arg of argv) {
    if (arg !== '--write') return null;
    write = true;
  }
  return { write };
}

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function flattenLeaves(value, prefix, into) {
  for (const [key, child] of Object.entries(value)) {
    const dotted = prefix ? `${prefix}.${key}` : key;
    if (isPlainObject(child)) flattenLeaves(child, dotted, into);
    else into.set(dotted, child);
  }
  return into;
}

function leafKeys(value) {
  return new Set(flattenLeaves(value, '', new Map()).keys());
}

function pluralFamilies(value) {
  return new Set([...leafKeys(value)].map(pluralFamily));
}

function formatKeys(keys) {
  const lines = keys.slice(0, REPORT_LIMIT).map((key) => `    - ${key}`);
  if (keys.length > REPORT_LIMIT) {
    lines.push(`    … ${keys.length - REPORT_LIMIT} more suppressed`);
  }
  return lines.join('\n');
}

function describeKeys(label, keys) {
  return `${label} (${keys.length}):\n${formatKeys(keys.slice().sort())}`;
}

function relative(target) {
  const rel = path.relative(process.cwd(), target);
  if (rel === '') return '.';
  return rel.startsWith('..') ? target : rel;
}

function findCatalogDirs(dir, generatedDirs, found) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const full = path.join(dir, entry.name);
    if (generatedDirs.has(path.resolve(full))) continue;
    if (entry.name === CATALOG_DIR) found.push(full);
    else findCatalogDirs(full, generatedDirs, found);
  }
  return found;
}

/**
 * JSON.parse keeps the last of two identical keys and reports nothing, so a repeated key
 * silently discards a translation. Returns null when the file cannot be trusted.
 */
function parseCatalogFile(file, violations, label = '[locale-files]') {
  const raw = fs.readFileSync(file, 'utf8');
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    violations.push(`${label} ${relative(file)}: invalid JSON — ${error.message}`);
    return null;
  }
  if (!isPlainObject(parsed)) {
    violations.push(`${label} ${relative(file)}: must contain a JSON object`);
    return null;
  }
  const duplicates = findDuplicateKeys(raw);
  if (duplicates.length > 0) {
    violations.push(
      describeKeys(
        `${label} ${relative(file)}: keys are defined twice, so one translation is ` +
          'silently discarded',
        duplicates
      )
    );
    return null;
  }
  return parsed;
}

function readCatalogLocales(dir, jsonFiles, violations) {
  const locales = {};
  for (const name of jsonFiles) {
    const file = path.join(dir, name);
    const parsed = parseCatalogFile(file, violations);
    if (parsed) locales[path.basename(name, '.json')] = parsed;
  }
  return locales;
}

/** Check 1: every catalog folder holds exactly the required, parseable locales. */
function readCatalogs(scanRoot, generatedDirs, violations) {
  const dirs = findCatalogDirs(scanRoot, generatedDirs, []).sort();
  return dirs.map((dir) => {
    const jsonFiles = fs
      .readdirSync(dir, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
      .map((entry) => entry.name)
      .sort();
    const missing = REQUIRED_LOCALES.filter((locale) => !jsonFiles.includes(`${locale}.json`));
    const extra = jsonFiles.filter(
      (name) => !REQUIRED_LOCALES.includes(path.basename(name, '.json'))
    );
    if (missing.length > 0) {
      const names = missing.map((locale) => `${locale}.json`).join(', ');
      violations.push(`[locale-files] ${relative(dir)}: missing required locale file(s) ${names}`);
    }
    if (extra.length > 0) {
      violations.push(
        `[locale-files] ${relative(dir)}: unexpected file(s) ${extra.join(', ')} — only ` +
          `${REQUIRED_LOCALES.map((locale) => `${locale}.json`).join(', ')} may live in a catalog`
      );
    }
    return { dir, locales: readCatalogLocales(dir, jsonFiles, violations) };
  });
}

/**
 * Check 1b: a generated catalog directory is output only, never a source catalog. Every generated
 * directory is checked, not just the configured one: LocalizationGenerator still merges any
 * locale file it finds in the canonical directory, so a stray there would reach the merged
 * catalog unvalidated even when I18N_OUTPUT_DIR points somewhere else.
 */
function checkGeneratedDirsHoldOnlyOutput(generatedDirs, violations) {
  for (const dir of [...generatedDirs].sort()) {
    if (!fs.existsSync(dir)) continue;
    const strays = fs
      .readdirSync(dir, { withFileTypes: true })
      .filter((entry) => !(entry.isFile() && entry.name === MERGED_FILE))
      .map((entry) => entry.name)
      .sort();
    if (strays.length === 0) continue;
    violations.push(
      `[output-dir] ${relative(dir)} may hold only ${MERGED_FILE}, found ` +
        `${strays.join(', ')} — move source translations into a feature ${CATALOG_DIR}/ folder`
    );
  }
}

/** Check 2: en.json and uk.json agree on the key set, folder by folder. */
function checkFolderParity(catalogs, violations) {
  const [primary, secondary] = REQUIRED_LOCALES;
  for (const catalog of catalogs) {
    const left = catalog.locales[primary];
    const right = catalog.locales[secondary];
    if (!left || !right) continue;
    const leftKeys = pluralFamilies(left);
    const rightKeys = pluralFamilies(right);
    const onlyLeft = [...leftKeys].filter((key) => !rightKeys.has(key));
    const onlyRight = [...rightKeys].filter((key) => !leftKeys.has(key));
    if (onlyLeft.length === 0 && onlyRight.length === 0) continue;
    const parts = [`[folder-parity] ${relative(catalog.dir)}: en/uk key sets differ`];
    if (onlyLeft.length > 0) parts.push(describeKeys(`  missing from ${secondary}.json`, onlyLeft));
    if (onlyRight.length > 0) parts.push(describeKeys(`  missing from ${primary}.json`, onlyRight));
    violations.push(parts.join('\n'));
  }
}

/** Check 2b: every translation resolves to a non-empty string, in every locale. */
function checkValueQuality(catalogs, violations) {
  for (const catalog of catalogs) {
    for (const locale of REQUIRED_LOCALES) {
      const translation = catalog.locales[locale];
      if (!translation) continue;
      const blank = [...flattenLeaves(translation, '', new Map())]
        .filter(([, value]) => typeof value !== 'string' || value.trim() === '')
        .map(([key]) => key);
      if (blank.length === 0) continue;
      const file = relative(path.join(catalog.dir, `${locale}.json`));
      violations.push(describeKeys(`[locale-values] ${file}: keys hold no usable text`, blank));
    }
  }
}

/**
 * Check 2c: LocalizationGenerator merges catalogs last-writer-wins over an unsorted
 * directory walk, so two folders claiming one key resolve by filesystem order.
 */
function catalogKeys(catalog) {
  const keys = new Set();
  for (const locale of REQUIRED_LOCALES) {
    const translation = catalog.locales[locale];
    if (!translation) continue;
    for (const key of leafKeys(translation)) keys.add(key);
  }
  return keys;
}

function keyOwners(catalogs) {
  const owners = new Map();
  for (const catalog of catalogs) {
    for (const key of catalogKeys(catalog)) {
      const dirs = owners.get(key) ?? [];
      dirs.push(relative(catalog.dir));
      owners.set(key, dirs);
    }
  }
  return owners;
}

function checkKeyOwnership(catalogs, violations) {
  for (const [key, dirs] of keyOwners(catalogs)) {
    if (dirs.length < 2) continue;
    violations.push(
      `[key-ownership] "${key}" is defined by ${dirs.length} catalogs (${dirs.join(', ')}) — ` +
        'the merge order is filesystem-dependent, so exactly one catalog must own a key'
    );
  }
}

/** LocalizationGenerator warns about gaps Check 1 already reports authoritatively. */
function silenceWarnings(run) {
  const original = console.warn;
  console.warn = () => {};
  try {
    return run();
  } finally {
    console.warn = original;
  }
}

/**
 * generateLocalizationFile() always writes its result, so both modes aim it at a throwaway
 * directory: verification never touches the working tree, and --write goes through
 * writeMerged() so the committed file matches the repository's Prettier gate.
 */
function regenerateInMemory(scanRoot) {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'i18n-parity-'));
  try {
    const LocalizationGenerator = requireCjs('../localization-generator.js');
    const generator = new LocalizationGenerator(
      CATALOG_DIR,
      scanRoot,
      MERGED_FILE,
      path.relative(process.cwd(), temp),
      REQUIRED_LOCALES
    );
    const result = silenceWarnings(() => generator.generateLocalizationFile());
    return result ? result.localizationObj : {};
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}

// The trailing newline is required: src/i18n/localization.json is covered by make lint-prettier,
// and JSON.stringify alone would leave the file that gate reports as unformatted.
function writeMerged(mergedPath, merged) {
  fs.mkdirSync(path.dirname(mergedPath), { recursive: true });
  fs.writeFileSync(mergedPath, `${JSON.stringify(merged, null, 2)}\n`, 'utf8');
}

function readMerged(mergedPath, violations) {
  if (!fs.existsSync(mergedPath)) {
    violations.push(`[merged-catalog] ${relative(mergedPath)} is missing — run ${REMEDY}`);
    return null;
  }
  return parseCatalogFile(mergedPath, violations, '[merged-catalog]');
}

/** Check 3a: the committed merged catalog matches a fresh regeneration, key order aside. */
function checkMergedFreshness(expected, actual, mergedPath, violations) {
  const wanted = flattenLeaves(expected, '', new Map());
  const found = flattenLeaves(actual, '', new Map());
  const missing = [];
  const mismatched = [];
  for (const [key, value] of wanted) {
    if (!found.has(key)) missing.push(key);
    else if (JSON.stringify(found.get(key)) !== JSON.stringify(value)) mismatched.push(key);
  }
  const surplus = [...found.keys()].filter((key) => !wanted.has(key));
  if (missing.length === 0 && surplus.length === 0 && mismatched.length === 0) return;
  const parts = [`[merged-catalog] ${relative(mergedPath)} is stale — regenerate with ${REMEDY}`];
  if (missing.length > 0) parts.push(describeKeys('  missing from the committed catalog', missing));
  if (surplus.length > 0) parts.push(describeKeys('  no longer produced by any catalog', surplus));
  if (mismatched.length > 0) parts.push(describeKeys('  value differs', mismatched));
  violations.push(parts.join('\n'));
}

function localeTranslation(catalog, locale) {
  const entry = catalog[locale];
  return isPlainObject(entry) && isPlainObject(entry.translation) ? entry.translation : null;
}

/** Check 3b: the merged catalog itself exposes the same keys for every locale. */
function checkMergedLocaleParity(catalog, violations) {
  const [primary, secondary] = REQUIRED_LOCALES;
  const left = localeTranslation(catalog, primary);
  const right = localeTranslation(catalog, secondary);
  for (const [locale, translation] of [
    [primary, left],
    [secondary, right],
  ]) {
    if (!translation) {
      violations.push(`[merged-parity] merged catalog has no "${locale}.translation" object`);
    }
  }
  if (!left || !right) return;
  const leftKeys = pluralFamilies(left);
  const rightKeys = pluralFamilies(right);
  const onlyLeft = [...leftKeys].filter((key) => !rightKeys.has(key));
  const onlyRight = [...rightKeys].filter((key) => !leftKeys.has(key));
  if (onlyLeft.length === 0 && onlyRight.length === 0) return;
  const parts = ['[merged-parity] merged catalog en/uk key sets differ'];
  if (onlyLeft.length > 0) parts.push(describeKeys(`  missing from ${secondary}`, onlyLeft));
  if (onlyRight.length > 0) parts.push(describeKeys(`  missing from ${primary}`, onlyRight));
  violations.push(parts.join('\n'));
}

/** Check 4: every statically known translation key resolves in every locale. */
function checkCallSites(scanRoot, catalog, violations) {
  const translations = new Map(
    REQUIRED_LOCALES.map((locale) => [locale, localeTranslation(catalog, locale) ?? {}])
  );
  const namespaces = new Set();
  for (const translation of translations.values()) {
    for (const key of Object.keys(translation)) namespaces.add(key);
  }
  const references = collectKeyReferences(scanRoot, namespaces);
  for (const reference of references) {
    const absent = REQUIRED_LOCALES.filter(
      (locale) => !resolvesKey(translations.get(locale), reference.key)
    );
    if (absent.length === 0) continue;
    violations.push(
      `[undefined-key] ${relative(reference.file)}:${reference.line}: "${reference.key}" ` +
        `is not defined in ${absent.join(', ')}`
    );
  }
  return references.length;
}

/** A gate that finds nothing to check must fail, never report a vacuous pass. */
function checkCoverageFloor(summary, scanRoot, violations) {
  if (summary.catalogs === 0) {
    violations.push(
      `[no-coverage] no ${CATALOG_DIR}/ catalog folder found under ${relative(scanRoot)} — ` +
        'the gate would pass without verifying anything'
    );
  }
  if (summary.keys === 0) {
    violations.push(
      '[no-coverage] the merged catalog defines no keys — the gate would pass without ' +
        'verifying anything'
    );
  }
}

function report(violations, summary) {
  if (violations.length === 0) {
    process.stdout.write(
      `check-i18n-parity: OK — ${summary.catalogs} catalog folder(s), ` +
        `${summary.keys} merged key(s) per locale, ${summary.references} translation ` +
        `reference(s) verified across ${REQUIRED_LOCALES.join('/')}.\n`
    );
    return;
  }
  process.stderr.write(`check-i18n-parity: ${violations.length} violation(s) found.\n\n`);
  for (const violation of violations) process.stderr.write(`${violation}\n`);
  process.stderr.write(
    '\nFix the source catalogs (never widen the gate). Regenerate the merged ' +
      `catalog with: ${REMEDY}\n`
  );
  process.exitCode = 1;
}

function resolveScanRoot() {
  const scanRoot = path.resolve(process.cwd(), process.env.I18N_SCAN_ROOT || 'src');
  if (!fs.existsSync(scanRoot)) return { error: `scan root not found: ${scanRoot}` };
  if (!fs.statSync(scanRoot).isDirectory()) {
    return { error: `scan root is not a directory: ${scanRoot}` };
  }
  const canonicalOutput = path.join(scanRoot, CATALOG_DIR);
  const outputDir = process.env.I18N_OUTPUT_DIR
    ? path.resolve(process.cwd(), process.env.I18N_OUTPUT_DIR)
    : canonicalOutput;
  // The canonical directory is generator output whether or not it is the configured target, so
  // an overridden I18N_OUTPUT_DIR must not turn src/i18n into a discovered source catalog.
  const generatedDirs = new Set([path.resolve(outputDir), path.resolve(canonicalOutput)]);
  return { scanRoot, outputDir, generatedDirs, mergedPath: path.join(outputDir, MERGED_FILE) };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args) {
    process.stderr.write(`${usage()}\n`);
    process.exitCode = 2;
    return;
  }

  const roots = resolveScanRoot();
  if (roots.error) {
    process.stderr.write(`check-i18n-parity: ${roots.error}\n`);
    process.exitCode = 1;
    return;
  }
  const { scanRoot, outputDir, generatedDirs, mergedPath } = roots;

  const violations = [];
  const catalogs = readCatalogs(scanRoot, generatedDirs, violations);
  checkGeneratedDirsHoldOnlyOutput(generatedDirs, violations);
  checkFolderParity(catalogs, violations);
  checkValueQuality(catalogs, violations);
  checkKeyOwnership(catalogs, violations);

  const regenerated = regenerateInMemory(scanRoot);
  if (args.write) {
    // Writing a catalog built from unhealthy sources would commit the damage — an unparseable
    // locale file merges as an absent locale, silently stripping it from the committed file.
    if (violations.length > 0) {
      process.stderr.write(
        `check-i18n-parity: refusing to write ${relative(mergedPath)} — ` +
          'fix the catalog violations below first.\n\n'
      );
    } else {
      writeMerged(mergedPath, regenerated);
      process.stdout.write(
        `check-i18n-parity: wrote ${relative(mergedPath)} from ` +
          `${catalogs.length} catalog folder(s).\n`
      );
    }
  } else {
    const committed = readMerged(mergedPath, violations);
    if (committed) {
      checkMergedFreshness(regenerated, committed, mergedPath, violations);
      checkMergedLocaleParity(committed, violations);
    }
  }

  // Call sites resolve against the catalogs, not the committed merge: a developer who edited
  // both locales but has not regenerated yet gets the staleness report, not a phantom
  // undefined-key report naming locales that do define the key.
  const references = checkCallSites(scanRoot, regenerated, violations);
  const summary = {
    catalogs: catalogs.length,
    keys: pluralFamilies(localeTranslation(regenerated, REQUIRED_LOCALES[0]) ?? {}).size,
    references,
  };
  checkCoverageFloor(summary, scanRoot, violations);
  report(violations, summary);
}

main();
