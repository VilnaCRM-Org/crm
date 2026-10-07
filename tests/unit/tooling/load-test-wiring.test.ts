// @jest-environment @stryker-mutator/jest-runner/jest-env/node

import fs from 'fs';
import path from 'path';

const projectRoot = path.resolve(__dirname, '..', '..', '..');

const readFile = (relativePath: string): string =>
  fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');

describe('load test wiring', () => {
  it('parameterizes the dind k6 runner instead of hardcoding homepage assets', () => {
    const makefile = readFile('Makefile');
    const dindTarget = makefile.match(/run-load-tests-dind:.*?\n((?:\t.*\n)+)/m)?.[1];

    expect(dindTarget).toBeDefined();
    expect(dindTarget).toContain('export=$(K6_RESULTS_FILE)');
    expect(dindTarget).toContain('$(K6_TEST_SCRIPT)');
    expect(dindTarget).not.toContain('/loadTests/results/homepage.html');
    expect(dindTarget).not.toContain('/loadTests/homepage.js');
  });

  it('runs homepage and signup suites in the batch dind script with a signup-only mode', () => {
    const batchScript = readFile('scripts/ci/batch_pw_load.sh');

    expect(batchScript).toContain('run_load_tests_dind "." "homepage"');
    expect(batchScript).toContain('run_load_tests_dind "." "signup"');
    expect(batchScript).toContain('test-load-signup)');
  });

  it('runs the error-pages suite in the batch script, the PR matrix and the CI load phase', () => {
    const batchScript = readFile('scripts/ci/batch_pw_load.sh');
    const workflow = readFile('.github/workflows/load-testing.yml');
    const makefile = readFile('Makefile');
    const ciTestLoad = makefile.match(/^ci-test-load:.*?\n((?:\t.*\n)+)/m)?.[1];

    expect(batchScript).toContain('run_load_tests_dind "$crm_dir" "error-pages"');
    expect(batchScript).toContain('run_load_tests_dind "." "error-pages"');
    expect(batchScript).toContain('test-load-error-pages)');
    expect(workflow).toContain('make_cmd: test-load-error-pages');
    expect(makefile).toContain('K6_ERROR_PAGES_SCRIPT       ?= /loadTests/error-pages.js');
    expect(ciTestLoad).toContain('$(LOAD_TESTS_RUN_ERROR_PAGES)');
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
