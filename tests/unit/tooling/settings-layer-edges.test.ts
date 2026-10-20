// @jest-environment @stryker-mutator/jest-runner/jest-env/node

import fs from 'fs';
import path from 'path';

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const settingsRoot = 'src/modules/user/features/settings';
const GUARDED_FOLDERS = ['components', 'hooks', 'routes'] as const;

interface SourceFile {
  readonly file: string;
  readonly source: string;
}

interface ImportEdge {
  readonly typeOnly: boolean;
  readonly target: string;
}

const IMPORT_PATTERN = /^import\s+(type\s+)?[^;]*?from\s+'([^']+)';/gms;

const toPosix = (filePath: string): string =>
  path.relative(repoRoot, filePath).split(path.sep).join('/');

const walk = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [toPosix(full)];
  });

const resolveTarget = (file: string, specifier: string): string => {
  if (specifier.startsWith('.')) return path.posix.join(path.posix.dirname(file), specifier);
  return specifier.replace(/^@\//, 'src/');
};

const edgesOf = ({ file, source }: SourceFile): ImportEdge[] =>
  [...source.matchAll(IMPORT_PATTERN)].map((match) => ({
    typeOnly: match[1] !== undefined,
    target: resolveTarget(file, match[2] ?? ''),
  }));

const folderOf = (file: string): string | null =>
  GUARDED_FOLDERS.find((folder) => file.startsWith(`${settingsRoot}/${folder}/`)) ?? null;

const names = (target: string, folder: string): boolean =>
  target === `${settingsRoot}/${folder}` || target.startsWith(`${settingsRoot}/${folder}/`);

const violationsOf = (files: SourceFile[]): string[] =>
  files.flatMap((sourceFile) => {
    const folder = folderOf(sourceFile.file);
    if (folder === null) return [];
    return edgesOf(sourceFile).flatMap(({ typeOnly, target }) => {
      const found: string[] = [];
      if (names(target, 'repositories')) found.push('imports a Repository');
      if (names(target, 'transformers') || target.startsWith('src/modules/user/transformers')) {
        found.push('imports a Transformer');
      }
      if (names(target, 'data-providers') && (folder === 'components' || !typeOnly)) {
        found.push('imports a Data provider beyond a hook type');
      }
      return found.map((reason) => `${sourceFile.file}: ${reason} (${target})`);
    });
  });

const realFiles = (): SourceFile[] =>
  GUARDED_FOLDERS.flatMap((folder) => walk(path.join(repoRoot, settingsRoot, folder)))
    .filter((file) => /\.(ts|tsx)$/.test(file) && !/\.(test|stories)\.tsx?$/.test(file))
    .map((file) => ({ file, source: fs.readFileSync(path.join(repoRoot, file), 'utf-8') }));

const fixture = (file: string, source: string): SourceFile => ({
  file: `${settingsRoot}/${file}`,
  source,
});

describe('settings layer edges (AR-8)', () => {
  it('finds the guarded files', () => {
    expect(realFiles().length).toBeGreaterThan(0);
  });

  it('keeps every component, hook and route off Repositories and Transformers', () => {
    expect(violationsOf(realFiles())).toEqual([]);
  });

  it('lets a hook import the Data provider by type', () => {
    const hook = fixture(
      'hooks/use-thing.ts',
      "import type ProfileProvider from '../data-providers/profile-provider';\n"
    );

    expect(violationsOf([hook])).toEqual([]);
  });

  it.each([
    [
      'a component type-importing the Transformer',
      fixture(
        'components/thing/index.tsx',
        "import type GraphQLProfileTransformer from '../../transformers';\n"
      ),
    ],
    [
      'a hook importing the Repository',
      fixture('hooks/use-thing.ts', "import GraphQLProfileRepository from '../repositories';\n"),
    ],
    [
      'a hook importing the module error Transformer',
      fixture(
        'hooks/use-thing.ts',
        "import UserServiceErrorTransformer from '@/modules/user/transformers';\n"
      ),
    ],
    [
      'a component type-importing the Data provider',
      fixture(
        'components/thing/index.tsx',
        "import type ProfileProvider from '../../data-providers/profile-provider';\n"
      ),
    ],
    [
      'a hook value-importing the Data provider',
      fixture(
        'hooks/use-thing.ts',
        "import ProfileProvider from '../data-providers/profile-provider';\n"
      ),
    ],
    [
      'a route importing a Repository through the alias',
      fixture(
        'routes/user-profile/index.tsx',
        "import Repository from '@/modules/user/features/settings/repositories';\n"
      ),
    ],
  ])('fails for %s', (_name, sourceFile) => {
    expect(violationsOf([sourceFile])).not.toEqual([]);
  });
});
