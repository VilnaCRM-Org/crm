// @jest-environment node

import fs from 'fs';
import path from 'path';

function normalizeDirName(name: string): string {
  return name.replace(/[-_]/g, '').toLowerCase();
}

function getDuplicatePathPairs(rootDir: string): string[] {
  const duplicates: string[] = [];

  function walk(currentDir: string): void {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    const directoryNames = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
    const groups = new Map<string, string[]>();

    for (const directoryName of directoryNames) {
      const normalizedName = normalizeDirName(directoryName);
      const group = groups.get(normalizedName) ?? [];
      group.push(directoryName);
      groups.set(normalizedName, group);
    }

    for (const siblingNames of groups.values()) {
      if (siblingNames.length >= 2) {
        const hasKebabCase = siblingNames.some((name) => name.includes('-'));
        const hasUppercase = siblingNames.some((name) => /[A-Z]/.test(name));

        if (hasKebabCase && hasUppercase) {
          duplicates.push(
            `${currentDir}: ${siblingNames.sort().join(', ')}`
          );
        }
      }
    }

    for (const entry of entries) {
      if (entry.isDirectory()) {
        walk(path.join(currentDir, entry.name));
      }
    }
  }

  walk(rootDir);

  return duplicates.sort();
}

describe('path casing hygiene', () => {
  it('does not keep PascalCase directory aliases when a kebab-case path already exists', () => {
    expect(getDuplicatePathPairs(path.resolve(process.cwd(), 'src'))).toEqual([]);
  });
});
