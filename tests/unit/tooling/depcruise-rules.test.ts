import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.join(__dirname, '..', '..', '..');
const CRUISE_SCRIPT = path.join(ROOT, 'scripts', 'ci', 'cruise-depcruise-fixtures.mjs');

const report = JSON.parse(
  execFileSync(process.execPath, [CRUISE_SCRIPT], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  })
) as {
  rules: { name: string; severity: string }[];
  fired: Record<string, string[]>;
  expected: Record<string, string[]>;
  alsoFires: Record<string, string[]>;
};

const DOCUMENTED_SUBSET_OVERLAPS: Record<string, string[]> = {
  'no-composition-root-cross-module-imports': ['no-cross-module-imports'],
  'no-providers-import-feature-internals': ['no-module-internal-imports'],
  'no-components-import-feature-internals': [
    'no-components-import-modules',
    'no-module-internal-imports',
  ],
  'no-store-to-feature-ui': ['no-feature-internal-imports'],
};

const fixtureNames = Object.keys(report.expected).sort();

describe('dependency-cruiser rule-rot guard', () => {
  it.each(fixtureNames)('%s fires on its violating fixture and nothing else fires', (name) => {
    expect(report.fired[name]).toEqual(report.expected[name]);
  });

  it('every rule in .dependency-cruiser.js has a fixture', () => {
    expect(report.rules.map((rule) => rule.name).sort()).toEqual(fixtureNames);
  });

  it('only the documented strict-subset rules are allowed to co-fire', () => {
    expect(report.alsoFires).toEqual(DOCUMENTED_SUBSET_OVERLAPS);
  });

  it('CLAUDE.md names the live rule count, so the documented scope cannot drift', () => {
    const documentation = readFileSync(path.join(ROOT, 'CLAUDE.md'), 'utf8');

    expect(documentation).toContain(`in ${report.rules.length} rules of hand-written path`);
  });
});
