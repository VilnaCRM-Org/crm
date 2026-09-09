import { readFileSync } from 'node:fs';

export function emptySnapshot() {
  return { numeric: {}, sets: {} };
}

export function addNumeric(snapshot, key, value, direction) {
  if (typeof value !== 'number' || Number.isNaN(value)) return;
  // Snapshots cross a process boundary as JSON, and JSON.stringify turns ±Infinity into `null`.
  // A null head value makes the weakening test (`head > base` for a ceiling) false, so raising a
  // guarded `maxNumericValue` to Number.POSITIVE_INFINITY — removing the budget outright — would
  // produce no finding. Record the sign in an explicit `infinite` flag that survives the round
  // trip; `compareSnapshots` restores ±Infinity from it. A plain clamp to Number.MAX_VALUE would
  // instead collide with a literal MAX_VALUE and hide the MAX_VALUE → Infinity relaxation.
  if (Number.isFinite(value)) {
    snapshot.numeric[key] = { value, direction };
    return;
  }
  snapshot.numeric[key] = { value: null, direction, infinite: Math.sign(value) };
}

export function effectiveValue(guard) {
  return guard.infinite ? guard.infinite * Infinity : guard.value;
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
