import { spawnSync } from 'child_process';
import path from 'path';

import baseConfig from '../../../jest.config';

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const JEST_BIN = path.join(repoRoot, 'node_modules', 'jest', 'bin', 'jest.js');
const FIXTURE_DIR = '<rootDir>/tests/fixtures/console-gate';
const ANSI_PATTERN = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g');

const stripAnsi = (value: string): string => value.replace(ANSI_PATTERN, '');

interface FixtureRunResult {
  status: 'passed' | 'failed';
  message: string;
}

const runFixtureSuite = (): Map<string, FixtureRunResult> => {
  const childConfig = {
    ...baseConfig,
    rootDir: repoRoot,
    roots: [FIXTURE_DIR],
    testMatch: [`${FIXTURE_DIR}/**/*.fixture.{ts,tsx}`],
    collectCoverage: false,
    coverageThreshold: undefined,
  };

  const result = spawnSync(
    process.execPath,
    [JEST_BIN, '--config', JSON.stringify(childConfig), '--ci', '--json'],
    {
      cwd: repoRoot,
      encoding: 'utf-8',
      env: { ...process.env, TEST_ENV: 'client', CI: 'true' },
      maxBuffer: 32 * 1024 * 1024,
    }
  );

  const jsonStart = result.stdout.indexOf('{');
  if (jsonStart < 0) {
    throw new Error(`fixture jest run produced no JSON report:\n${result.stderr}`);
  }

  const report = JSON.parse(result.stdout.slice(jsonStart)) as {
    testResults: { name: string; status: string; message: string }[];
  };

  return new Map(
    report.testResults.map((suite) => [
      path.basename(suite.name),
      { status: suite.status as FixtureRunResult['status'], message: stripAnsi(suite.message) },
    ])
  );
};

describe('console gate seeded defects', () => {
  let fixtures: Map<string, FixtureRunResult>;

  beforeAll(() => {
    fixtures = runFixtureSuite();
  }, 300_000);

  const fixtureResult = (name: string): FixtureRunResult => {
    const result = fixtures.get(name);
    if (!result) {
      throw new Error(`fixture ${name} was not discovered by the child jest run`);
    }
    return result;
  };

  it('discovers every fixture', () => {
    expect([...fixtures.keys()].sort()).toEqual([
      'allowlisted-message.fixture.ts',
      'emits-console-error.fixture.ts',
      'emits-console-warn.fixture.ts',
      'spied-console-error.fixture.ts',
      'unrestored-spy.fixture.ts',
      'warns-during-cleanup.fixture.tsx',
    ]);
  });

  it('fails a test that emits an unexpected console.error', () => {
    const result = fixtureResult('emits-console-error.fixture.ts');

    expect(result.status).toBe('failed');
    expect(result.message).toContain('Expected test not to call console.error()');
    expect(result.message).toContain('seeded console-gate defect: unexpected error output');
  });

  it('fails a test that emits an unexpected console.warn', () => {
    const result = fixtureResult('emits-console-warn.fixture.ts');

    expect(result.status).toBe('failed');
    expect(result.message).toContain('Expected test not to call console.warn()');
    expect(result.message).toContain('seeded console-gate defect: unexpected warn output');
  });

  it('fails a test whose output is emitted during testing-library cleanup', () => {
    const result = fixtureResult('warns-during-cleanup.fixture.tsx');

    expect(result.status).toBe('failed');
    expect(result.message).toContain('Expected test not to call console.warn()');
    expect(result.message).toContain('warn emitted during testing-library cleanup');
  });

  it('passes a test that spies on and asserts the expected output', () => {
    expect(fixtureResult('spied-console-error.fixture.ts').status).toBe('passed');
  });

  it('re-arms after a test leaves its console spy unrestored', () => {
    const result = fixtureResult('unrestored-spy.fixture.ts');

    expect(result.status).toBe('failed');
    expect(result.message).toContain('is still gated in the next test of the same file');
    expect(result.message).toContain('emitted after an unrestored spy');
    expect(result.message).not.toContain('installs a console.error spy and never restores it');
  });

  it('passes allowlisted messages and ungated levels', () => {
    expect(fixtureResult('allowlisted-message.fixture.ts').status).toBe('passed');
  });
});
