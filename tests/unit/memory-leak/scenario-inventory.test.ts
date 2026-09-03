import path from 'path';

import ScenarioFinder from '../../memory-leak/utils/scenario-finder';

const projectRoot = path.resolve(__dirname, '..', '..', '..');
const testsDir = path.join(projectRoot, 'tests', 'memory-leak', 'tests');

const EXPECTED_SCENARIO_FILES = ['auth-skeleton.js', 'signup.js'];

describe('memory leak scenario inventory (issue #183)', () => {
  it('discovers exactly the committed scenario files', () => {
    const discovered = new ScenarioFinder()
      .find(testsDir)
      .map((filePath: string) => path.relative(testsDir, filePath))
      .sort();

    expect(discovered).toEqual(EXPECTED_SCENARIO_FILES);
  });
});
