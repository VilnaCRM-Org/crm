/**
 * @jest-environment @stryker-mutator/jest-runner/jest-env/node
 */

import { execFileSync } from 'child_process';
import path from 'path';
import { pathToFileURL } from 'url';

const projectRoot = path.resolve(__dirname, '..', '..', '..');

const relatedModule = pathToFileURL(
  path.join(projectRoot, 'scripts/ci/mutation-related-tests.mjs')
);

const LOADER = 'src/lib/locale-catalog/lazy-catalog-loader.ts';

const OWN_SUITE = 'tests/unit/lib/locale-catalog/lazy-catalog-loader.test.ts';

const relatedTestsOf = (file: string): string[] => {
  const script =
    `import * as related from '${relatedModule.href}';` +
    `const tests = related.relatedTestFiles(related.buildImporterIndex(), '${file}');` +
    'process.stdout.write(JSON.stringify([...tests].sort()));';
  const raw = execFileSync(process.execPath, ['--input-type=module', '--eval', script], {
    cwd: projectRoot,
    encoding: 'utf8',
  });
  return JSON.parse(raw) as string[];
};

describe('lazy catalog loader test fan-out', () => {
  it('reaches its own suite and no other test file through any helper', () => {
    expect(relatedTestsOf(LOADER)).toEqual([OWN_SUITE]);
  });
});
