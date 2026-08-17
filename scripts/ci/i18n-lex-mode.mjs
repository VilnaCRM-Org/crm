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
  'default',
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

// A token that ends a value, so a `+`/`-` doubled onto it is a postfix operator rather than the
// start of one: `i++ / 2` divides, while `i + +x` does not even reach this question.
const VALUE_END = /[\w$)\]'"`]/;

function precededByDot(emitted, start) {
  let cursor = start;
  while (cursor > 0 && /\s/.test(emitted[cursor - 1])) cursor -= 1;
  return emitted[cursor - 1] === '.';
}

/**
 * The word before the cursor, but only when it reads as a keyword. `obj.catch(…)` and
 * `iterator.return` are property names, and treating them as keywords mislexes the `/` after
 * them — optional chaining included, since `?.` also ends in a dot.
 */
function keywordBefore(emitted) {
  let end = emitted.length;
  while (end > 0 && /\s/.test(emitted[end - 1])) end -= 1;
  let start = end;
  while (start > 0 && /[\w$]/.test(emitted[start - 1])) start -= 1;
  return precededByDot(emitted, start) ? '' : emitted.slice(start, end);
}

function isPostfix(char, emitted) {
  if (char !== '+' && char !== '-') return false;
  if (emitted[emitted.length - 1] !== char) return false;
  const before = emitted[emitted.length - 2];
  return before !== undefined && VALUE_END.test(before);
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
    mode.parens.push(CONTROL_KEYWORDS.has(keywordBefore(emitted)));
    mode.last = 'operand';
    return;
  }
  if (char === ')') {
    mode.last = mode.parens.pop() === true ? 'operand' : 'value';
    return;
  }
  if (isPostfix(char, emitted)) mode.last = 'value';
  else if (/[\w$]/.test(char)) mode.last = 'word';
  else mode.last = char === ']' ? 'value' : 'operand';
}

export function startsRegex(mode, emitted) {
  if (mode.last === 'value') return false;
  if (mode.last === 'word') return KEYWORD_BEFORE_REGEX.has(keywordBefore(emitted));
  return true;
}
