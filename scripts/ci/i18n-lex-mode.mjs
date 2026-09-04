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

// An identifier is not ASCII-only, and `\w` would end a word early: `π` would read as punctuation
// and put the `/` after it in operand position, turning a division into a phantom regex. The walk
// steps one UTF-16 code unit at a time, so surrogates count too: half of an astral identifier is
// not punctuation either.
const IDENTIFIER = /[\p{ID_Continue}$\uD800-\uDFFF]/u;

// A token that ends a value, so a `+`/`-` doubled onto it is a postfix operator rather than the
// start of one: `i++ / 2` divides, while `i + +x` does not even reach this question.
const VALUE_END = /[\p{ID_Continue}$)\]!'"`\uD800-\uDFFF]/u;

// Whitespace may separate a member from its dot, but a line break may not precede a postfix
// `++`: that is a restricted production, and the break ends the statement instead.
const SPACE = /\s/;
const INLINE_SPACE = /[^\S\r\n\u2028\u2029]/;

function skipBack(emitted, start, space) {
  let cursor = start;
  while (cursor > 0 && space.test(emitted[cursor - 1])) cursor -= 1;
  return cursor;
}

// `obj\n  .catch(x)` is legal, so a dot may sit behind whitespace, but `#` may not: it and its
// private name are one token.
function precededByAccessor(emitted, start) {
  if (emitted[start - 1] === '#') return true;
  return emitted[skipBack(emitted, start, SPACE) - 1] === '.';
}

/**
 * The word before the cursor, but only when it reads as a keyword. `obj.catch(…)`,
 * `iterator.return` and `this.#default` are member names, and treating them as keywords mislexes
 * the `/` after them — optional chaining included, since `?.` also ends in a dot.
 */
function keywordBefore(emitted) {
  const end = skipBack(emitted, emitted.length, SPACE);
  let start = end;
  while (start > 0 && IDENTIFIER.test(emitted[start - 1])) start -= 1;
  return precededByAccessor(emitted, start) ? '' : emitted.slice(start, end);
}

function isPostfix(char, emitted) {
  if (char !== '+' && char !== '-') return false;
  const sign = emitted.length - 1;
  if (emitted[sign] !== char) return false;
  const value = skipBack(emitted, sign, INLINE_SPACE);
  return value > 0 && VALUE_END.test(emitted[value - 1]);
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
  // TypeScript's `x!` leaves a value behind, so the `/` after it divides, while the `!` of `!x`
  // is an operator a regex may follow — `if (!/^\d+$/.test(s))`.
  if (char === '!') {
    mode.last = startsRegex(mode, emitted) ? 'operand' : 'value';
    return;
  }
  if (isPostfix(char, emitted)) mode.last = 'value';
  else if (IDENTIFIER.test(char)) mode.last = 'word';
  else mode.last = char === ']' ? 'value' : 'operand';
}

/**
 * JSX puts a `/` where an expression never would: `</a>` closes a tag and `/>` ends one, and both
 * sit in operand position. Read either as a regex opener and the literal runs to the next slash on
 * the line, swallowing whatever lies between — an attribute's string, or the `/*` that opens a
 * `{…}` comment, whose body is then read as live keys. Only immediate adjacency counts, so a
 * genuine `a < /re/.test(b)` still opens its regex.
 */
function slashClosesTag(emitted, next) {
  return next === '>' || emitted[emitted.length - 1] === '<';
}

export function startsRegex(mode, emitted, next) {
  if (slashClosesTag(emitted, next)) return false;
  if (mode.last === 'value') return false;
  if (mode.last === 'word') return KEYWORD_BEFORE_REGEX.has(keywordBefore(emitted));
  return true;
}
