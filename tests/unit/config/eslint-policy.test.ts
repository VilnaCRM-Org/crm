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
// (no-static / no-free-function), #107 (module/feature public-API imports), and #116 (Suspense
// fallbacks, router construction, route-object shape) — a rule rename must update both the
// config and this test together. The #116 router-construction carve-out for the single
// sanctioned `createBrowserRouter` site (`src/routes/routes.tsx`) is pinned by the must-pass
// fixture in scripts/ci/eslint-gate-fixtures.mjs, which resolves that real path.
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
const selectorsOf = (rule: unknown): string[] =>
  Array.isArray(rule) ? rule.slice(1).map((entry: { selector: string }) => entry.selector) : [];
const hasSelectorContaining = (rule: unknown, fragment: string): boolean =>
  selectorsOf(rule).some((selector) => selector.includes(fragment));

// `noUncheckedIndexedAccess` (issue #166) types this lookup as possibly undefined. Guard for
// real rather than asserting: a missing entry means the probe file dropped out of the resolved
// config, which must fail loudly here instead of surfacing as a confusing property access.
const rulesFor = (file: string): Record<string, unknown> => {
  const resolved = configs[file];
  if (!resolved) {
    throw new Error(`No resolved ESLint config for probe file ${file}`);
  }
  return resolved.rules;
};

describe('eslint.config.mjs policy integrity (issue #165)', () => {
  it('pins the no-static gate (#100) at error on non-hook logic files', () => {
    const nrs = rulesFor(LOGIC_TS)['no-restricted-syntax'];
    expect(severityOf(nrs)).toBe(2);
    expect(jsonOf(nrs)).toContain('PropertyDefinition[static=true]');
    expect(jsonOf(nrs)).toContain('MethodDefinition[static=true]');
  });

  it('keeps hooks EXEMPT from the no-static gate (issue #100 override for use-*)', () => {
    const nrs = rulesFor(HOOK_TS)['no-restricted-syntax'];
    // The gate itself stays active on hooks (data-testid / type-purity)...
    expect(severityOf(nrs)).toBe(2);
    // ...but the static/free-function selectors must NOT apply — hooks are functions by design.
    expect(jsonOf(nrs)).not.toContain('PropertyDefinition[static=true]');
    expect(jsonOf(nrs)).not.toContain('MethodDefinition[static=true]');
  });

  it('keeps the data-testid ban (issue #90) at error on components and logic files', () => {
    const componentNrs = rulesFor(COMPONENT_TSX)['no-restricted-syntax'];
    expect(severityOf(componentNrs)).toBe(2);
    expect(jsonOf(componentNrs)).toContain("JSXAttribute[name.name='data-testid']");
    expect(jsonOf(rulesFor(LOGIC_TS)['no-restricted-syntax'])).toContain(
      "JSXAttribute[name.name='data-testid']"
    );
  });

  it('pins the class-naming gate (issue #129) at error on logic files and off hooks', () => {
    const logicNrs = rulesFor(LOGIC_TS)['no-restricted-syntax'];
    expect(severityOf(logicNrs)).toBe(2);
    expect(jsonOf(logicNrs)).toContain(
      'ClassDeclaration[id.name=/^(?:Service|AppService|MyService)$/]'
    );
    expect(jsonOf(logicNrs)).toContain('ClassDeclaration:not([id.name])');
    expect(jsonOf(logicNrs)).toContain(
      '(?:Manager|Helper|Util|Utils|Data|Info|Common|Misc|Stuff|Wrapper|Object)$/'
    );
    expect(jsonOf(rulesFor(HOOK_TS)['no-restricted-syntax'])).not.toContain('AppService');
  });

  it('keeps the type-only-file purity gate (issue #88) at error on files under types/', () => {
    const nrs = rulesFor(TYPE_ONLY_TS)['no-restricted-syntax'];
    expect(severityOf(nrs)).toBe(2);
    expect(jsonOf(nrs)).toContain('VariableDeclaration:not([declare=true])');
  });

  it('keeps eslint-comments/no-use and max-len pinned on logic files', () => {
    const rules = rulesFor(LOGIC_TS);
    expect(severityOf(rules['eslint-comments/no-use'])).toBe(2);
    expect(rules['max-len']).toEqual([2, { code: 100 }]);
  });

  it('pins the Suspense-fallback gate (issue #116) at error on components', () => {
    const nrs = rulesFor(COMPONENT_TSX)['no-restricted-syntax'];
    expect(severityOf(nrs)).toBe(2);
    expect(hasSelectorContaining(nrs, 'JSXAttribute[name.name="fallback"]')).toBe(true);
    expect(hasSelectorContaining(nrs, 'Identifier[name="undefined"]')).toBe(true);
    expect(hasSelectorContaining(nrs, '[name.property.name="Suspense"]')).toBe(true);
    expect(hasSelectorContaining(nrs, ':not(:has(JSXAttribute[name.name="fallback"]))')).toBe(true);
  });

  it('pins the router-construction gate (issue #116) at error on components, logic, hooks', () => {
    const factory = 'ImportSpecifier[imported.name=/^create(Browser|Hash|Memory)Router$/]';
    const namespace = 'ImportDeclaration[source.value="react-router"] > ImportNamespaceSpecifier';
    [COMPONENT_TSX, LOGIC_TS, HOOK_TS].forEach((file) => {
      const nrs = rulesFor(file)['no-restricted-syntax'];
      expect(severityOf(nrs)).toBe(2);
      expect(hasSelectorContaining(nrs, factory)).toBe(true);
      expect(hasSelectorContaining(nrs, namespace)).toBe(true);
    });
  });

  it('keeps the route-object shape gate (issue #116) scoped to the route shell', () => {
    // The shape gate lives only in the `src/routes/**/*.tsx` blocks (its must-fail and must-pass
    // fixtures resolve those paths); a component or logic file never builds a route object.
    const shape = ':has(> Property[key.name="element"])';
    expect(hasSelectorContaining(rulesFor(COMPONENT_TSX)['no-restricted-syntax'], shape)).toBe(
      false
    );
    expect(hasSelectorContaining(rulesFor(LOGIC_TS)['no-restricted-syntax'], shape)).toBe(false);
  });

  it('keeps the module/feature public-API import boundary (issue #107) pinned', () => {
    // The @auth/*/* deep-import ban resolves onto cross-boundary logic files (services) and
    // type files, guarding the feature public-API contract for ESLint's half of the gate.
    expect(jsonOf(rulesFor(LOGIC_TS)['no-restricted-imports'])).toContain('@auth/*/*');
    expect(severityOf(rulesFor(LOGIC_TS)['no-restricted-imports'])).toBe(2);
  });
});
