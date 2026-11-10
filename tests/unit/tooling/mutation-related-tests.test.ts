import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { pathToFileURL } from 'url';

const projectRoot = path.resolve(__dirname, '..', '..', '..');
const moduleUrl = pathToFileURL(path.join(projectRoot, 'scripts/ci/mutation-related-tests.mjs'));

/**
 * Run a body against the real module in a plain Node ESM process rooted at `cwd`, the way the shard
 * config and the merge load it: the module resolves every path against the working directory.
 */
const runRelated = <T>(cwd: string, body: string): T => {
  const script =
    `import * as related from '${moduleUrl.href}';` +
    `const result = await (async () => { ${body} })();` +
    'process.stdout.write(JSON.stringify(result));';
  const raw = execFileSync(process.execPath, ['--input-type=module', '--eval', script], {
    cwd,
    encoding: 'utf8',
  });
  return JSON.parse(raw) as T;
};

const relatedOf = (cwd: string, file: string): string[] =>
  runRelated<string[]>(
    cwd,
    `return [...related.relatedTestFiles(related.buildImporterIndex(), '${file}')].sort();`
  );

describe('related tests a mutant run loads', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'related-tests-'));
  const write = (file: string, content: string): void => {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    fs.writeFileSync(path.join(root, file), content);
  };

  write(
    'tsconfig.paths.json',
    JSON.stringify({ compilerOptions: { paths: { '@/*': ['src/*'], '@tests/*': ['tests/*'] } } })
  );
  write('src/area/target.ts', 'export const target = 1;\n');
  write('src/area/sibling.ts', "import { target } from './target';\nexport const s = target;\n");
  write('src/area/nested/deep.ts', "import { s } from '../sibling';\nexport const d = s;\n");
  write(
    'src/other/outside.ts',
    "import { target } from '@/area/target';\nexport const o = target;\n"
  );
  write('tests/unit/helpers/render.ts', "export { target } from '@/area/target';\n");
  write('tests/utils/outside-root.ts', "export { target } from '@/area/target';\n");
  write(
    'tests/unit/direct.test.ts',
    "import { target } from '@/area/target';\nit('t', () => {});\n"
  );
  write('tests/unit/via-sibling.test.ts', "import '@/area/sibling';\n");
  write('tests/unit/via-nested.test.ts', "import '../../src/area/nested/deep';\n");
  write('tests/unit/via-outside.test.ts', "import '@/other/outside';\n");
  write('tests/unit/via-helper.test.ts', "import '@tests/unit/helpers/render';\n");
  write('tests/unit/via-out-of-root.test.ts', "import '@tests/utils/outside-root';\n");
  write('tests/unit/type-only.test.ts', "import type { target } from '@/area/target';\n");
  write('tests/unit/mocked.test.ts', "jest.mock('@/area/target');\n");
  write('tests/unit/actual.test.ts', "jest.requireActual('@/area/target');\n");
  write('tests/unit/dynamic.test.ts', "it('t', async () => { await import('@/area/target'); });\n");
  write('tests/unit/required.test.ts', "require('../../src/area/target.js');\n");
  write(
    'tests/unit/commented.test.ts',
    "// import '@/area/target';\n/* import '@/area/target'; */\n"
  );
  write('tests/unit/tooling/ignored.test.ts', "import '@/area/target';\n");
  write('tests/integration/chain.integration.test.ts', "import '@/area/sibling';\n");
  write('tests/integration/not-matched.test.ts', "import '@/area/target';\n");

  const reached = relatedOf(root, 'src/area/target.ts');

  afterAll(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  it('reaches tests through direct imports, same-directory files and test-root helpers', () => {
    expect(reached).toEqual(
      expect.arrayContaining([
        'tests/unit/direct.test.ts',
        'tests/unit/via-sibling.test.ts',
        'tests/unit/via-nested.test.ts',
        'tests/unit/via-helper.test.ts',
        'tests/integration/chain.integration.test.ts',
      ])
    );
  });

  it('follows require, dynamic import and jest.requireActual, as Jest does', () => {
    expect(reached).toEqual(
      expect.arrayContaining([
        'tests/unit/actual.test.ts',
        'tests/unit/dynamic.test.ts',
        'tests/unit/required.test.ts',
      ])
    );
  });

  it('stops at a file outside the test roots and the mutated file directory', () => {
    expect(reached).not.toContain('tests/unit/via-outside.test.ts');
    expect(reached).not.toContain('tests/unit/via-out-of-root.test.ts');
  });

  it('ignores type-only imports, jest.mock and commented-out imports', () => {
    expect(reached).not.toContain('tests/unit/type-only.test.ts');
    expect(reached).not.toContain('tests/unit/mocked.test.ts');
    expect(reached).not.toContain('tests/unit/commented.test.ts');
  });

  it('counts only the files the mutation config runs as tests', () => {
    expect(reached).not.toContain('tests/unit/tooling/ignored.test.ts');
    expect(reached).not.toContain('tests/integration/not-matched.test.ts');
    expect(reached).not.toContain('tests/unit/helpers/render.ts');
    expect(reached).toHaveLength(8);
  });

  it('counts the same files relatedTestCounts reports for each target', () => {
    expect(
      runRelated<Array<[string, number]>>(
        root,
        "return [...related.relatedTestCounts(['src/area/target.ts', 'src/other/outside.ts'])];"
      )
    ).toEqual([
      ['src/area/target.ts', 8],
      ['src/other/outside.ts', 1],
    ]);
  });
});

describe('parity with the related-test search Jest runs for Stryker', () => {
  const jestBin = path.join(projectRoot, 'node_modules/jest/bin/jest.js');
  const listedByJest = (args: string[]): string[] =>
    execFileSync(
      process.execPath,
      [jestBin, '-c', 'jest.mutation.config.ts', '--listTests', ...args],
      {
        cwd: projectRoot,
        encoding: 'utf8',
      }
    )
      .split('\n')
      .filter((line) => line.startsWith(projectRoot))
      .map((line) => path.relative(projectRoot, line))
      .sort();

  it('selects exactly the test files the mutation config runs', () => {
    const ours = runRelated<string[]>(
      projectRoot,
      "const fs = await import('node:fs');" +
        "const path = await import('node:path');" +
        'const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {' +
        '  const full = path.posix.join(dir, entry.name);' +
        '  return entry.isDirectory() ? walk(full) : [full];' +
        '});' +
        'return related.TEST_ROOTS.flatMap(walk).filter(related.isMutationTestFile).sort();'
    );

    expect(ours.length).toBeGreaterThan(100);
    expect(ours).toEqual(listedByJest([]));
  });

  it.each([
    'src/services/observability/pii-scrubber.ts',
    'src/components/ui-form/use-submit-block.ts',
    'src/components/ui-footer/styles.ts',
  ])('finds the related tests Jest finds for %s under the shard roots', (file) => {
    const jest = listedByJest([
      '--roots',
      'tests/unit',
      'tests/integration',
      path.dirname(file),
      '--findRelatedTests',
      path.join(projectRoot, file),
    ]);
    expect(relatedOf(projectRoot, file)).toEqual(jest);
  });
});
