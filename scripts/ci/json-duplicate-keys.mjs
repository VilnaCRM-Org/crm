/**
 * Duplicate-key detection for JSON documents (issue #151).
 *
 * JSON.parse keeps the LAST of two identical keys and reports nothing, so a locale file
 * that repeats a key silently loses a translation. The parity gate cannot see that through
 * the parsed object, so it scans the raw text instead.
 *
 * Assumes the text already parsed successfully — callers run JSON.parse first, which makes
 * this a scanner over well-formed input rather than a second JSON implementation.
 */

function readStringLiteral(text, start) {
  let index = start + 1;
  let value = '';
  while (index < text.length) {
    const char = text[index];
    if (char === '\\') {
      value += text.slice(index, index + 2);
      index += 2;
      continue;
    }
    if (char === '"') return { value, next: index + 1 };
    value += char;
    index += 1;
  }
  return { value, next: index };
}

function nextMeaningful(text, from) {
  let index = from;
  while (index < text.length && /\s/.test(text[index])) index += 1;
  return index;
}

function dottedPath(scopes, key) {
  return [...scopes.map((scope) => scope.key).filter(Boolean), key].join('.');
}

/**
 * @param {string} text raw JSON source
 * @returns {string[]} dotted paths that appear more than once inside the same object
 */
export function findDuplicateKeys(text) {
  const duplicates = new Set();
  const scopes = [];
  let index = 0;
  let lastKey = '';

  while (index < text.length) {
    const char = text[index];
    if (char === '"') {
      const { value, next } = readStringLiteral(text, index);
      const after = nextMeaningful(text, next);
      if (text[after] === ':' && scopes.length > 0) {
        const scope = scopes[scopes.length - 1];
        if (scope.keys.has(value)) duplicates.add(dottedPath(scopes, value));
        scope.keys.add(value);
        lastKey = value;
      }
      index = next;
      continue;
    }
    if (char === '{') {
      scopes.push({ keys: new Set(), key: lastKey });
      lastKey = '';
    } else if (char === '}') {
      scopes.pop();
    }
    index += 1;
  }

  return [...duplicates].sort();
}

export default findDuplicateKeys;
