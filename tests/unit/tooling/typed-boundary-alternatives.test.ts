// @jest-environment @stryker-mutator/jest-runner/jest-env/node

interface TypedBoundaryPolicy {
  TB_FUNCTION_HOLDERS: string[];
  TB_CODE_POSITIONS: string[];
  TB_TYPE_FILE_ROOTS: string[];
}

interface PositionCase {
  position: string;
  code: string;
}

const policy = require('../../../config/typed-boundary-policy.js') as TypedBoundaryPolicy;

const { Linter } = require('eslint') as typeof import('eslint');
const tsParser = require('@typescript-eslint/parser') as unknown;

const LITERAL = '{ x: string }';

const reportsFor = (code: string, selector: string): number =>
  new Linter({ configType: 'flat' })
    .verify(code, {
      languageOptions: { parser: tsParser as never, ecmaVersion: 'latest', sourceType: 'module' },
      rules: { 'no-restricted-syntax': ['error', selector] },
    })
    .filter((message) => message.ruleId === 'no-restricted-syntax').length;

const HOLDER_SNIPPETS: ReadonlyArray<(params: string, annotation: string) => string> = [
  (params, annotation): string => `class C { public m(${params})${annotation} {} }`,
  (params, annotation): string => `export function f(${params})${annotation} {}`,
  (params, annotation): string => `export default function f(${params})${annotation} {}`,
  (params, annotation): string => `export default (${params})${annotation} => null;`,
  (params, annotation): string => `export const f = (${params})${annotation} => null;`,
  (params, annotation): string => `function f(${params})${annotation} {}`,
  (params, annotation): string => `const f = (${params})${annotation} => null;`,
  (params, annotation): string => `class C { public f = (${params})${annotation} => null; }`,
];

const SLOT_SNIPPETS: Readonly<Record<string, readonly [string, string]>> = {
  ' > TSTypeAnnotation': ['', `: ${LITERAL}`],
  ' > Identifier > TSTypeAnnotation': [`a: ${LITERAL}`, ''],
  ' > ObjectPattern > TSTypeAnnotation': [`{ x }: ${LITERAL}`, ''],
  ' > ArrayPattern > TSTypeAnnotation': [`[a]: ${LITERAL}`, ''],
  ' > AssignmentPattern > Identifier > TSTypeAnnotation': [`a: ${LITERAL} = { x: "" }`, ''],
  ' > AssignmentPattern > ObjectPattern > TSTypeAnnotation': [`{ x }: ${LITERAL} = { x: "" }`, ''],
  ' > AssignmentPattern > ArrayPattern > TSTypeAnnotation': [`[a]: ${LITERAL} = []`, ''],
  ' > RestElement > TSTypeAnnotation': [`...a: ${LITERAL}`, ''],
};

const holderCase = (position: string): PositionCase | null => {
  const index = policy.TB_FUNCTION_HOLDERS.findIndex((holder) =>
    Object.keys(SLOT_SNIPPETS).some((slot) => position === `${holder}${slot}`)
  );
  const holder = policy.TB_FUNCTION_HOLDERS[index];
  const snippet = HOLDER_SNIPPETS[index];
  const slot = holder === undefined ? undefined : SLOT_SNIPPETS[position.slice(holder.length)];

  return snippet && slot ? { position, code: snippet(slot[0], slot[1]) } : null;
};

const classMemberCase = (position: string): PositionCase | null => {
  if (position.includes('TSParameterProperty > AssignmentPattern')) {
    return { position, code: `class C { constructor(public a: ${LITERAL} = { x: "" }) {} }` };
  }

  if (position.includes('TSParameterProperty')) {
    return { position, code: `class C { constructor(public a: ${LITERAL}) {} }` };
  }

  return position.startsWith('PropertyDefinition') && position.endsWith('> TSTypeAnnotation')
    ? { position, code: `class C { public p: ${LITERAL} = { x: "" }; }` }
    : null;
};

const codeCases = policy.TB_CODE_POSITIONS.map(
  (position) => holderCase(position) ?? classMemberCase(position) ?? { position, code: '' }
);

const TYPE_FILE_SNIPPETS: Readonly<Record<string, string>> = {
  'Program > ExportNamedDeclaration': `export interface T { m: ${LITERAL} }`,
  'Program > ExportDefaultDeclaration': `export default interface T { m: ${LITERAL} }`,
  'Program > TSInterfaceDeclaration': `interface T { m: ${LITERAL} }`,
  'Program > TSTypeAliasDeclaration': `type T = Item | ${LITERAL};\nexport type { T };`,
};

describe('TB-1 selector alternatives (issue #332)', () => {
  it('has a snippet for every code position the policy generates', () => {
    expect(codeCases.filter((testCase) => testCase.code === '').map((c) => c.position)).toEqual([]);
    expect(codeCases).toHaveLength(
      policy.TB_FUNCTION_HOLDERS.length * Object.keys(SLOT_SNIPPETS).length + 3
    );
  });

  it.each(codeCases)('fires for an anonymous object at $position', ({ position, code }) => {
    expect(reportsFor(code, `${position} TSTypeLiteral`)).toBe(1);
  });

  it('has a snippet for every type-file root the policy generates', () => {
    expect(Object.keys(TYPE_FILE_SNIPPETS)).toEqual(policy.TB_TYPE_FILE_ROOTS);
  });

  it.each(policy.TB_TYPE_FILE_ROOTS)('fires for a nested literal under %s', (root) => {
    expect(reportsFor(TYPE_FILE_SNIPPETS[root] ?? '', `${root} TSTypeLiteral`)).toBe(1);
  });

  it('never reaches into a module augmentation from any type-file root', () => {
    const augmentation = [
      `declare module "x" { interface T { m: ${LITERAL} }`,
      `type U = ${LITERAL}; }`,
    ].join('\n');

    expect(
      policy.TB_TYPE_FILE_ROOTS.map((root) => reportsFor(augmentation, `${root} TSTypeLiteral`))
    ).toEqual(policy.TB_TYPE_FILE_ROOTS.map(() => 0));
  });
});
