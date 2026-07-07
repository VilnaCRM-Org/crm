import fs from 'node:fs';
import path from 'node:path';

const MUTATION_ROOT = 'src';

const EXCLUDED_PATTERNS = [
  /\.d\.ts$/,
  /\.(test|stories)\.(ts|tsx)$/,
  /\/types\.ts$/,
  /\/types\//,
  /\/styles\//,
  /\/theme\.ts$/,
  /\/__mocks__\//,
  /\/__fixtures__\//,
  /^src\/test-utils\//,
  /^src\/api\/generated\//,
  /\/i18n\//,
  /^src\/index\.tsx$/,
];

function isExcluded(rel) {
  return EXCLUDED_PATTERNS.some((pattern) => pattern.test(rel));
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
