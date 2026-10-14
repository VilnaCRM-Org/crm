import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.join(__dirname, '..', '..', '..');
const DOMAIN_FOLDER = /^src\/modules\/[^/]+\/types\/user\//;
const DOMAIN_TYPE_DECLARATION = new RegExp(
  [
    String.raw`^[ \t]*(?:export[ \t]+(?:default[ \t]+)?)?(?:declare[ \t]+)?`,
    String.raw`(?:interface|type)[ \t]+(\w*(?:Dto|Entity))\b`,
  ].join(''),
  'gm'
);

interface SourceFile {
  readonly file: string;
  readonly source: string;
}

const walk = (relativeDir: string): string[] =>
  fs.readdirSync(path.join(ROOT, relativeDir), { withFileTypes: true }).flatMap((entry) => {
    const child = `${relativeDir}/${entry.name}`;
    return entry.isDirectory() ? walk(child) : [child];
  });

const misplacedDomainTypes = (files: SourceFile[]): string[] =>
  files
    .filter(({ file }) => !DOMAIN_FOLDER.test(file))
    .flatMap(({ file, source }) =>
      [...source.matchAll(DOMAIN_TYPE_DECLARATION)].map((match) => `${file}: ${match[1]}`)
    );

const sourceFiles: SourceFile[] = walk('src')
  .filter((file) => /\.tsx?$/.test(file))
  .map((file) => ({ file, source: fs.readFileSync(path.join(ROOT, file), 'utf8') }));

describe('TB-2 domain type names', () => {
  it('declares every *Dto and *Entity type only in a module types/user folder', () => {
    expect(misplacedDomainTypes(sourceFiles)).toEqual([]);
  });

  it('finds the board types in src/modules/user/types/user', () => {
    const declared = sourceFiles
      .filter(({ file }) => DOMAIN_FOLDER.test(file))
      .flatMap(({ source }) => [...source.matchAll(DOMAIN_TYPE_DECLARATION)].map((m) => m[1]))
      .sort();

    expect(declared).toEqual([
      'CreateNewPasswordDto',
      'RestorePasswordDto',
      'SignInDto',
      'SignUpDto',
      'UserEntity',
    ]);
  });

  it.each([
    ['an exported *Dto interface', 'export interface OrderDto {\n  readonly id: string;\n}\n'],
    ['a local *Dto interface', 'interface OrderDto {\n  readonly id: string;\n}\n'],
    ['an *Entity alias', 'export type OrderEntity = OrderRecord;\n'],
    [
      'a default-exported *Dto interface',
      'export default interface OrderDto {\n  readonly id: string;\n}\n',
    ],
    ['a default-exported *Entity interface', 'export default interface OrderEntity {}\n'],
  ])('fails on %s outside the domain folder', (_name, source) => {
    const file = 'src/modules/user/features/auth/types/order.ts';

    expect(misplacedDomainTypes([{ file, source }])).toHaveLength(1);
  });

  it('passes the same declaration inside a module types/user folder', () => {
    const file = 'src/modules/billing/types/user/order-dto.ts';
    const source = 'export interface OrderDto {\n  readonly id: string;\n}\n';

    expect(misplacedDomainTypes([{ file, source }])).toEqual([]);
  });

  it('ignores names that only contain the suffix', () => {
    const file = 'src/modules/user/features/auth/types/order.ts';
    const source = 'export interface DtoMapper {\n  readonly id: string;\n}\n';

    expect(misplacedDomainTypes([{ file, source }])).toEqual([]);
  });
});
