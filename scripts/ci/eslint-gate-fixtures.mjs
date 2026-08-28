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
  newBehavioralClassInComponent:
    "NewExpression[callee.type='Identifier'][callee.name=/^[A-Z]/]" +
    ':not([callee.name=/^(Error|TypeError|RangeError|SyntaxError|EvalError|ReferenceError|' +
    'URIError|AggregateError|URL|URLSearchParams|Date|Map|WeakMap|Set|WeakSet|Promise|' +
    'RegExp|Array|Object|Function|Proxy|Number|String|Boolean|Symbol|BigInt|Image|Audio|' +
    'Event|CustomEvent|AbortController|AbortSignal|FormData|Headers|Request|Response|Blob|' +
    'File|FileReader|TextEncoder|TextDecoder|Intl|Worker|WebSocket|Notification|' +
    'IntersectionObserver|ResizeObserver|MutationObserver|PerformanceObserver|' +
    'ArrayBuffer|SharedArrayBuffer|DataView|Int8Array|Uint8Array|Uint8ClampedArray|' +
    'Int16Array|Uint16Array|Int32Array|Uint32Array|Float32Array|Float64Array|' +
    'BigInt64Array|BigUint64Array)$/])',
  interfaceInLogic: 'TSInterfaceDeclaration',
  typeAliasInLogic: 'TSTypeAliasDeclaration',
  processEnv:
    "MemberExpression[object.name='process'][property.name='env'],MemberExpression[object.name='process'][property.value='env']",
  objectLiteralMethod:
    'Program > VariableDeclaration > VariableDeclarator > ObjectExpression > Property[value.type=/^(ArrowFunctionExpression|FunctionExpression)$/], Program > VariableDeclaration > VariableDeclarator > TSAsExpression > ObjectExpression > Property[value.type=/^(ArrowFunctionExpression|FunctionExpression)$/], Program > VariableDeclaration > VariableDeclarator > TSSatisfiesExpression > ObjectExpression > Property[value.type=/^(ArrowFunctionExpression|FunctionExpression)$/], Program > ExportNamedDeclaration > VariableDeclaration > VariableDeclarator > ObjectExpression > Property[value.type=/^(ArrowFunctionExpression|FunctionExpression)$/], Program > ExportNamedDeclaration > VariableDeclaration > VariableDeclarator > TSAsExpression > ObjectExpression > Property[value.type=/^(ArrowFunctionExpression|FunctionExpression)$/], Program > ExportNamedDeclaration > VariableDeclaration > VariableDeclarator > TSSatisfiesExpression > ObjectExpression > Property[value.type=/^(ArrowFunctionExpression|FunctionExpression)$/], ExportDefaultDeclaration > ObjectExpression > Property[value.type=/^(ArrowFunctionExpression|FunctionExpression)$/], ExportDefaultDeclaration > TSAsExpression > ObjectExpression > Property[value.type=/^(ArrowFunctionExpression|FunctionExpression)$/], ExportDefaultDeclaration > TSSatisfiesExpression > ObjectExpression > Property[value.type=/^(ArrowFunctionExpression|FunctionExpression)$/]',
  intlToLocaleName:
    'CallExpression[callee.property.name=/^toLocale(String|DateString|TimeString)$/]',
  intlToLocaleComputed:
    'CallExpression[callee.property.value=/^toLocale(String|DateString|TimeString)$/]',
  intlMember: "MemberExpression[object.name='Intl']",
  varInType: 'VariableDeclaration:not([declare=true])',
  funcInType: 'FunctionDeclaration:not([declare=true])',
  classInType: 'ClassDeclaration:not([declare=true])',
  enumInType: 'TSEnumDeclaration:not([declare=true])',
  stmtInType:
    'ExpressionStatement, IfStatement, ForStatement, ForInStatement, ForOfStatement, WhileStatement, DoWhileStatement, SwitchStatement, TryStatement, ThrowStatement, WithStatement, LabeledStatement, DebuggerStatement',
  defaultExportInType: 'ExportDefaultDeclaration > *:not(TSInterfaceDeclaration)',
  adHocMembership:
    'CallExpression[callee.property.name=/^(includes|some|every|find|findIndex|findLast|findLastIndex|indexOf|lastIndexOf|filter|at)$/][callee.object.property.name=/^(roles|permissions)$/],CallExpression[callee.property.value=/^(includes|some|every|find|findIndex|findLast|findLastIndex|indexOf|lastIndexOf|filter|at)$/][callee.object.property.name=/^(roles|permissions)$/],CallExpression[callee.property.name=/^(includes|some|every|find|findIndex|findLast|findLastIndex|indexOf|lastIndexOf|filter|at)$/][callee.object.name=/^(roles|permissions)$/],CallExpression[callee.property.value=/^(includes|some|every|find|findIndex|findLast|findLastIndex|indexOf|lastIndexOf|filter|at)$/][callee.object.name=/^(roles|permissions)$/],CallExpression[callee.property.name=/^(includes|some|every|find|findIndex|findLast|findLastIndex|indexOf|lastIndexOf|filter|at)$/][callee.object.property.value=/^(roles|permissions)$/],CallExpression[callee.property.value=/^(includes|some|every|find|findIndex|findLast|findLastIndex|indexOf|lastIndexOf|filter|at)$/][callee.object.property.value=/^(roles|permissions)$/],CallExpression[callee.property.name=\'has\'][callee.object.callee.name=\'Set\'][callee.object.arguments.0.property.name=/^(roles|permissions)$/],CallExpression[callee.property.name=\'has\'][callee.object.callee.name=\'Set\'][callee.object.arguments.0.property.value=/^(roles|permissions)$/],CallExpression[callee.property.name=\'has\'][callee.object.callee.name=\'Set\'][callee.object.arguments.0.name=/^(roles|permissions)$/],MemberExpression[computed=true][object.property.name=/^(roles|permissions)$/]:not([property.value=/^(includes|some|every|find|findIndex|findLast|findLastIndex|indexOf|lastIndexOf|filter|at)$/]),MemberExpression[computed=true][object.property.value=/^(roles|permissions)$/]:not([property.value=/^(includes|some|every|find|findIndex|findLast|findLastIndex|indexOf|lastIndexOf|filter|at)$/]),MemberExpression[computed=true][object.name=/^(roles|permissions)$/]:not([property.value=/^(includes|some|every|find|findIndex|findLast|findLastIndex|indexOf|lastIndexOf|filter|at)$/])',
  useCanRawPermission:
    'CallExpression[callee.name=\'useCan\'] > :matches(Literal, TemplateLiteral)',
  canRawPermission:
    'CallExpression[callee.property.name=/^(can|canAll|canAny)$/] > :matches(Literal, TemplateLiteral),CallExpression[callee.property.name=/^(can|canAll|canAny)$/] > ArrayExpression > :matches(Literal, TemplateLiteral),CallExpression[callee.property.value=/^(can|canAll|canAny)$/] > :matches(Literal, TemplateLiteral),CallExpression[callee.property.value=/^(can|canAll|canAny)$/] > ArrayExpression > :matches(Literal, TemplateLiteral),CallExpression[callee.name=/^(can|canAll|canAny)$/] > :matches(Literal, TemplateLiteral),CallExpression[callee.name=/^(can|canAll|canAny)$/] > ArrayExpression > :matches(Literal, TemplateLiteral)',
  permissionPropRaw:
    'JSXAttribute[name.name=\'permission\'] > Literal,JSXAttribute[name.name=\'permission\'] > JSXExpressionContainer > :matches(Literal, TemplateLiteral)',
  routeMetaPermissionRaw:
    'Property[key.name=\'permission\'] > :matches(Literal, TemplateLiteral).value,Property[key.value=\'permission\'] > :matches(Literal, TemplateLiteral).value,Property[key.name=\'permission\'] > ArrayExpression > :matches(Literal, TemplateLiteral),Property[key.value=\'permission\'] > ArrayExpression > :matches(Literal, TemplateLiteral)',
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
  // component DI bridge (#128) — the React-layer counterpart of the #100 bans above. The
  // built-in-constructor allowlist is proven separately, on real carve-out paths, by
  // tests/unit/tooling/component-di-gate.test.ts; this fixture pins the selector into the
  // rot-guard universe so it cannot be deleted from eslint.config.mjs unnoticed.
  {
    id: 'new-behavioral-class-in-component',
    file: PROBES.component,
    code: 'class Thing { run(): string { return "x"; } }\nconst A = () => <div>{new Thing().run()}</div>;',
    covers: [S.newBehavioralClassInComponent],
    expect: 'fail',
    rule: 'no-restricted-syntax',
    tag: 'issue #128',
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
  // top-level object-literal methods (#180) — the "wrap your free functions in an object"
  // evasion of the #89/#100 no-static/no-free-function gate. Method shorthand parses as a
  // `FunctionExpression`-valued Property, which is the branch the selector union targets.
  // The selector unions 3 roots x 3 holders; one fixture per branch, as with S.arrowConst.
  {
    id: 'object-literal-method-const',
    file: PROBES.logic,
    code: 'const o = { map(r: string): string { return r; } };',
    covers: [S.objectLiteralMethod],
    expect: 'fail',
    rule: 'no-restricted-syntax',
    tag: 'issues #89/#100/#180',
  },
  {
    id: 'object-literal-method-const-as',
    file: PROBES.logic,
    code: 'const o = { map(r: string): string { return r; } } as const;',
    covers: [S.objectLiteralMethod],
    expect: 'fail',
    rule: 'no-restricted-syntax',
    tag: 'issues #89/#100/#180',
  },
  {
    id: 'object-literal-method-const-satisfies',
    file: PROBES.logic,
    code: 'const o = { map(r: string): string { return r; } } satisfies object;',
    covers: [S.objectLiteralMethod],
    expect: 'fail',
    rule: 'no-restricted-syntax',
    tag: 'issues #89/#100/#180',
  },
  {
    id: 'object-literal-method-export',
    file: PROBES.logic,
    code: 'export const o = { map(r: string): string { return r; } };',
    covers: [S.objectLiteralMethod],
    expect: 'fail',
    rule: 'no-restricted-syntax',
    tag: 'issues #89/#100/#180',
  },
  {
    id: 'object-literal-method-export-as',
    file: PROBES.logic,
    code: 'export const o = { map(r: string): string { return r; } } as const;',
    covers: [S.objectLiteralMethod],
    expect: 'fail',
    rule: 'no-restricted-syntax',
    tag: 'issues #89/#100/#180',
  },
  {
    id: 'object-literal-method-export-satisfies',
    file: PROBES.logic,
    code: 'export const o = { map(r: string): string { return r; } } satisfies object;',
    covers: [S.objectLiteralMethod],
    expect: 'fail',
    rule: 'no-restricted-syntax',
    tag: 'issues #89/#100/#180',
  },
  {
    id: 'object-literal-method',
    file: PROBES.logic,
    code: 'export default { map(r: string): string { return r; } };',
    covers: [S.objectLiteralMethod],
    expect: 'fail',
    rule: 'no-restricted-syntax',
    tag: 'issues #89/#100/#180',
  },
  {
    id: 'object-literal-method-default-as',
    file: PROBES.logic,
    code: 'export default { map(r: string): string { return r; } } as const;',
    covers: [S.objectLiteralMethod],
    expect: 'fail',
    rule: 'no-restricted-syntax',
    tag: 'issues #89/#100/#180',
  },
  {
    id: 'object-literal-method-default-satisfies',
    file: PROBES.logic,
    code: 'export default { map(r: string): string { return r; } } satisfies object;',
    covers: [S.objectLiteralMethod],
    expect: 'fail',
    rule: 'no-restricted-syntax',
    tag: 'issues #89/#100/#180',
  },
  // raw Intl / toLocale* ban (#155) — one fixture per selector: plain member call, computed
  // member call (a Literal `property` carries `value`, never `name`), and `Intl.*` access.
  {
    id: 'raw-tolocale-call',
    file: PROBES.logic,
    code: 'const s = new Date().toLocaleDateString();',
    covers: [S.intlToLocaleName],
    expect: 'fail',
    rule: 'no-restricted-syntax',
    tag: 'issue #155',
  },
  {
    id: 'raw-tolocale-computed-call',
    file: PROBES.logic,
    code: "const s = new Date()['toLocaleString']();",
    covers: [S.intlToLocaleComputed],
    expect: 'fail',
    rule: 'no-restricted-syntax',
    tag: 'issue #155',
  },
  {
    id: 'raw-intl-member',
    file: PROBES.logic,
    code: 'const f = Intl.NumberFormat;',
    covers: [S.intlMember],
    expect: 'fail',
    rule: 'no-restricted-syntax',
    tag: 'issue #155',
  },
  // ad-hoc authorization ban (#114) — one must-fail fixture per selector in the family, plus
  // one per structural branch of the membership union (method call on the collection, Set
  // wrapping, computed index), which is where a broken alternative would silently un-gate an
  // authorization decision. The exhaustive per-spelling sweep over all fourteen membership
  // forms lives in tests/unit/tooling/access-control-gates.test.ts, which lints real fixture
  // files through the ESLint binary; this table's job is the rot-guard's one-fixture-per-selector
  // contract.
  {
    id: 'adhoc-membership-call',
    file: PROBES.logic,
    code: "const ok = principal.roles.includes('admin');",
    covers: [S.adHocMembership],
    expect: 'fail',
    rule: 'no-restricted-syntax',
    tag: 'issue #114',
  },
  {
    id: 'adhoc-membership-set-wrap',
    file: PROBES.logic,
    code: "const ok = new Set(principal.roles).has('admin');",
    covers: [S.adHocMembership],
    expect: 'fail',
    rule: 'no-restricted-syntax',
    tag: 'issue #114',
  },
  {
    id: 'adhoc-membership-computed-index',
    file: PROBES.logic,
    code: 'const first = principal.roles[0];',
    covers: [S.adHocMembership],
    expect: 'fail',
    rule: 'no-restricted-syntax',
    tag: 'issue #114',
  },
  {
    id: 'raw-permission-usecan',
    file: PROBES.logic,
    code: "const allowed = useCan('crm.contact.read');",
    covers: [S.useCanRawPermission],
    expect: 'fail',
    rule: 'no-restricted-syntax',
    tag: 'issue #114',
  },
  {
    id: 'raw-permission-can-array',
    file: PROBES.logic,
    code: "const allowed = gate.canAll(['crm.contact.read']);",
    covers: [S.canRawPermission],
    expect: 'fail',
    rule: 'no-restricted-syntax',
    tag: 'issue #114',
  },
  {
    id: 'raw-permission-jsx-prop',
    file: PROBES.component,
    code: 'const A = () => <Guard permission="crm.contact.read" />;',
    covers: [S.permissionPropRaw],
    expect: 'fail',
    rule: 'no-restricted-syntax',
    tag: 'issue #114',
  },
  {
    id: 'raw-permission-route-meta',
    file: PROBES.logic,
    code: "const route = { meta: { permission: 'crm.contact.read' } };",
    covers: [S.routeMetaPermissionRaw],
    expect: 'fail',
    rule: 'no-restricted-syntax',
    tag: 'issue #114',
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

/** @param {unknown} entry a resolved rule value @returns {unknown} its severity (index 0 of an array form) */
function severityOf(entry) {
  return Array.isArray(entry) ? entry[0] : entry;
}
/** @param {unknown} entry a resolved `no-restricted-syntax` value @returns {string[]} its selector strings */
function selectorsOf(entry) {
  return Array.isArray(entry)
    ? entry.slice(1).map((e) => (typeof e === 'string' ? e : e.selector))
    : [];
}

/**
 * Resolve the effective `no-restricted-syntax` severity + selectors for a virtual src path.
 * @param {string} file a representative (possibly non-existent) path under a src override scope
 * @returns {Promise<{severity: unknown, selectors: string[]}>}
 */
async function resolveProbe(file) {
  const cfg = await eslint.calculateConfigForFile(file);
  const nrs = cfg.rules?.['no-restricted-syntax'];
  return { severity: severityOf(nrs), selectors: selectorsOf(nrs) };
}

/**
 * Strip type-aware parser settings: calculateConfigForFile returns `parserOptions.project`
 * (type-checked linting), which rejects the virtual fixture paths ("TSConfig does not include
 * this file"). The gates under test are purely syntactic (no-restricted-syntax /
 * no-restricted-imports), so a non-type-aware parse is both sufficient and correct.
 * @param {object} languageOptions resolved languageOptions from calculateConfigForFile
 * @returns {object} the same options with type-aware project settings removed
 */
function sanitizeLanguageOptions(languageOptions) {
  const parserOptions = { ...(languageOptions.parserOptions || {}) };
  delete parserOptions.project;
  delete parserOptions.projectService;
  delete parserOptions.program;
  delete parserOptions.EXPERIMENTAL_useProjectService;
  delete parserOptions.tsconfigRootDir;
  return { ...languageOptions, parserOptions };
}

/**
 * Lint a fixture's code with the RESOLVED languageOptions + rule for its scope.
 * @param {{file: string, code: string, rule: string}} fx a fixture entry
 * @returns {Promise<{ruleId: string|null, message: string, line: number}[]>} the rule's messages
 */
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

// Resolve all probes concurrently (independent calculateConfigForFile calls).
const probeEntries = await Promise.all(
  Object.entries(PROBES).map(async ([key, file]) => [key, await resolveProbe(file)])
);
const probes = Object.fromEntries(probeEntries);

// Universe: every error-severity `no-restricted-syntax` selector in EVERY src-scoped override
// block, derived from the flat config itself — NOT from the handful of representative probe
// paths. A selector added to a new/unprobed `src/**` scope therefore still enters the universe
// (and the rot-guard demands a fixture for it). A block counts as src-scoped when any of its
// `files` globs targets `src/`; the warn-level base block and the tests-scoped overrides are
// excluded by the severity + scope filters. Config selector strings are identical to those
// `calculateConfigForFile` resolves (ESLint never rewrites them).
const SRC_ERROR_SEVERITIES = new Set(['error', 2]);
/** @param {unknown} files a flat-config block's `files` @returns {boolean} true if any glob targets src/ */
function isSrcScoped(files) {
  return Array.isArray(files) && files.some((f) => typeof f === 'string' && f.startsWith('src/'));
}
/**
 * @param {Array<{files?: unknown, rules?: Record<string, unknown>}>} config the flat config array
 * @returns {string[]} sorted union of error-severity no-restricted-syntax selectors in src scopes
 */
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

// Run all fixtures concurrently; each resolves its own config and lints in isolation.
const fixtures = await Promise.all(
  FIXTURES.map(async (fx) => ({
    id: fx.id,
    file: fx.file,
    covers: fx.covers,
    expect: fx.expect,
    rule: fx.rule,
    tag: fx.tag,
    messages: await runFixture(fx),
  }))
);

process.stdout.write(JSON.stringify({ probes, universe, fixtures }));
