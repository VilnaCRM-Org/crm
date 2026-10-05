// @jest-environment @stryker-mutator/jest-runner/jest-env/node

import fs from 'fs';
import path from 'path';

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const srcRoot = path.join(repoRoot, 'src');
const authRoot = 'src/modules/user/features/auth';

// Files that render nothing a catalogue reader could look at: the app entry and shell, the
// provider and router wiring, a redirect-only guard, and two helpers. Everything else that
// renders UI ships a story. An entry here must name a file that exists and has no story.
const EXEMPT: Readonly<Record<string, string>> = {
  'src/index.tsx': 'browser entrypoint: boots i18n, observability and the router',
  'src/app.tsx': 'application root: mounts the providers and the router',
  'src/providers/app-providers.tsx': 'context providers only; every story already has a theme',
  'src/providers/mui-theme/mui-theme-shell.tsx': 'theme provider shell for the lazy chunks',
  'src/routes/routes.tsx': 'router construction; the pages it routes to have stories',
  'src/routes/route-composer.tsx': 'route tree builder; renders no UI of its own',
  'src/routes/route-mapper.tsx': 'maps route contracts to lazy elements; renders no UI',
  'src/components/render-with-theme.tsx': 'helper function, not a component',
  'src/components/ui-form/form-provider-bridge.tsx':
    'react-hook-form context pass-through, shown through the UIForm stories',
  [`${authRoot}/components/protected-route/index.tsx`]:
    'redirect-only guard; renders its outlet or a Navigate, nothing of its own',
  [`${authRoot}/components/auth-skeleton/index.tsx`]:
    're-export of src/components/skeletons/auth-skeleton, which has its own story',
};

const toPosix = (filePath: string): string =>
  path.relative(repoRoot, filePath).split(path.sep).join('/');

const walk = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [toPosix(fullPath)];
  });

const sourceFiles = walk(srcRoot);
const storyFiles = sourceFiles.filter((file) => file.endsWith('.stories.tsx'));
const componentFiles = sourceFiles.filter(
  (file) =>
    file.endsWith('.tsx') &&
    !file.endsWith('.stories.tsx') &&
    !file.endsWith('.test.tsx') &&
    !file.includes('/types/')
);

const aliasTargets: ReadonlyArray<[RegExp, string]> = [
  [/^@auth(?=\/|$)/, authRoot],
  [/^@(?=\/)/, 'src'],
];

const resolveSpecifier = (storyFile: string, specifier: string): string | null => {
  if (specifier.startsWith('.')) {
    return path.posix.join(path.posix.dirname(storyFile), specifier);
  }
  const alias = aliasTargets.find(([pattern]) => pattern.test(specifier));
  return alias ? specifier.replace(alias[0], alias[1]) : null;
};

const importedComponents = (storyFile: string): string[] => {
  const text = fs.readFileSync(path.join(repoRoot, storyFile), 'utf-8');
  const specifiers = [...text.matchAll(/^import\s(?!type\s)[^;]*?from\s'([^']+)';/gms)].map(
    (match) => match[1] ?? ''
  );
  return specifiers
    .map((specifier) => resolveSpecifier(storyFile, specifier))
    .filter((target): target is string => target !== null)
    .flatMap((target) => [`${target}.tsx`, `${target}/index.tsx`])
    .filter((candidate) => componentFiles.includes(candidate));
};

const covered = new Set(storyFiles.flatMap(importedComponents));

const storyTitle = (storyFile: string): string | undefined =>
  /^\s*title:\s*'([^']+)'/m.exec(fs.readFileSync(path.join(repoRoot, storyFile), 'utf-8'))?.[1];

describe('every rendered component ships a Storybook story', () => {
  it('finds the component and story inventories', () => {
    expect(componentFiles.length).toBeGreaterThan(40);
    expect(storyFiles.length).toBeGreaterThan(40);
  });

  it('has a story for each component that is not exempt', () => {
    const missing = componentFiles.filter((file) => !covered.has(file) && !(file in EXEMPT));

    expect(missing).toEqual([]);
  });

  it('exempts only files that exist', () => {
    const stale = Object.keys(EXEMPT).filter((file) => !componentFiles.includes(file));

    expect(stale).toEqual([]);
  });

  it('never exempts a component that already has a story', () => {
    const redundant = Object.keys(EXEMPT).filter((file) => covered.has(file));

    expect(redundant).toEqual([]);
  });

  it('gives every exemption a reason', () => {
    const blank = Object.entries(EXEMPT).filter(([, reason]) => reason.trim().length < 20);

    expect(blank).toEqual([]);
  });

  it('gives every story file a unique sidebar title', () => {
    const titles = storyFiles.map(storyTitle);

    expect(titles).not.toContain(undefined);
    expect(new Set(titles).size).toBe(titles.length);
  });
});
