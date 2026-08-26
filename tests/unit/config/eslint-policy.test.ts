// tests/unit/config/eslint-policy.test.ts
//
// Pins the load-bearing convention gates in eslint.config.mjs so a config-level rule deletion
// or severity downgrade fails CI (issue #165). Both existing enforcement layers — `make
// lint-eslint` and the `eslint-suppressions` grep — verify the rules AS CONFIGURED are obeyed
// and not suppressed inline; neither verifies the rules REMAIN configured. A config-level
// rule-off or an `eslint.config.mjs` selector deletion carries no inline suppression directive
// and passes the grep by construction, after which `lint-eslint` runs green because the rule it
// would have fired no longer exists. This test closes that bypass.
//
// Assertions pin severities + one distinctive selector/message substring per gate — NEVER
// full-config snapshots (config-evolution friction). Cross-reference: the CLAUDE.md
// "Enforcement" paragraphs for issues #88 (type-only files), #90 (data-testid), #100/#89
// (no-static / no-free-function), and #107 (module/feature public-API imports) — a rule rename
// must update both the config and this test together.
//
// Config resolution runs in a child `node` process (scripts/ci/print-eslint-policy-config.mjs),
// NOT in-process: jest.config.ts runs CJS Jest with no --experimental-vm-modules, and ESLint v9
// loads the flat eslint.config.mjs via a native dynamic import() that fails inside Jest's vm.
import { execFileSync } from 'node:child_process';

const LOGIC_TS = 'src/services/https-client/fetch-https-client.ts'; // non-hook logic .ts
const COMPONENT_TSX =
  'src/modules/user/features/auth/components/form-section/components/form-field.tsx';
const TYPE_ONLY_TS = 'src/modules/user/types/api-errors/validation-error.ts';
const HOOK_TS = 'src/modules/user/features/auth/stores/use-auth-token.ts';

interface ResolvedConfig {
  rules: Record<string, unknown>;
}

const configs: Record<string, ResolvedConfig> = JSON.parse(
  execFileSync('node', ['scripts/ci/print-eslint-policy-config.mjs'], { encoding: 'utf8' })
);

const severityOf = (rule: unknown): unknown => (Array.isArray(rule) ? rule[0] : rule);
const jsonOf = (rule: unknown): string => JSON.stringify(rule ?? []);

describe('eslint.config.mjs policy integrity (issue #165)', () => {
  it('pins the no-static gate (#100) at error on non-hook logic files', () => {
    const nrs = configs[LOGIC_TS].rules['no-restricted-syntax'];
    expect(severityOf(nrs)).toBe(2);
    expect(jsonOf(nrs)).toContain('PropertyDefinition[static=true]');
    expect(jsonOf(nrs)).toContain('MethodDefinition[static=true]');
  });

  it('keeps hooks EXEMPT from the no-static gate (issue #100 override for use-*)', () => {
    const nrs = configs[HOOK_TS].rules['no-restricted-syntax'];
    // The gate itself stays active on hooks (data-testid / type-purity)...
    expect(severityOf(nrs)).toBe(2);
    // ...but the static/free-function selectors must NOT apply — hooks are functions by design.
    expect(jsonOf(nrs)).not.toContain('PropertyDefinition[static=true]');
    expect(jsonOf(nrs)).not.toContain('MethodDefinition[static=true]');
  });

  it('keeps the data-testid ban (issue #90) at error on components and logic files', () => {
    const componentNrs = configs[COMPONENT_TSX].rules['no-restricted-syntax'];
    expect(severityOf(componentNrs)).toBe(2);
    expect(jsonOf(componentNrs)).toContain("JSXAttribute[name.name='data-testid']");
    expect(jsonOf(configs[LOGIC_TS].rules['no-restricted-syntax'])).toContain(
      "JSXAttribute[name.name='data-testid']"
    );
  });

  it('keeps the type-only-file purity gate (issue #88) at error on files under types/', () => {
    const nrs = configs[TYPE_ONLY_TS].rules['no-restricted-syntax'];
    expect(severityOf(nrs)).toBe(2);
    expect(jsonOf(nrs)).toContain('VariableDeclaration:not([declare=true])');
  });

  it('keeps eslint-comments/no-use and max-len pinned on logic files', () => {
    const rules = configs[LOGIC_TS].rules;
    expect(severityOf(rules['eslint-comments/no-use'])).toBe(2);
    expect(rules['max-len']).toEqual([2, { code: 100 }]);
  });

  it('keeps the module/feature public-API import boundary (issue #107) pinned', () => {
    // The @auth/*/* deep-import ban resolves onto cross-boundary logic files (services) and
    // type files, guarding the feature public-API contract for ESLint's half of the gate.
    expect(jsonOf(configs[LOGIC_TS].rules['no-restricted-imports'])).toContain('@auth/*/*');
    expect(severityOf(configs[LOGIC_TS].rules['no-restricted-imports'])).toBe(2);
  });
});
