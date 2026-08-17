/**
 * Lexical-mode tracking for the localization parity gate's source walk (issue #151).
 *
 * A `/` opens a regex literal in operand position and divides in value position, and reading the
 * single character before it is not enough to tell those apart. Two cases decide it wrongly and
 * both corrupt the scan: `if (cond) /re/.test(x)` — a `)` that closes a control header is operand
 * position, and mistaking the regex for division lets its quotes open a phantom string that
 * swallows the rest of the line; and `/a/ / 2` — the `/` after an unflagged regex is division,
 * and mistaking it for a regex swallows a following string literal, whose prose is then read as
 * live translation keys.
 *
 * So the walk reports what it consumed as it goes, and this module remembers whether the last
 * thing seen produced a value.
 */

// Parentheses that belong to a control header close in operand position, unlike a call's or a
// grouping's, which close in value position.
const CONTROL_KEYWORDS = new Set(['if', 'while', 'for', 'switch', 'catch', 'with']);

// Keywords that read as operators rather than values, so a regex may directly follow them.
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

export function createMode() {
  return { last: 'operand', parens: [] };
}

function previousWord(emitted) {
  let end = emitted.length;
  while (end > 0 && /\s/.test(emitted[end - 1])) end -= 1;
  let start = end;
  while (start > 0 && /[\w$]/.test(emitted[start - 1])) start -= 1;
  return emitted.slice(start, end);
}

/** A completed string, template or regex literal — the next `/` divides it. */
export function noteValue(mode) {
  mode.last = 'value';
}

/** An interpolation opener: what follows it starts an expression. */
export function noteOperand(mode) {
  mode.last = 'operand';
}

/** Reports one plain character, before it is emitted, so `emitted` still ends at the token before. */
export function noteChar(mode, char, emitted) {
  if (/\s/.test(char)) return;
  if (char === '(') {
    mode.parens.push(CONTROL_KEYWORDS.has(previousWord(emitted)));
    mode.last = 'operand';
    return;
  }
  if (char === ')') {
    mode.last = mode.parens.pop() === true ? 'operand' : 'value';
    return;
  }
  if (/[\w$]/.test(char)) mode.last = 'word';
  else mode.last = char === ']' ? 'value' : 'operand';
}

export function startsRegex(mode, emitted) {
  if (mode.last === 'value') return false;
  if (mode.last === 'word') return KEYWORD_BEFORE_REGEX.has(previousWord(emitted));
  return true;
}
