/**
 * Static translation-key scanning for the localization parity gate (issue #151).
 *
 * Finds the keys a source tree references, and decides whether a key resolves in a locale.
 * Kept apart from check-i18n-parity.mjs so catalog validation and source scanning stay
 * separately readable and separately testable.
 */

import fs from 'node:fs';
import path from 'node:path';

// i18next suffixes a base key with a CLDR plural category, and locales legitimately use
// different category sets (en: one/other; uk: one/few/many/other). Parity therefore compares
// plural families, and a base key resolves when any of its categories exists.
const PLURAL_CATEGORIES = ['zero', 'one', 'two', 'few', 'many', 'other'];
const PLURAL_SUFFIX = new RegExp(`_(?:${PLURAL_CATEGORIES.join('|')})$`);

const KEY_SHAPE = /^[a-z][a-zA-Z0-9_]*(?:\.[a-z][a-zA-Z0-9_]*)+$/;

// A bare `t(` must not be the tail of a longer identifier (format(, expect(, parseInt();
// the dotted receiver form is allowed only for i18n/i18next.
const TRANSLATE_CALL =
  /(?:\b(?:i18n|i18next)\.|(?<![\w$.]))t\(\s*(['"`])((?:\\.|(?!\1)[^\\\r\n])*)\1/g;

// Keys also reach t() indirectly through a constant, which is how the auth.errors.unknown
// defect escaped review. Requiring a *Key-named binding keeps the far more common non-i18n
// dotted literals out — Sentry breadcrumb categories, feature-flag names, store names.
const KEY_NAME = String.raw`\b[A-Za-z_$][\w$]*(?:[Kk]ey|KEY)\b`;
const KEY_TYPE = String.raw`(?:\s*:\s*[^=;'"\`\n]+)?`;
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

function blanked(text) {
  return text.replace(/[^\n]/g, ' ');
}

function commentEnd(source, index) {
  const pair = source.slice(index, index + 2);
  if (pair === '//') {
    const newline = source.indexOf('\n', index);
    return newline === -1 ? source.length : newline;
  }
  if (pair === '/*') {
    const close = source.indexOf('*/', index + 2);
    return close === -1 ? source.length : close + 2;
  }
  return -1;
}

function quoteEnd(source, index) {
  const quote = source[index];
  if (quote !== "'" && quote !== '"' && quote !== '`') return -1;
  let cursor = index + 1;
  while (cursor < source.length) {
    if (source[cursor] === '\\') {
      cursor += 2;
      continue;
    }
    if (source[cursor] === quote) return cursor + 1;
    if (quote !== '`' && source[cursor] === '\n') return cursor;
    cursor += 1;
  }
  return cursor;
}

/**
 * Blanks comments while preserving every byte offset, so a key name mentioned in a migration
 * note or JSDoc block is not mistaken for a live call site.
 */
function blankComments(source) {
  let out = '';
  let cursor = 0;
  while (cursor < source.length) {
    const comment = commentEnd(source, cursor);
    if (comment !== -1) {
      out += blanked(source.slice(cursor, comment));
      cursor = comment;
      continue;
    }
    const quote = quoteEnd(source, cursor);
    if (quote !== -1) {
      out += source.slice(cursor, quote);
      cursor = quote;
      continue;
    }
    out += source[cursor];
    cursor += 1;
  }
  return out;
}

function lineOf(source, index) {
  let line = 1;
  for (let cursor = 0; cursor < index; cursor += 1) {
    if (source[cursor] === '\n') line += 1;
  }
  return line;
}

function collectCandidates(source, namespaces) {
  const scanned = blankComments(source);
  const candidates = new Map();
  const remember = (key, index) => {
    // A namespace-qualified key needs namespace resolution this app does not use, and an
    // interpolated template is not a static key; neither is a defect worth reporting.
    if (key.includes(':') || key.includes('${')) return;
    const line = lineOf(scanned, index);
    candidates.set(`${line}:${key}`, { key, line });
  };
  for (const match of scanned.matchAll(TRANSLATE_CALL)) {
    remember(match[2], match.index + match[0].length - match[2].length - 1);
  }
  for (const match of scanned.matchAll(KEY_BINDING)) {
    const literal = match[2];
    if (!KEY_SHAPE.test(literal)) continue;
    if (!namespaces.has(literal.split('.')[0])) continue;
    remember(literal, match.index + match[0].length - literal.length - 1);
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
