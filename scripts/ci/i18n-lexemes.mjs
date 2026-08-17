/**
 * Single-construct scanners for the localization parity gate's lexical pass (issue #151).
 *
 * Each function answers one question — where does the comment / string / regex literal that
 * starts at `index` end? — and none of them decide *which* construct starts there. That call
 * needs lexical context and lives in i18n-lex-mode.mjs; the walk itself lives in
 * i18n-source-tokens.mjs.
 */

// JavaScript ends a line at any of these four, and a comment or regex literal ends with the line.
// Recognising only \n would let a file written with bare CR or with a paragraph separator read as
// one endless comment, blanking every call site after it. Inside a string literal only CR and LF
// are terminators, since U+2028 and U+2029 have been legal there since ES2019.
const LINE_TERMINATOR = /[\n\r\u2028\u2029]/;
const STRING_TERMINATOR = /[\n\r]/;

export function blanked(text) {
  return text.replace(/[^\n]/g, ' ');
}

export function commentEnd(source, index) {
  const pair = source.slice(index, index + 2);
  if (pair === '//') {
    const terminator = source.slice(index).search(LINE_TERMINATOR);
    return terminator === -1 ? source.length : index + terminator;
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
      // A line continuation escapes the whole terminator sequence, CRLF included.
      cursor += source.startsWith('\r\n', cursor + 1) ? 3 : 2;
      continue;
    }
    if (source[cursor] === quote) return cursor + 1;
    if (STRING_TERMINATOR.test(source[cursor])) return cursor;
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
    if (LINE_TERMINATOR.test(char)) return -1;
    if (char === '[') inClass = true;
    else if (char === ']') inClass = false;
    else if (char === '/' && !inClass) return cursor + 1;
    cursor += 1;
  }
  return -1;
}
