/**
 * @jest-environment node
 */

import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const scriptPath = path.join(repoRoot, 'scripts', 'ci', 'run-parallel-tests.sh');

const writeFakeMake = (dirPath: string, failingTarget?: string): string => {
  const fakeMakePath = path.join(dirPath, 'fake-make.sh');
  const script = `#!/usr/bin/env bash
set -eu
target="$1"
case "$target" in
  ci-test-unit-client)
    sleep 0.10
    printf 'client test line 1\\nclient test line 2\\n'
    ;;
  ci-test-unit-server)
    sleep 0.01
    printf 'server test line 1\\n'
    ;;
  *)
    printf 'unexpected target: %s\\n' "$target" >&2
    exit 9
    ;;
esac

if [ "$target" = "${failingTarget ?? ''}" ]; then
  printf 'failing %s\\n' "$target" >&2
  exit 3
fi
`;
  fs.writeFileSync(fakeMakePath, script, { mode: 0o755 });
  return fakeMakePath;
};

describe('make ci-test contract', () => {
  it('delegates to the grouped parallel test runner with the dev-side test set', () => {
    const output = execFileSync('make', ['-n', 'ci-test'], {
      cwd: repoRoot,
      encoding: 'utf8',
    });

    expect(output).toContain(
      './scripts/ci/run-parallel-tests.sh ci-test-unit-client ci-test-unit-server ci-test-integration'
    );
    expect(output).not.toContain('ci-test-mutation');
  });

  it('runs client unit tests without re-running make start', () => {
    const output = execFileSync('make', ['-n', 'ci-test-unit-client'], {
      cwd: repoRoot,
      encoding: 'utf8',
    });

    expect(output).toContain(
      'docker compose exec -T dev env TEST_ENV=client node ./node_modules/jest/bin/jest.js --maxWorkers=2 --logHeapUsage'
    );
    expect(output).not.toContain('make start &&');
  });

  it('runs server unit tests without re-running make start', () => {
    const output = execFileSync('make', ['-n', 'ci-test-unit-server'], {
      cwd: repoRoot,
      encoding: 'utf8',
    });

    expect(output).toContain(
      'docker compose exec -T dev env TEST_ENV=server node ./node_modules/jest/bin/jest.js --maxWorkers=2 --logHeapUsage ./tests/apollo-server'
    );
    expect(output).not.toContain('make start &&');
  });

  it('groups parallel test output by target name', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ci-test-pass-'));
    const fakeMakePath = writeFakeMake(tempDir);

    const output = execFileSync(
      'bash',
      [scriptPath, 'ci-test-unit-client', 'ci-test-unit-server'],
      {
        cwd: repoRoot,
        encoding: 'utf8',
        env: { ...process.env, MAKE_BIN: fakeMakePath },
      }
    );

    expect(output).toContain('===== ci-test-unit-client =====');
    expect(output).toContain('client test line 1\nclient test line 2');
    expect(output).toContain('===== ci-test-unit-server =====');
    expect(output).toContain('server test line 1');

    const clientIndex = output.indexOf('===== ci-test-unit-client =====');
    const serverIndex = output.indexOf('===== ci-test-unit-server =====');
    expect(clientIndex).toBeLessThan(serverIndex);
  });

  it('fails ci-test when any grouped test target fails', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ci-test-fail-'));
    const fakeMakePath = writeFakeMake(tempDir, 'ci-test-unit-server');

    try {
      execFileSync('bash', [scriptPath, 'ci-test-unit-client', 'ci-test-unit-server'], {
        cwd: repoRoot,
        encoding: 'utf8',
        env: { ...process.env, MAKE_BIN: fakeMakePath },
      });
      throw new Error('expected the grouped test runner to fail');
    } catch (error) {
      const executionError = error as NodeJS.ErrnoException & {
        status?: number;
        stdout?: string;
      };

      expect(executionError.status).toBe(1);
      expect(executionError.stdout).toContain('===== ci-test-unit-server =====');
      expect(executionError.stdout).toContain('server test line 1');
      expect(executionError.stdout).toContain(
        'ci-test: ci-test-unit-server failed with exit code 3'
      );
    }
  });
});
