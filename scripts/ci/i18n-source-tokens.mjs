/**
 * Minimal lexical pass over a TypeScript source file for the localization parity gate (#151).
 *
 * The gate finds translation keys with regexes, which cannot tell code from prose. This pass
 * gives them two things the regexes need: comments blanked out, and the span of every string
 * literal, so a key name that merely appears inside a comment or inside unrelated prose is not
 * mistaken for a live call site.
 *
 * Byte offsets are preserved exactly — comments become spaces, newlines are kept — so reported
 * line numbers still point at the real source line.
 */

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
 * @param {string} source
 * @returns {{code: string, strings: {start: number, end: number}[]}} comment-blanked source of
 *   identical length, plus the half-open span of every string literal in it
 */
export function tokenizeSource(source) {
  const strings = [];
  let code = '';
  let cursor = 0;
  while (cursor < source.length) {
    const comment = commentEnd(source, cursor);
    if (comment !== -1) {
      code += blanked(source.slice(cursor, comment));
      cursor = comment;
      continue;
    }
    const quote = quoteEnd(source, cursor);
    if (quote !== -1) {
      strings.push({ start: cursor, end: quote });
      code += source.slice(cursor, quote);
      cursor = quote;
      continue;
    }
    code += source[cursor];
    cursor += 1;
  }
  return { code, strings };
}

/**
 * True when `index` sits strictly inside a string literal's quotes. A literal's own opening
 * quote is not "inside" it, so a translate call's argument still counts as code.
 */
export function isInsideString(strings, index) {
  return strings.some((span) => index > span.start && index < span.end - 1);
}

export default tokenizeSource;
