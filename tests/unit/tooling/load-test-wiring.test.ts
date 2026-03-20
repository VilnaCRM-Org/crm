// @jest-environment node

import fs from 'fs';
import path from 'path';

const projectRoot = path.resolve(__dirname, '..', '..', '..');

const readFile = (relativePath: string): string =>
  fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');

describe('load test wiring', () => {
  it('parameterizes the dind k6 runner instead of hardcoding homepage assets', () => {
    const makefile = readFile('Makefile');
    const dindTarget = makefile.match(
      /run-load-tests-dind:.*?\n((?:\t.*\n)+)/m
    )?.[1];

    expect(dindTarget).toBeDefined();
    expect(dindTarget).toContain('export=$(K6_RESULTS_FILE)');
    expect(dindTarget).toContain('$(K6_TEST_SCRIPT)');
    expect(dindTarget).not.toContain('/loadTests/results/homepage.html');
    expect(dindTarget).not.toContain('/loadTests/homepage.js');
  });

  it('runs both homepage and signup suites in the batch dind script and exposes a signup-only mode', () => {
    const batchScript = readFile('scripts/ci/batch_pw_load.sh');

    expect(batchScript).toContain('run_load_tests_dind "." "homepage"');
    expect(batchScript).toContain('run_load_tests_dind "." "signup"');
    expect(batchScript).toContain('test-load-signup)');
  });

  it('uses maxVUs consistently across the signup load config and scenario builder', () => {
    const config = readFile('tests/load/config.json.dist');
    const scenariosBuilder = readFile('tests/load/utils/scenarios-builder.js');

    expect(config).not.toContain('maxVus');
    expect(config).toContain('"maxVUs"');
    expect(scenariosBuilder).not.toContain('maxVus');
    expect(scenariosBuilder).toContain('maxVUs');
  });
});
