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
const PLAYWRIGHT_SPEC = 'tests/e2e/modules/back-to-main.spec.ts';
const ROUTE_SHELL_TSX = 'src/routes/routes.tsx';
const CONTAINER_SEAM_TSX = 'src/components/ui-container/index.tsx';
const BREAKPOINTS_SEAM_TS = 'src/components/ui-breakpoints/index.ts';
const BASE_SRC_JS = 'src/i18n.js';
const UI_TOOLKIT = '@vilnacrm/ui-toolkit';
const UI_TOOLKIT_SUBPATHS = `${UI_TOOLKIT}/*`;

interface ResolvedConfig {
  rules: Record<string, unknown>;
}

interface RestrictedImportPath {
  name: string;
  importNames?: string[];
  allowImportNames?: string[];
}

interface RestrictedImportPattern {
  group: string[];
}

interface RestrictedImportOptions {
  paths: RestrictedImportPath[];
  patterns: RestrictedImportPattern[];
}

const configs: Record<string, ResolvedConfig> = JSON.parse(
  execFileSync('node', ['scripts/ci/print-eslint-policy-config.mjs'], { encoding: 'utf8' })
);

const printedConfigs: Record<string, ResolvedConfig> = Object.fromEntries(
  [ROUTE_SHELL_TSX, CONTAINER_SEAM_TSX, BREAKPOINTS_SEAM_TS, BASE_SRC_JS].map((file) => [
    file,
    JSON.parse(
      execFileSync('node', ['node_modules/eslint/bin/eslint.js', '--print-config', file], {
        encoding: 'utf8',
      })
    ),
  ])
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

const anyRulesFor = (file: string): Record<string, unknown> => {
  const resolved = configs[file] ?? printedConfigs[file];
  if (!resolved) {
    throw new Error(`No resolved ESLint config for probe file ${file}`);
  }
  return resolved.rules;
};

const restrictedImportsFor = (file: string): RestrictedImportOptions => {
  const resolved = configs[file] ?? printedConfigs[file];
  if (!resolved) {
    throw new Error(`No resolved ESLint config for probe file ${file}`);
  }
  const rule = resolved.rules['no-restricted-imports'];
  if (!Array.isArray(rule) || rule[0] !== 2) {
    throw new Error(`no-restricted-imports is not an error on ${file}`);
  }
  return rule[1];
};

const toolkitGroupFor = (file: string): string[] => {
  const pattern = restrictedImportsFor(file).patterns.find(({ group }) =>
    group.includes(UI_TOOLKIT_SUBPATHS)
  );
  if (!pattern) {
    throw new Error(`No ${UI_TOOLKIT_SUBPATHS} pattern on ${file}`);
  }
  return pattern.group;
};

const groupsFor = (file: string): string[] =>
  restrictedImportsFor(file).patterns.flatMap(({ group }) => group);

const ROUTE_COMPOSER_TSX = 'src/routes/route-composer.tsx';
const LOCALE_FORMATTER_TS = 'src/services/locale-formatter/locale-formatter-core.ts';
const REACTIVE_VAR_BRIDGE_TS = 'src/lib/state/use-reactive-var.ts';
const ENV_TS = 'src/config/env/raw-env.ts';
const RESTRICTED_ADAPTER_TS = 'src/services/observability/apollo-link-factory.ts';

// One distinctive fragment per TB-1 entry (issue #332). The code array's fragments appear on
// every block that replaces `no-restricted-syntax` for code; the type-file array's on the
// type-only block.
const TB_CODE_FRAGMENTS = [
  'TSTypeLiteral',
  'TSTupleType',
  'TSArrayType',
  "TSTypeReference[typeName.name='Record']",
  'TSTypeReference[typeName.name=/^(Partial|Pick|Omit|Required)$/]',
];
const TB_TYPE_FILE_FRAGMENTS = [
  'Program > ExportNamedDeclaration TSTypeLiteral TSTypeLiteral',
  'Program > ExportNamedDeclaration TSTupleType',
  "Program > ExportNamedDeclaration TSArrayType[elementType.type!='TSTypeReference']",
  'Program > ExportNamedDeclaration TSIndexSignature',
  'Program > ExportNamedDeclaration TSInterfaceBody TSTypeReference',
];

const SRC_PROBES = [
  LOGIC_TS,
  COMPONENT_TSX,
  TYPE_ONLY_TS,
  HOOK_TS,
  ROUTE_SHELL_TSX,
  CONTAINER_SEAM_TSX,
  BREAKPOINTS_SEAM_TS,
];
const NON_SEAM_SRC_PROBES = [LOGIC_TS, COMPONENT_TSX, TYPE_ONLY_TS, HOOK_TS, ROUTE_SHELL_TSX];
const ALWAYS_FORBIDDEN_TOOLKIT_GROUP = [
  UI_TOOLKIT_SUBPATHS,
  `!${UI_TOOLKIT}/styles.css`,
  `!${UI_TOOLKIT}/ui-color-theme`,
];

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

  it('pins the typed-boundary gate (TB-1) at error on every src block', () => {
    [
      LOGIC_TS,
      COMPONENT_TSX,
      HOOK_TS,
      ROUTE_COMPOSER_TSX,
      LOCALE_FORMATTER_TS,
      REACTIVE_VAR_BRIDGE_TS,
      ENV_TS,
      RESTRICTED_ADAPTER_TS,
      ROUTE_SHELL_TSX,
      BASE_SRC_JS,
    ].forEach((file) => {
      const nrs = anyRulesFor(file)['no-restricted-syntax'];
      expect(severityOf(nrs)).toBe(2);
      TB_CODE_FRAGMENTS.forEach((fragment) => {
        expect(hasSelectorContaining(nrs, fragment)).toBe(true);
      });
      TB_TYPE_FILE_FRAGMENTS.forEach((fragment) => {
        expect(hasSelectorContaining(nrs, fragment)).toBe(false);
      });
    });

    const typeFileNrs = rulesFor(TYPE_ONLY_TS)['no-restricted-syntax'];
    expect(severityOf(typeFileNrs)).toBe(2);
    TB_TYPE_FILE_FRAGMENTS.forEach((fragment) => {
      expect(hasSelectorContaining(typeFileNrs, fragment)).toBe(true);
    });
    expect(hasSelectorContaining(typeFileNrs, 'PropertyDefinition')).toBe(false);
  });

  it('pins consistent-type-definitions (TB-1) at error with the interface style on src', () => {
    [LOGIC_TS, COMPONENT_TSX, TYPE_ONLY_TS, HOOK_TS].forEach((file) => {
      expect(rulesFor(file)['@typescript-eslint/consistent-type-definitions']).toEqual([
        2,
        'interface',
      ]);
    });
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

  it('pins the client-state gate (issue #110) at error on components, logic, hooks', () => {
    const zustand = 'ImportDeclaration[source.value=/^zustand(\\/|$)/]';
    const bridge = 'ImportSpecifier[imported.name="useSyncExternalStore"]';
    [COMPONENT_TSX, LOGIC_TS, HOOK_TS].forEach((file) => {
      const nrs = rulesFor(file)['no-restricted-syntax'];
      expect(severityOf(nrs)).toBe(2);
      expect(hasSelectorContaining(nrs, zustand)).toBe(true);
      expect(hasSelectorContaining(nrs, bridge)).toBe(true);
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

  it('pins the Playwright liveness gates (issues #167, #118, #144) at error on spec files', () => {
    const rules = rulesFor(PLAYWRIGHT_SPEC);
    expect(severityOf(rules['playwright/no-skipped-test'])).toBe(2);
    expect(jsonOf(rules['playwright/no-skipped-test'])).toContain('"disallowFixme":true');
    expect(severityOf(rules['playwright/no-focused-test'])).toBe(2);
    expect(severityOf(rules['playwright/expect-expect'])).toBe(2);
    // Promoted from warn once the count-gated assertions and fixed sleeps were burned down.
    expect(severityOf(rules['playwright/no-conditional-in-test'])).toBe(2);
    expect(severityOf(rules['playwright/no-wait-for-timeout'])).toBe(2);
  });

  it('pins the sonarjs bug-pattern gate (issue #136) at error on src and off tests', () => {
    // A representative slice; the full adopted set, its exclusions and a must-fail fixture per
    // rule are pinned by tests/unit/tooling/sonarjs-gate.test.ts.
    const pinned = [
      'sonarjs/no-identical-conditions',
      'sonarjs/no-identical-expressions',
      'sonarjs/no-all-duplicated-branches',
      'sonarjs/no-ignored-return',
      'sonarjs/jsx-no-leaked-render',
    ];
    [LOGIC_TS, COMPONENT_TSX, HOOK_TS].forEach((file) => {
      const rules = rulesFor(file);
      pinned.forEach((rule) => expect(severityOf(rules[rule])).toBe(2));
      // The recommended preset is deliberately not spread: complexity belongs to
      // rust-code-analysis (`make lint-metrics`), duplication to jscpd (`make lint-dup`).
      expect(rules['sonarjs/cognitive-complexity']).toBeUndefined();
      expect(rules['sonarjs/no-duplicate-string']).toBeUndefined();
    });
    expect(rulesFor(PLAYWRIGHT_SPEC)['sonarjs/no-identical-conditions']).toBeUndefined();
  });

  it('keeps the module/feature public-API import boundary (issue #107) pinned', () => {
    // The @auth/*/* deep-import ban resolves onto cross-boundary logic files (services) and
    // type files, guarding the feature public-API contract for ESLint's half of the gate.
    expect(jsonOf(rulesFor(LOGIC_TS)['no-restricted-imports'])).toContain('@auth/*/*');
    expect(severityOf(rulesFor(LOGIC_TS)['no-restricted-imports'])).toBe(2);
  });

  it('bans the ui-toolkit root barrel, styles.css, colour theme and theme default (#250)', () => {
    SRC_PROBES.forEach((file) => {
      const { paths } = restrictedImportsFor(file);
      expect(paths).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: UI_TOOLKIT }),
          expect.objectContaining({ name: `${UI_TOOLKIT}/styles.css` }),
          expect.objectContaining({ name: `${UI_TOOLKIT}/ui-color-theme` }),
          expect.objectContaining({
            name: `${UI_TOOLKIT}/ui-breakpoints`,
            importNames: ['default'],
          }),
        ])
      );
      expect(paths.find(({ name }) => name === UI_TOOLKIT)).not.toHaveProperty('importNames');
    });
  });

  it('forbids every ui-toolkit subpath outside the CRM seams (#250)', () => {
    NON_SEAM_SRC_PROBES.forEach((file) => {
      expect(toolkitGroupFor(file)).toEqual(ALWAYS_FORBIDDEN_TOOLKIT_GROUP);
    });
  });

  it('lets each ui-toolkit seam through its own subpath only (#250)', () => {
    expect(toolkitGroupFor(CONTAINER_SEAM_TSX)).toEqual([
      ...ALWAYS_FORBIDDEN_TOOLKIT_GROUP,
      `!${UI_TOOLKIT}/ui-container`,
    ]);
    expect(toolkitGroupFor(BREAKPOINTS_SEAM_TS)).toEqual([
      ...ALWAYS_FORBIDDEN_TOOLKIT_GROUP,
      `!${UI_TOOLKIT}/ui-breakpoints`,
    ]);
  });

  it('limits a ui-toolkit component seam to its subpath default export (#250)', () => {
    expect(restrictedImportsFor(CONTAINER_SEAM_TSX).paths).toContainEqual(
      expect.objectContaining({
        name: `${UI_TOOLKIT}/ui-container`,
        allowImportNames: ['default'],
      })
    );
    [...NON_SEAM_SRC_PROBES, BREAKPOINTS_SEAM_TS].forEach((file) => {
      expect(
        restrictedImportsFor(file).paths.filter(({ allowImportNames }) => allowImportNames)
      ).toEqual([]);
    });
  });

  it('keeps the public-API import boundary beside the ui-toolkit ban (#107, #250)', () => {
    expect(groupsFor(LOGIC_TS)).toEqual(
      expect.arrayContaining(['@/features/*/*', '@/modules/*/*', '@auth/*/*'])
    );
    expect(groupsFor(CONTAINER_SEAM_TSX)).toEqual(
      expect.arrayContaining(['@/features/*/*', '@/modules/*/*', '@auth/*/*'])
    );
    expect(groupsFor(TYPE_ONLY_TS)).toEqual(
      expect.arrayContaining(['@/features/*/*', '@auth/*/*', '@/modules/*/features/*/*'])
    );
    [COMPONENT_TSX, HOOK_TS, ROUTE_SHELL_TSX].forEach((file) => {
      expect(groupsFor(file)).toContain('@/features/*/*');
    });
  });
});
