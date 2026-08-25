// @jest-environment @stryker-mutator/jest-runner/jest-env/node
//
// tests/unit/tooling/eslint-gate-fixtures.test.ts
//
// Adversarial, must-fail coverage for the custom ESLint enforcement selectors in
// eslint.config.mjs (issue #189). `make lint-eslint` proves the rules AS CONFIGURED are obeyed,
// but nothing else proves a configured selector actually MATCHES the code it was written to ban.
// A syntactically wrong selector, a reordered flat-config override that drops a selector family
// (flat config REPLACES, not merges, `no-restricted-syntax`), or a narrowed `files`/`ignores`
// scope all silently stop a gate firing while CI stays green. This suite closes that gap in
// three layers:
//
//   1. Wiring — the resolved `no-restricted-syntax` severity per src scope is error (2).
//   2. Behavior — a must-fail fixture per selector fires with the expected issue tag, and the
//      sanctioned exemptions (use-* hooks, static members in .tsx error boundaries) stay clean.
//   3. Rot-guard — the union of fixture `covers` equals the live error-severity selector
//      universe, so a NEW selector added to eslint.config.mjs cannot ship without a fixture.
//
// The ESLint Node API (config resolution + Linter#verify with RESOLVED languageOptions) runs in
// a child `node` process — jest's CJS vm cannot load ESLint v9's dynamic import() of the flat
// config. Assertions match only the stable issue tag (e.g. "issue #100"), never full message
// text. Fixture table + selector strings: scripts/ci/eslint-gate-fixtures.mjs.
import { execFileSync } from 'node:child_process';

interface FixtureResult {
  id: string;
  file: string;
  covers: string[];
  expect: 'fail' | 'pass';
  rule: string;
  tag: string;
  messages: { ruleId: string | null; message: string; line: number }[];
}

interface GateReport {
  probes: Record<string, { severity: number; selectors: string[] }>;
  universe: string[];
  fixtures: FixtureResult[];
}

const report: GateReport = JSON.parse(
  execFileSync('node', ['scripts/ci/eslint-gate-fixtures.mjs'], {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 16,
  })
);

describe('custom ESLint selector coverage (issue #189)', () => {
  describe('wiring: no-restricted-syntax is error-severity in every src scope', () => {
    it.each(Object.keys(report.probes))('scope %s resolves at error (2)', (scope) => {
      expect(report.probes[scope].severity).toBe(2);
    });

    it('the error-severity selector universe is non-empty and includes load-bearing gates', () => {
      expect(report.universe.length).toBeGreaterThan(0);
      expect(report.universe).toEqual(
        expect.arrayContaining([
          'MethodDefinition[static=true]', // #100
          "JSXAttribute[name.name='data-testid']", // #90
          'TSInterfaceDeclaration', // #88 (logic files)
          'VariableDeclaration:not([declare=true])', // #88 (type-only files)
        ])
      );
    });
  });

  describe('behavior: forbidden-pattern fixtures fire; sanctioned exemptions stay clean', () => {
    const failFixtures = report.fixtures.filter((f) => f.expect === 'fail');
    const passFixtures = report.fixtures.filter((f) => f.expect === 'pass');

    it.each(failFixtures.map((f) => [f.id, f] as const))(
      'must-fail fixture %s fires its gate',
      (_id, fx) => {
        const ruleMatches = fx.messages.filter((m) => m.ruleId === fx.rule);
        expect(ruleMatches.length).toBeGreaterThan(0);
        // No parse errors masquerading as "clean".
        expect(fx.messages.some((m) => m.ruleId === null)).toBe(false);
        if (fx.tag) {
          expect(ruleMatches.some((m) => m.message.includes(fx.tag))).toBe(true);
        }
      }
    );

    it.each(passFixtures.map((f) => [f.id, f] as const))(
      'exempt fixture %s does not fire',
      (_id, fx) => {
        expect(fx.messages.filter((m) => m.ruleId === fx.rule)).toHaveLength(0);
        expect(fx.messages.some((m) => m.ruleId === null)).toBe(false);
      }
    );
  });

  describe('rot-guard: every error-severity src selector has a must-fail fixture', () => {
    it('fixture coverage exactly equals the live selector universe', () => {
      const covered = new Set(
        report.fixtures.filter((f) => f.expect === 'fail').flatMap((f) => f.covers)
      );
      const universe = new Set(report.universe);
      const uncovered = [...universe].filter((s) => !covered.has(s));
      const extra = [...covered].filter((s) => !universe.has(s));
      // A new/edited selector in eslint.config.mjs surfaces here as `uncovered`; a removed
      // selector surfaces as `extra`. Add or update a fixture in
      // scripts/ci/eslint-gate-fixtures.mjs — never delete the assertion.
      expect({ uncovered, extra }).toEqual({ uncovered: [], extra: [] });
    });
  });
});
