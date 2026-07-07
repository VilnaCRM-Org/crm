import fs from 'node:fs';
import path from 'node:path';

const MUTATION_ROOT = 'src';

/**
 * Path predicate excluding non-logic sources from mutation. Mirrors the negations in
 * `jest.config.ts` `collectCoverageFrom` so mutation scope and coverage scope stay identical
 * (types, styles, stories, generated code, DI-free primitives). `rel` is a POSIX path.
 */
function isExcluded(rel) {
  return (
    rel.endsWith('.d.ts') ||
    /\.(test|stories)\.(ts|tsx)$/.test(rel) ||
    rel.endsWith('/types.ts') ||
    rel.includes('/types/') ||
    rel.includes('/styles/') ||
    rel.endsWith('/theme.ts') ||
    rel.includes('/__mocks__/') ||
    rel.includes('/__fixtures__/') ||
    rel.startsWith('src/test-utils/') ||
    rel.startsWith('src/api/generated/') ||
    rel.includes('/i18n/') ||
    rel === 'src/index.tsx'
  );
}

function collectSourceFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.posix.join(dir, entry.name);
    if (entry.isDirectory()) return collectSourceFiles(full);
    if (/\.(ts|tsx)$/.test(entry.name)) return [full];
    return [];
  });
}

/**
 * Concrete, sorted list of source files Stryker mutates. The single source of truth for both
 * `stryker.config.mjs` (`mutate`) and `stryker.shard.config.mjs` (sliced per shard), so the
 * union of every shard equals the full set exactly.
 */
export function collectMutateFiles() {
  return collectSourceFiles(MUTATION_ROOT)
    .filter((file) => !isExcluded(file))
    .sort();
}
