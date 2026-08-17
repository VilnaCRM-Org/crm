/**
 * Minimal lexical pass over a TypeScript source file for the localization parity gate (#151).
 *
 * The gate finds translation keys with regexes, which cannot tell code from prose. This pass
 * gives them two things the regexes need: comments blanked out, and the span of every stretch
 * of literal string text, so a key name that merely appears inside a comment or inside
 * unrelated prose is not mistaken for a live call site.
 *
 * Regex literals are therefore consumed too, since their quote characters would otherwise open a
 * phantom string and swallow the rest of the line; and a template literal is walked segment by
 * segment, because its `${…}` interpolations are code that holds real translate calls while the
 * chunks around them are prose. Deciding whether a `/` opens a literal needs lexical context,
 * which i18n-lex-mode.mjs tracks from what this walk reports consuming.
 *
 * Byte offsets are preserved exactly — comments become spaces, newlines are kept — so reported
 * line numbers still point at the real source line.
 */

import { blanked, commentEnd, quoteEnd, regexEnd } from './i18n-lexemes.mjs';
import { createMode, noteChar, noteOperand, noteValue, startsRegex } from './i18n-lex-mode.mjs';

function topFrame(state) {
  return state.stack[state.stack.length - 1];
}

function copySpan(state, source, end) {
  state.code += source.slice(state.cursor, end);
  state.cursor = end;
}

/** Ends the current run of literal template text, whose closing delimiter starts at the cursor. */
function closeSegment(state, source, consumed) {
  state.strings.push({ start: topFrame(state).segmentStart, end: state.cursor + 1 });
  copySpan(state, source, state.cursor + consumed);
}

function templateStep(state, source) {
  const { cursor } = state;
  if (source[cursor] === '\\') {
    copySpan(state, source, cursor + 2);
    return;
  }
  if (source.startsWith('${', cursor)) {
    closeSegment(state, source, 2);
    state.stack.push({ kind: 'interpolation', depth: 0 });
    noteOperand(state.mode);
    return;
  }
  if (source[cursor] === '`') {
    closeSegment(state, source, 1);
    state.stack.pop();
    noteValue(state.mode);
    return;
  }
  state.code += source[cursor];
  state.cursor += 1;
}

/** Closing the brace an interpolation opened resumes the enclosing template's literal text. */
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

function consumedLiteral(state, source) {
  const comment = commentEnd(source, state.cursor);
  if (comment !== -1) {
    state.code += blanked(source.slice(state.cursor, comment));
    state.cursor = comment;
    return true;
  }
  const quote = quoteEnd(source, state.cursor);
  if (quote !== -1) {
    state.strings.push({ start: state.cursor, end: quote });
    copySpan(state, source, quote);
    noteValue(state.mode);
    return true;
  }
  if (source[state.cursor] !== '/' || !startsRegex(state.mode, state.code)) return false;
  const regex = regexEnd(source, state.cursor);
  if (regex === -1) return false;
  copySpan(state, source, regex);
  noteValue(state.mode);
  return true;
}

function codeStep(state, source) {
  if (consumedLiteral(state, source)) return;
  const char = source[state.cursor];
  if (char === '`') {
    state.stack.push({ kind: 'template', segmentStart: state.cursor });
  } else {
    trackBraces(state, char);
    noteChar(state.mode, char, state.code);
  }
  state.code += char;
  state.cursor += 1;
}

/**
 * @param {string} source
 * @returns {{code: string, strings: {start: number, end: number}[]}} comment-blanked source of
 *   identical length, plus the half-open span of every stretch of literal string text in it
 */
export function tokenizeSource(source) {
  const state = {
    code: '',
    cursor: 0,
    strings: [],
    stack: [{ kind: 'module' }],
    mode: createMode(),
  };
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
