// scripts/ci/eslint-gate-fixtures.mjs
//
// Adversarial coverage for the custom ESLint enforcement selectors in eslint.config.mjs
// (issue #189). Resolves the effective flat-config for representative src paths, runs
// forbidden-pattern fixtures through the RESOLVED rule options + languageOptions (parser and
// parserOptions come from calculateConfigForFile, never hand-built), and enumerates the
// error-severity selector universe so a new selector cannot ship without a must-fail fixture.
//
// Runs in a plain `node` child process (spawned by tests/unit/tooling/eslint-gate-fixtures.test.ts):
// jest.config.ts runs CJS Jest with no --experimental-vm-modules, and ESLint v9 loads the flat
// eslint.config.mjs via a native dynamic import() that fails inside Jest's vm context.
import { ESLint, Linter } from 'eslint';
import flatConfig from '../../eslint.config.mjs';

const eslint = new ESLint({ cwd: process.cwd() });

// One virtual probe per load-bearing src override scope. calculateConfigForFile resolves by
// glob, so the files need not exist — the resolved block is what matters.
const PROBES = {
  logic: 'src/services/__probe__.ts', // non-React logic .ts (no-static #100 + data-testid + type-decl + process.env)
  component: 'src/components/__probe__.tsx', // component (data-testid + type-decl)
  typeOnly: 'src/modules/user/features/auth/types/__probe__.ts', // type-only file (#88 purity)
  hook: 'src/modules/user/features/auth/stores/use-__probe__.ts', // hook — EXEMPT from #100
  env: 'src/config/env/__probe__.ts', // env config (#112 process.env)
};

// Exact selector strings, copied verbatim from the resolved config. The rot-guard compares the
// live universe against the union of fixture `covers`, so any edit to a selector string in
// eslint.config.mjs changes the universe and fails until a fixture is updated to match.
const S = {
  testidJsx: "JSXAttribute[name.name='data-testid']",
  testidProp: "Property[key.value='data-testid']",
  testidPropSig: "TSPropertySignature[key.value='data-testid']",
  staticMethod: 'MethodDefinition[static=true]',
  staticProp: 'PropertyDefinition[static=true]',
  funcDecl: 'Program > FunctionDeclaration',
  exportFuncDecl: 'Program > ExportNamedDeclaration > FunctionDeclaration',
  defaultFuncDecl: 'ExportDefaultDeclaration > FunctionDeclaration',
  arrowConst:
    "Program > VariableDeclaration > VariableDeclarator[init.type='ArrowFunctionExpression'], Program > ExportNamedDeclaration > VariableDeclaration > VariableDeclarator[init.type='ArrowFunctionExpression'], ExportDefaultDeclaration > ArrowFunctionExpression",
  funcExprConst:
    "Program > VariableDeclaration > VariableDeclarator[init.type='FunctionExpression'], Program > ExportNamedDeclaration > VariableDeclaration > VariableDeclarator[init.type='FunctionExpression'], ExportDefaultDeclaration > FunctionExpression",
  interfaceInLogic: 'TSInterfaceDeclaration',
  typeAliasInLogic: 'TSTypeAliasDeclaration',
  processEnv:
    "MemberExpression[object.name='process'][property.name='env'],MemberExpression[object.name='process'][property.value='env']",
  varInType: 'VariableDeclaration:not([declare=true])',
  funcInType: 'FunctionDeclaration:not([declare=true])',
  classInType: 'ClassDeclaration:not([declare=true])',
  enumInType: 'TSEnumDeclaration:not([declare=true])',
  stmtInType:
    'ExpressionStatement, IfStatement, ForStatement, ForInStatement, ForOfStatement, WhileStatement, DoWhileStatement, SwitchStatement, TryStatement, ThrowStatement, WithStatement, LabeledStatement, DebuggerStatement',
  defaultExportInType: 'ExportDefaultDeclaration > *:not(TSInterfaceDeclaration)',
};

// Must-FAIL fixtures — one per error-severity selector string in the src scopes, covering the
// adversarial variants human review had to catch by hand (statics, generators, default-export
// functions, top-level arrow/function-expression consts, data-testid as JSXAttribute AND as a
// prop-type signature, interface/type declarations in logic files, runtime in type-only files,
// process.env access, and the #107 deep cross-boundary import). Must-PASS fixtures pin the
// sanctioned exemptions (use-* hooks, static members in .tsx error boundaries).
const FIXTURES = [
  // data-testid ban (#90)
  {
    id: 'jsx-data-testid',
    file: PROBES.component,
    code: 'const A = () => <div data-testid="x" />;',
    covers: [S.testidJsx],
    expect: 'fail',
    rule: 'no-restricted-syntax',
    tag: 'issue #90',
  },
  {
    id: 'obj-data-testid',
    file: PROBES.logic,
    code: "const o = { 'data-testid': 'x' };",
    covers: [S.testidProp],
    expect: 'fail',
    rule: 'no-restricted-syntax',
    tag: 'issue #90',
  },
  {
    id: 'propsig-data-testid',
    file: PROBES.typeOnly,
    code: "export interface P { 'data-testid': string }",
    covers: [S.testidPropSig],
    expect: 'fail',
    rule: 'no-restricted-syntax',
    tag: 'issue #90',
  },
  // no-static / no-free-function (#100)
  {
    id: 'static-method',
    file: PROBES.logic,
    code: 'class C { static m(): void {} }',
    covers: [S.staticMethod],
    expect: 'fail',
    rule: 'no-restricted-syntax',
    tag: 'issue #100',
  },
  {
    id: 'static-prop',
    file: PROBES.logic,
    code: 'class C { static x = 1; }',
    covers: [S.staticProp],
    expect: 'fail',
    rule: 'no-restricted-syntax',
    tag: 'issue #100',
  },
  {
    id: 'func-decl',
    file: PROBES.logic,
    code: 'function f(): void {}',
    covers: [S.funcDecl],
    expect: 'fail',
    rule: 'no-restricted-syntax',
    tag: 'issue #100',
  },
  {
    id: 'export-func-decl',
    file: PROBES.logic,
    code: 'export function g(): void {}',
    covers: [S.exportFuncDecl],
    expect: 'fail',
    rule: 'no-restricted-syntax',
    tag: 'issue #100',
  },
  {
    id: 'default-generator',
    file: PROBES.logic,
    code: 'export default function* h(): Generator<number> { yield 1; }',
    covers: [S.defaultFuncDecl],
    expect: 'fail',
    rule: 'no-restricted-syntax',
    tag: 'issue #100',
  },
  // S.arrowConst is a 3-alternative comma-separated selector; one fixture per branch so a
  // broken alternative cannot pass unnoticed (plain top-level const, export const, default export).
  {
    id: 'arrow-const-plain',
    file: PROBES.logic,
    code: 'const a = (): void => {};',
    covers: [S.arrowConst],
    expect: 'fail',
    rule: 'no-restricted-syntax',
    tag: 'issue #100',
  },
  {
    id: 'arrow-const-export',
    file: PROBES.logic,
    code: 'export const a = (): void => {};',
    covers: [S.arrowConst],
    expect: 'fail',
    rule: 'no-restricted-syntax',
    tag: 'issue #100',
  },
  {
    id: 'arrow-default-export',
    file: PROBES.logic,
    code: 'export default (): void => {};',
    covers: [S.arrowConst],
    expect: 'fail',
    rule: 'no-restricted-syntax',
    tag: 'issue #100',
  },
  // S.funcExprConst is likewise a 3-alternative selector: plain const, export const, and a
  // default-exported function EXPRESSION. The expression branch needs parentheses — a bare
  // `export default function () {}` parses as a FunctionDeclaration (covered by S.defaultFuncDecl,
  // the `default-generator` fixture), not a FunctionExpression.
  {
    id: 'funcexpr-const-plain',
    file: PROBES.logic,
    code: 'const b = function (): void {};',
    covers: [S.funcExprConst],
    expect: 'fail',
    rule: 'no-restricted-syntax',
    tag: 'issue #100',
  },
  {
    id: 'funcexpr-const-export',
    file: PROBES.logic,
    code: 'export const b = function (): void {};',
    covers: [S.funcExprConst],
    expect: 'fail',
    rule: 'no-restricted-syntax',
    tag: 'issue #100',
  },
  {
    id: 'funcexpr-default-export',
    file: PROBES.logic,
    code: 'export default (function (): void {});',
    covers: [S.funcExprConst],
    expect: 'fail',
    rule: 'no-restricted-syntax',
    tag: 'issue #100',
  },
  // type declarations in logic files (#88)
  {
    id: 'interface-in-logic',
    file: PROBES.logic,
    code: 'interface I { a: string }',
    covers: [S.interfaceInLogic],
    expect: 'fail',
    rule: 'no-restricted-syntax',
    tag: 'issue #88',
  },
  {
    id: 'typealias-in-logic',
    file: PROBES.logic,
    code: 'type T = string;',
    covers: [S.typeAliasInLogic],
    expect: 'fail',
    rule: 'no-restricted-syntax',
    tag: 'issue #88',
  },
  // process.env ban (#112) — a 2-alternative selector; both branches get a fixture. Computed
  // access (`process['env']`) is the adversarial variant that once bypassed the dot-only gate.
  {
    id: 'process-env-dot',
    file: PROBES.logic,
    code: 'const e = process.env;',
    covers: [S.processEnv],
    expect: 'fail',
    rule: 'no-restricted-syntax',
    tag: 'issue #112',
  },
  {
    id: 'process-env-computed',
    file: PROBES.logic,
    code: "const e = process['env'];",
    covers: [S.processEnv],
    expect: 'fail',
    rule: 'no-restricted-syntax',
    tag: 'issue #112',
  },
  // type-only-file purity (#88)
  {
    id: 'var-in-type',
    file: PROBES.typeOnly,
    code: 'const x = 1;',
    covers: [S.varInType],
    expect: 'fail',
    rule: 'no-restricted-syntax',
    tag: 'issue #88',
  },
  {
    id: 'func-in-type',
    file: PROBES.typeOnly,
    code: 'function f() {}',
    covers: [S.funcInType],
    expect: 'fail',
    rule: 'no-restricted-syntax',
    tag: 'issue #88',
  },
  {
    id: 'class-in-type',
    file: PROBES.typeOnly,
    code: 'class C {}',
    covers: [S.classInType],
    expect: 'fail',
    rule: 'no-restricted-syntax',
    tag: 'issue #88',
  },
  {
    id: 'enum-in-type',
    file: PROBES.typeOnly,
    code: 'enum E { A }',
    covers: [S.enumInType],
    expect: 'fail',
    rule: 'no-restricted-syntax',
    tag: 'issue #88',
  },
  // S.stmtInType bans 13 homogeneous statement node types in one selector. One representative
  // (IfStatement) proves the selector is wired; a per-branch fixture for every type is not
  // feasible — `WithStatement` is a hard SyntaxError in a strict ES module, so it cannot be
  // exercised through the parser at all.
  {
    id: 'statement-in-type',
    file: PROBES.typeOnly,
    code: 'if (globalThis) { /* runtime */ }',
    covers: [S.stmtInType],
    expect: 'fail',
    rule: 'no-restricted-syntax',
    tag: 'issue #88',
  },
  {
    id: 'default-export-in-type',
    file: PROBES.typeOnly,
    code: 'export default 1;',
    covers: [S.defaultExportInType],
    expect: 'fail',
    rule: 'no-restricted-syntax',
    tag: 'issue #88',
  },
  // module/feature public-API boundary (#107) — deep cross-boundary import
  {
    id: 'deep-auth-import',
    file: PROBES.component,
    code: "import { LoginAPI } from '@auth/repositories/login-api';\nconst A = () => <div>{String(LoginAPI)}</div>;",
    covers: [],
    expect: 'fail',
    rule: 'no-restricted-imports',
    tag: '',
  },
  // Must-PASS exemptions
  {
    id: 'hook-arrow-const-exempt',
    file: PROBES.hook,
    code: 'export const useX = (): void => {};',
    covers: [],
    expect: 'pass',
    rule: 'no-restricted-syntax',
    tag: '',
  },
  {
    id: 'tsx-static-error-boundary-exempt',
    file: PROBES.component,
    code: 'class EB { static getDerivedStateFromError() { return {}; } }',
    covers: [],
    expect: 'pass',
    rule: 'no-restricted-syntax',
    tag: '',
  },
];

function severityOf(entry) {
  return Array.isArray(entry) ? entry[0] : entry;
}
function selectorsOf(entry) {
  return Array.isArray(entry)
    ? entry.slice(1).map((e) => (typeof e === 'string' ? e : e.selector))
    : [];
}

async function resolveProbe(file) {
  const cfg = await eslint.calculateConfigForFile(file);
  const nrs = cfg.rules?.['no-restricted-syntax'];
  return { severity: severityOf(nrs), selectors: selectorsOf(nrs) };
}

// Strip type-aware parser settings: calculateConfigForFile returns `parserOptions.project`
// (type-checked linting), which rejects the virtual fixture paths ("TSConfig does not include
// this file"). The gates under test are purely syntactic (no-restricted-syntax /
// no-restricted-imports), so a non-type-aware parse is both sufficient and correct.
function sanitizeLanguageOptions(languageOptions) {
  const parserOptions = { ...(languageOptions.parserOptions || {}) };
  delete parserOptions.project;
  delete parserOptions.projectService;
  delete parserOptions.program;
  delete parserOptions.EXPERIMENTAL_useProjectService;
  delete parserOptions.tsconfigRootDir;
  return { ...languageOptions, parserOptions };
}

async function runFixture(fx) {
  const cfg = await eslint.calculateConfigForFile(fx.file);
  const linter = new Linter({ configType: 'flat' });
  const messages = linter.verify(
    fx.code,
    [
      {
        files: ['**/*.ts', '**/*.tsx'],
        languageOptions: sanitizeLanguageOptions(cfg.languageOptions),
        rules: { [fx.rule]: cfg.rules[fx.rule] },
      },
    ],
    { filename: fx.file }
  );
  return messages.map((m) => ({ ruleId: m.ruleId, message: m.message, line: m.line }));
}

const probes = {};
for (const [key, file] of Object.entries(PROBES)) probes[key] = await resolveProbe(file);

// Universe: every error-severity `no-restricted-syntax` selector in EVERY src-scoped override
// block, derived from the flat config itself — NOT from the handful of representative probe
// paths. A selector added to a new/unprobed `src/**` scope therefore still enters the universe
// (and the rot-guard demands a fixture for it). A block counts as src-scoped when any of its
// `files` globs targets `src/`; the warn-level base block and the tests-scoped overrides are
// excluded by the severity + scope filters. Config selector strings are identical to those
// `calculateConfigForFile` resolves (ESLint never rewrites them).
const SRC_ERROR_SEVERITIES = new Set(['error', 2]);
function isSrcScoped(files) {
  return Array.isArray(files) && files.some((f) => typeof f === 'string' && f.startsWith('src/'));
}
function deriveUniverse(config) {
  const selectors = new Set();
  for (const entry of config) {
    const nrs = entry?.rules?.['no-restricted-syntax'];
    if (!Array.isArray(nrs) || !SRC_ERROR_SEVERITIES.has(nrs[0]) || !isSrcScoped(entry.files)) {
      continue;
    }
    for (const selector of selectorsOf(nrs)) selectors.add(selector);
  }
  return [...selectors].sort();
}
const universe = deriveUniverse(flatConfig);

const fixtures = [];
for (const fx of FIXTURES) {
  const messages = await runFixture(fx);
  fixtures.push({
    id: fx.id,
    file: fx.file,
    covers: fx.covers,
    expect: fx.expect,
    rule: fx.rule,
    tag: fx.tag,
    messages,
  });
}

process.stdout.write(JSON.stringify({ probes, universe, fixtures }));
