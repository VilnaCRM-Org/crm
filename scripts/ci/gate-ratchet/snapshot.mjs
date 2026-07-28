import { readFileSync } from 'node:fs';

export function emptySnapshot() {
  return { numeric: {}, sets: {} };
}

export function addNumeric(snapshot, key, value, direction) {
  if (typeof value !== 'number' || Number.isNaN(value)) return;
  // Snapshots cross a process boundary as JSON, and JSON.stringify turns ±Infinity into `null`.
  // A null head value makes the weakening test (`head > base` for a ceiling) false, so raising a
  // guarded `maxNumericValue` to Number.POSITIVE_INFINITY — removing the budget outright — would
  // produce no finding. Clamping to the finite extreme survives the round trip and compares.
  const finite = Number.isFinite(value) ? value : Math.sign(value) * Number.MAX_VALUE;
  snapshot.numeric[key] = { value: finite, direction };
}

export function addSet(snapshot, key, items, rule) {
  snapshot.sets[key] = { items: [...items].map(String).sort(), rule };
}

export function readJson(absolutePath) {
  return JSON.parse(readFileSync(absolutePath, 'utf8'));
}

export function canonicalJson(value) {
  const entries = Object.entries(value ?? {}).sort(([left], [right]) => left.localeCompare(right));
  return JSON.stringify(Object.fromEntries(entries));
}
