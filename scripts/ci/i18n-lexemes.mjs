/**
 * Single-construct scanners for the localization parity gate's lexical pass (issue #151).
 *
 * Each function answers one question — where does the comment / string / regex literal that
 * starts at `index` end? — and none of them decide *which* construct starts there. That call
 * needs lexical context and lives in i18n-lex-mode.mjs; the walk itself lives in
 * i18n-source-tokens.mjs.
 */

export function blanked(text) {
  return text.replace(/[^\n]/g, ' ');
}

export function commentEnd(source, index) {
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

export function quoteEnd(source, index) {
  const quote = source[index];
  if (quote !== "'" && quote !== '"') return -1;
  let cursor = index + 1;
  while (cursor < source.length) {
    if (source[cursor] === '\\') {
      cursor += 2;
      continue;
    }
    if (source[cursor] === quote) return cursor + 1;
    if (source[cursor] === '\n') return cursor;
    cursor += 1;
  }
  return cursor;
}

/**
 * Assumes `index` is a `/` already known to open a regex literal. Returns -1 for an unterminated
 * one, which means the `/` was really a division: a regex literal cannot span a line break.
 */
export function regexEnd(source, index) {
  let cursor = index + 1;
  let inClass = false;
  while (cursor < source.length) {
    const char = source[cursor];
    if (char === '\\') {
      cursor += 2;
      continue;
    }
    if (char === '\n') return -1;
    if (char === '[') inClass = true;
    else if (char === ']') inClass = false;
    else if (char === '/' && !inClass) return cursor + 1;
    cursor += 1;
  }
  return -1;
}
