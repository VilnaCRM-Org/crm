import fs from 'node:fs';
import path from 'node:path';

const MUTATION_ROOT = 'src';

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

export function collectMutateFiles() {
  return collectSourceFiles(MUTATION_ROOT)
    .filter((file) => !isExcluded(file))
    .sort();
}
