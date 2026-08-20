// @jest-environment @stryker-mutator/jest-runner/jest-env/node

import fs from 'fs';
import path from 'path';

const projectRoot = path.resolve(__dirname, '..', '..', '..');

const ENTRY = 'src/index.tsx';

// Packages the render path must never reach through a *static* import. Each is loaded behind a
// dynamic import() on purpose: tsyringe and reflect-metadata by the DI composition root, the
// Apollo/zod graph by the auth store's deferred actions, and the Sentry/web-vitals SDKs by the
// DSN-gated observability boundary. A static edge to any of them pulls the module into the eager
// chunk, and tsyringe's @injectable() then evaluates before reflect-metadata is imported, which
// throws at boot and leaves a blank page (issues #109, #115, #117).
const FORBIDDEN = [
  'tsyringe',
  'reflect-metadata',
  '@apollo/client',
  'zod',
  '@sentry/react',
  'web-vitals',
];

const ALIASES: ReadonlyArray<readonly [string, string]> = [
  ['@auth/', 'src/modules/user/features/auth/'],
  ['@/', 'src/'],
];

const CANDIDATE_SUFFIXES = ['', '.ts', '.tsx', '/index.ts', '/index.tsx'];

// Matches `import … from '…'`, `export … from '…'`, and bare `import '…'`, but not `import type`
// (erased at compile time) and not dynamic `import('…')` (the deferral mechanism itself).
const FROM_SPECIFIER =
  /(?:^|\n)\s*(?:import|export)(?![\s(]*type\b)[^;'"\n]*?from\s*['"]([^'"]+)['"]/g;

const BARE_IMPORT = /(?:^|\n)\s*import\s+['"]([^'"]+)['"]/g;

function packageOf(specifier: string): string {
  return specifier.startsWith('@')
    ? specifier.split('/').slice(0, 2).join('/')
    : (specifier.split('/')[0] as string);
}

function aliasedPath(specifier: string, importer: string): string | null {
  if (specifier.startsWith('.')) return path.join(path.dirname(importer), specifier);
  const alias = ALIASES.find(([prefix]) => specifier.startsWith(prefix));
  return alias ? alias[1] + specifier.slice(alias[0].length) : null;
}

function resolveFile(relative: string): string | null {
  const found = CANDIDATE_SUFFIXES.map((suffix) => path.normalize(relative) + suffix).find(
    (candidate) =>
      fs.existsSync(path.join(projectRoot, candidate)) &&
      fs.statSync(path.join(projectRoot, candidate)).isFile()
  );
  return found ?? null;
}

function specifiersOf(file: string): string[] {
  const source = fs.readFileSync(path.join(projectRoot, file), 'utf8');
  return [...source.matchAll(FROM_SPECIFIER), ...source.matchAll(BARE_IMPORT)]
    .map((match) => match[1])
    .filter((specifier): specifier is string => Boolean(specifier));
}

function walkStaticGraph(entry: string): { files: Set<string>; packages: Map<string, string[]> } {
  const files = new Set<string>();
  const packages = new Map<string, string[]>();
  const queue = [entry];

  while (queue.length > 0) {
    const file = queue.shift() as string;
    if (files.has(file)) continue;
    files.add(file);

    for (const specifier of specifiersOf(file)) {
      const relative = aliasedPath(specifier, file);
      const resolved = relative === null ? null : resolveFile(relative);
      if (resolved !== null) {
        queue.push(resolved);
      } else if (relative === null) {
        const name = packageOf(specifier);
        packages.set(name, [...(packages.get(name) ?? []), file]);
      }
    }
  }

  return { files, packages };
}

describe('render-path import graph', () => {
  const graph = walkStaticGraph(ENTRY);

  it('reaches the app shell it is supposed to reach', () => {
    expect(graph.files.has(ENTRY)).toBe(true);
    expect(graph.files.has('src/components/error-boundary/app-error-boundary.tsx')).toBe(true);
    expect(graph.files.has('src/services/observability/observability-core.ts')).toBe(true);
    expect(graph.files.size).toBeGreaterThan(10);
  });

  it.each(FORBIDDEN)('never statically imports %s', (packageName) => {
    expect(graph.packages.get(packageName) ?? []).toEqual([]);
  });
});
