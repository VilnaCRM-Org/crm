/**
 * Minimal lexical pass over a TypeScript source file for the localization parity gate (#151).
 *
 * The gate finds translation keys with regexes, which cannot tell code from prose. This pass
 * gives them two things the regexes need: comments blanked out, and the span of every stretch
 * of literal string text, so a key name that merely appears inside a comment or inside
 * unrelated prose is not mistaken for a live call site.
 *
 * Three constructs are therefore tokenized rather than skipped over: regex literals, whose
 * quote characters would otherwise open a phantom string and swallow the rest of the line; and
 * template literals, whose `${…}` interpolations are code and hold real translate calls, while
 * the literal chunks around them are prose.
 *
 * Byte offsets are preserved exactly — comments become spaces, newlines are kept — so reported
 * line numbers still point at the real source line.
 */

// `/` opens a regex everywhere an operand may start. After a value it is division instead,
// and guessing regex there would consume live code, so the ambiguous cases resolve to division.
const DIVISION_AFTER = new Set([')', ']', "'", '"', '`']);
const KEYWORD_BEFORE_REGEX = new Set([
  'return',
  'typeof',
  'instanceof',
  'in',
  'of',
  'case',
  'do',
  'else',
  'void',
  'delete',
  'new',
  'yield',
  'await',
  'throw',
]);

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

function previousToken(emitted) {
  let cursor = emitted.length - 1;
  while (cursor >= 0 && /\s/.test(emitted[cursor])) cursor -= 1;
  if (cursor < 0) return '';
  if (!/[\w$]/.test(emitted[cursor])) return emitted[cursor];
  const end = cursor + 1;
  while (cursor >= 0 && /[\w$]/.test(emitted[cursor])) cursor -= 1;
  return emitted.slice(cursor + 1, end);
}

function startsRegex(emitted) {
  const previous = previousToken(emitted);
  if (/^[\w$]+$/.test(previous)) return KEYWORD_BEFORE_REGEX.has(previous);
  return !DIVISION_AFTER.has(previous);
}

function regexEnd(source, index, emitted) {
  if (source[index] !== '/' || !startsRegex(emitted)) return -1;
  let cursor = index + 1;
  let inClass = false;
  while (cursor < source.length) {
    const char = source[cursor];
    if (char === '\\') {
      cursor += 2;
      continue;
    }
    // An unterminated regex is really a division: a regex literal cannot span a line break.
    if (char === '\n') return -1;
    if (char === '[') inClass = true;
    else if (char === ']') inClass = false;
    else if (char === '/' && !inClass) return cursor + 1;
    cursor += 1;
  }
  return -1;
}

function topFrame(state) {
  return state.stack[state.stack.length - 1];
}

function closeSegment(state, source, consumed) {
  state.strings.push({ start: topFrame(state).segmentStart, end: state.cursor + 1 });
  state.code += source.slice(state.cursor, state.cursor + consumed);
  state.cursor += consumed;
}

function templateStep(state, source) {
  const { cursor } = state;
  if (source[cursor] === '\\') {
    state.code += source.slice(cursor, cursor + 2);
    state.cursor += 2;
    return;
  }
  if (source.startsWith('${', cursor)) {
    closeSegment(state, source, 2);
    state.stack.push({ kind: 'interpolation', depth: 0 });
    return;
  }
  if (source[cursor] === '`') {
    closeSegment(state, source, 1);
    state.stack.pop();
    return;
  }
  state.code += source[cursor];
  state.cursor += 1;
}

function trackBraces(state, char) {
  const frame = topFrame(state);
  if (frame.kind !== 'interpolation') return;
  if (char === '{') frame.depth += 1;
  else if (char !== '}') return;
  else if (frame.depth > 0) frame.depth -= 1;
  else {
    state.stack.pop();
    topFrame(state).segmentStart = state.cursor;
  }
}

function copySpan(state, source, end) {
  state.code += source.slice(state.cursor, end);
  state.cursor = end;
}

function codeStep(state, source) {
  const { cursor } = state;
  const comment = commentEnd(source, cursor);
  if (comment !== -1) {
    state.code += blanked(source.slice(cursor, comment));
    state.cursor = comment;
    return;
  }
  const quote = quoteEnd(source, cursor);
  if (quote !== -1) {
    state.strings.push({ start: cursor, end: quote });
    copySpan(state, source, quote);
    return;
  }
  const regex = regexEnd(source, cursor, state.code);
  if (regex !== -1) {
    copySpan(state, source, regex);
    return;
  }
  if (source[cursor] === '`') state.stack.push({ kind: 'template', segmentStart: cursor });
  else trackBraces(state, source[cursor]);
  state.code += source[cursor];
  state.cursor += 1;
}

/**
 * @param {string} source
 * @returns {{code: string, strings: {start: number, end: number}[]}} comment-blanked source of
 *   identical length, plus the half-open span of every stretch of literal string text in it
 */
export function tokenizeSource(source) {
  const state = { code: '', cursor: 0, strings: [], stack: [{ kind: 'module' }] };
  while (state.cursor < source.length) {
    if (topFrame(state).kind === 'template') templateStep(state, source);
    else codeStep(state, source);
  }
  return { code: state.code, strings: state.strings };
}

/**
 * True when `index` sits strictly inside a run of literal string text. The delimiters that open
 * and close the run are not "inside" it, so a translate call's argument still counts as code.
 */
export function isInsideString(strings, index) {
  return strings.some((span) => index > span.start && index < span.end - 1);
}

export default tokenizeSource;
