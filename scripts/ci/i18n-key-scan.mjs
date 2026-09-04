/**
 * Static translation-key scanning for the localization parity gate (issue #151).
 *
 * Finds the keys a source tree references, and decides whether a key resolves in a locale.
 * Lexical concerns live in i18n-source-tokens.mjs; this module owns key semantics.
 */

import fs from 'node:fs';
import path from 'node:path';

import { LINE_BREAK, TERMINATORS } from './i18n-lexemes.mjs';
import { isInsideString, tokenizeSource } from './i18n-source-tokens.mjs';

// i18next suffixes a base key with a CLDR plural category, and locales legitimately use
// different category sets (en: one/other; uk: one/few/many/other). Parity therefore compares
// plural families, and a base key resolves when any of its categories exists.
const PLURAL_CATEGORIES = ['zero', 'one', 'two', 'few', 'many', 'other'];
const PLURAL_SUFFIX = new RegExp(`_(?:${PLURAL_CATEGORIES.join('|')})$`);

const KEY_SHAPE = /^[a-z][a-zA-Z0-9_]*(?:\.[a-z][a-zA-Z0-9_]*)+$/;

// A bare `t(` must not be the tail of a longer identifier (format(, expect(, parseInt();
// any receiver ending in .i18n / .i18next is an i18next instance, so its literal key counts,
// reached through optional chaining or not.
const TRANSLATE_CALL =
  /(?:\b(?:i18n|i18next)\??\.|(?<![\w$.]))t\(\s*(['"`])((?:\\.|(?!\1)[^\\\r\n])*)\1/g;

// Keys also reach t() indirectly through a constant, which is how the auth.errors.unknown
// defect escaped review. Requiring a *Key-named binding keeps the far more common non-i18n
// dotted literals out — Sentry breadcrumb categories, feature-flag names, store names.
const KEY_NAME = String.raw`\b[A-Za-z_$][\w$]*(?:[Kk]ey|KEY)\b`;
const KEY_TYPE = String.raw`(?:\s*:\s*[^=;'"\`${TERMINATORS}]+)?`;
const QUOTED = String.raw`(['"\`])((?:\\.|(?!\1)[^\\\r\n])*)\1`;
const KEY_BINDING = new RegExp(`${KEY_NAME}${KEY_TYPE}\\s*[=:]\\s*${QUOTED}`, 'g');

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function pluralFamily(key) {
  return key.replace(PLURAL_SUFFIX, '');
}

function resolvesLeaf(translation, key) {
  let node = translation;
  for (const segment of key.split('.')) {
    if (!isPlainObject(node) || !Object.prototype.hasOwnProperty.call(node, segment)) return false;
    node = node[segment];
  }
  return !isPlainObject(node);
}

export function resolvesKey(translation, key) {
  if (resolvesLeaf(translation, key)) return true;
  return PLURAL_CATEGORIES.some((category) => resolvesLeaf(translation, `${key}_${category}`));
}

function isScannableSource(name) {
  if (!/\.tsx?$/.test(name)) return false;
  if (name.endsWith('.d.ts')) return false;
  return !name.includes('.stories.') && !name.includes('.test.');
}

function collectSourceFiles(dir, skipped, found) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!skipped.has(path.resolve(full))) collectSourceFiles(full, skipped, found);
    } else if (entry.isFile() && isScannableSource(entry.name)) {
      found.push(full);
    }
  }
  return found;
}

function lineOf(source, index) {
  const breaks = source.slice(0, index).match(LINE_BREAK);
  return breaks === null ? 1 : breaks.length + 1;
}

function isReportableKey(key) {
  // A namespace-qualified key needs namespace resolution this app does not use, and an
  // interpolated template is not a static key; neither is a defect worth reporting.
  return !key.includes(':') && !key.includes('${');
}

function collectMatches(pattern, code, strings, accept) {
  const found = [];
  for (const match of code.matchAll(pattern)) {
    const literal = match[2];
    if (!isReportableKey(literal) || !accept(literal)) continue;
    // A key name written inside unrelated prose is not a call site.
    if (isInsideString(strings, match.index)) continue;
    const literalStart = match.index + match[0].length - literal.length - 1;
    found.push({ key: literal, line: lineOf(code, literalStart) });
  }
  return found;
}

function collectCandidates(source, namespaces) {
  const { code, strings } = tokenizeSource(source);
  const candidates = new Map();
  const accepted = [
    ...collectMatches(TRANSLATE_CALL, code, strings, () => true),
    ...collectMatches(
      KEY_BINDING,
      code,
      strings,
      (literal) => KEY_SHAPE.test(literal) && namespaces.has(literal.split('.')[0])
    ),
  ];
  for (const candidate of accepted) {
    candidates.set(`${candidate.line}:${candidate.key}`, candidate);
  }
  return [...candidates.values()];
}

/**
 * @returns {{file: string, line: number, key: string}[]} every statically known key reference
 */
export function collectKeyReferences(scanRoot, namespaces) {
  const skipped = new Set([path.resolve(scanRoot, 'api', 'generated')]);
  const references = [];
  for (const file of collectSourceFiles(scanRoot, skipped, []).sort()) {
    const source = fs.readFileSync(file, 'utf8');
    for (const candidate of collectCandidates(source, namespaces)) {
      references.push({ file, line: candidate.line, key: candidate.key });
    }
  }
  return references;
}
