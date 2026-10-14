function claimants(catalogs, locales, leafKeys) {
  const owners = new Map();
  for (const catalog of catalogs) {
    const keys = new Set(locales.flatMap((locale) => [...leafKeys(catalog.locales[locale] ?? {})]));
    for (const key of keys) owners.set(key, [...(owners.get(key) ?? []), catalog.dir]);
  }
  return owners;
}

/**
 * Check 2c: LocalizationGenerator merges catalogs last-writer-wins over an unsorted
 * directory walk, so two folders claiming one key resolve by filesystem order.
 */
function checkKeyOwnership(catalogs, violations, { locales, leafKeys, relative }) {
  for (const [key, dirs] of claimants(catalogs, locales, leafKeys)) {
    if (dirs.length < 2) continue;
    violations.push(
      `[key-ownership] "${key}" is defined by ${dirs.length} catalogs ` +
        `(${dirs.map(relative).join(', ')}) — ` +
        'the merge order is filesystem-dependent, so exactly one catalog must own a key'
    );
  }
}

function prefixesOf(key) {
  const segments = key.split('.');
  return segments.slice(1).map((_, index) => segments.slice(0, index + 1).join('.'));
}

function localeConflicts(catalogs, locale, leafKeys) {
  const owners = claimants(catalogs, [locale], leafKeys);
  const conflicts = new Map();
  for (const [key, nestedDirs] of owners) {
    for (const prefix of prefixesOf(key).filter((candidate) => owners.has(candidate))) {
      const leafDirs = owners.get(prefix);
      const foreign = nestedDirs.filter((dir) => !leafDirs.includes(dir));
      if (foreign.length === 0) continue;
      const entry = conflicts.get(prefix) ?? { leafDirs, nested: new Map() };
      entry.nested.set(key, foreign);
      conflicts.set(prefix, entry);
    }
  }
  return conflicts;
}

function describeConflict(prefix, { leafDirs, nested }, relative) {
  const keys = [...nested.keys()].sort();
  const dirs = [...new Set([...nested.values()].flat())].sort();
  return (
    `[key-prefix] "${prefix}" is a translation in ${leafDirs.map(relative).join(', ')} but an ` +
    `object holding ${keys.map((key) => `"${key}"`).join(', ')} in ` +
    `${dirs.map(relative).join(', ')} — a key cannot be both, so merging these catalogs ` +
    'would abort or silently drop translations'
  );
}

function checkKeyPrefixes(catalogs, violations, { locales, leafKeys, relative }) {
  const found = new Set();
  for (const locale of locales) {
    for (const [prefix, conflict] of localeConflicts(catalogs, locale, leafKeys)) {
      found.add(describeConflict(prefix, conflict, relative));
    }
  }
  violations.push(...found);
  return found.size;
}

export { checkKeyOwnership, checkKeyPrefixes };
