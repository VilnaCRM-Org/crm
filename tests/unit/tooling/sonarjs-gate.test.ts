// @jest-environment @stryker-mutator/jest-runner/jest-env/node
//
// tests/unit/tooling/sonarjs-gate.test.ts
//
// Pins the curated eslint-plugin-sonarjs bug-pattern set (issue #136). Every adopted rule is
// silent on `src/` today, so `make lint-eslint` alone cannot tell a working gate from a dead one:
// a plugin upgrade that renames a rule, a typed rule that loses its type information, or a later
// flat-config block that stops reaching a scope all leave CI green. This suite closes that in four
// layers, mirroring the issue-#189 selector suite:
//
//   1. Wiring — every src scope resolves every adopted rule at error; tests and stories do not.
//   2. Curation — recommended-preset rules this repository deliberately excludes stay off.
//   3. Behavior — a must-fail snippet fires each rule and its corrected twin stays clean.
//   4. Rot-guard — the fixture set equals the adopted universe, and CLAUDE.md names every rule.
//
// The ESLint Node API runs in a child `node` process (scripts/ci/sonarjs-gate-fixtures.mjs):
// jest's CJS vm cannot load ESLint v9's dynamic import() of the flat config.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

interface FixtureResult {
  rule: string;
  expect: 'fail' | 'pass';
  messages: { ruleId: string | null; message: string; line: number }[];
}

interface GateReport {
  universe: string[];
  scopes: {
    src: Record<string, Record<string, number>>;
    outOfScope: Record<string, Record<string, number>>;
  };
  fixtures: FixtureResult[];
}

const report: GateReport = JSON.parse(
  execFileSync('node', ['scripts/ci/sonarjs-gate-fixtures.mjs'], {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 16,
  })
);

// Rules the `recommended` preset enables that this repository deliberately does not adopt; the
// reason for each is in CLAUDE.md, "Code-health bug patterns (issue #136)". Spreading the preset
// into eslint.config.mjs would turn every one of them on and fail here.
const EXCLUDED = [
  'cognitive-complexity',
  'no-duplicate-string',
  'no-identical-functions',
  'prefer-read-only-props',
  'deprecation',
  'function-return-type',
  'no-invariant-returns',
  'different-types-comparison',
  'no-extra-arguments',
  'no-alphabetical-sort',
  'slow-regex',
  'super-linear-regex',
  'pseudo-random',
  'todo-tag',
];

const ruleMessages = (fx: FixtureResult): FixtureResult['messages'] =>
  fx.messages.filter((m) => m.ruleId === `sonarjs/${fx.rule}`);

describe('eslint-plugin-sonarjs bug-pattern gate (issue #136)', () => {
  describe('wiring: every src scope carries the adopted set at error', () => {
    it('adopts a non-empty set that includes the load-bearing bug patterns', () => {
      expect(report.universe).toEqual(
        expect.arrayContaining([
          'no-identical-conditions',
          'no-identical-expressions',
          'no-all-duplicated-branches',
          'no-ignored-return',
          'jsx-no-leaked-render',
        ])
      );
    });

    it.each(Object.entries(report.scopes.src))(
      'scope %s resolves each rule at error',
      (_s, rules) => {
        expect(Object.keys(rules).sort()).toEqual(report.universe);
        expect(new Set(Object.values(rules))).toEqual(new Set([2]));
      }
    );

    it.each(Object.entries(report.scopes.outOfScope))(
      'scope %s carries no sonarjs rule',
      (_s, rules) => {
        expect(rules).toEqual({});
      }
    );
  });

  describe('curation: the excluded recommended rules stay off', () => {
    it.each(EXCLUDED)('%s is not enabled in any src scope', (rule) => {
      Object.values(report.scopes.src).forEach((rules) => {
        expect(rules).not.toHaveProperty(rule);
      });
    });
  });

  describe('behavior: violations fire, corrected code stays clean', () => {
    const fail = report.fixtures.filter((f) => f.expect === 'fail');
    const pass = report.fixtures.filter((f) => f.expect === 'pass');

    it.each(fail.map((f) => [f.rule, f] as const))('must-fail fixture %s fires', (_r, fx) => {
      expect(ruleMessages(fx).length).toBeGreaterThan(0);
      expect(fx.messages.filter((m) => m.ruleId === null)).toEqual([]);
    });

    it.each(pass.map((f) => [f.rule, f] as const))('corrected fixture %s is clean', (_r, fx) => {
      expect(ruleMessages(fx)).toEqual([]);
      expect(fx.messages.filter((m) => m.ruleId === null)).toEqual([]);
    });
  });

  describe('rot-guard: fixtures and docs track the adopted universe exactly', () => {
    it('has exactly one must-fail and one corrected fixture per adopted rule', () => {
      const byExpect = (expect: FixtureResult['expect']): string[] =>
        report.fixtures
          .filter((f) => f.expect === expect)
          .map((f) => f.rule)
          .sort();
      // A rule added to eslint.config.mjs without a fixture, or a fixture left behind by a
      // removed rule, surfaces here. Update scripts/ci/sonarjs-gate-fixtures.mjs to match.
      expect(byExpect('fail')).toEqual(report.universe);
      expect(byExpect('pass')).toEqual(report.universe);
    });

    it('names every adopted rule in the CLAUDE.md section', () => {
      const claude = readFileSync('CLAUDE.md', 'utf8');
      const start = claude.indexOf('### Code-health bug patterns (issue #136)');
      expect(start).toBeGreaterThan(-1);
      const section = claude.slice(start, claude.indexOf('\n### ', start + 1));
      const missing = report.universe.filter((rule) => !section.includes(`\`${rule}\``));
      expect(missing).toEqual([]);
    });
  });
});
