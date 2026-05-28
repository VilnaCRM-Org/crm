/**
 * @jest-environment node
 */

import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const scriptPath = path.join(repoRoot, 'scripts', 'ci', 'run-parallel-lint.sh');

const writeFakeMake = (dirPath: string, failingTarget?: string): string => {
  const fakeMakePath = path.join(dirPath, 'fake-make.sh');
  const script = `#!/usr/bin/env bash
set -eu
target="$1"
case "$target" in
  lint-eslint)
    sleep 0.15
    printf 'eslint line 1\\neslint line 2\\n'
    ;;
  lint-tsc)
    sleep 0.05
    printf 'tsc line 1\\n'
    ;;
  lint-md)
    sleep 0.10
    printf 'md line 1\\nmd line 2\\n'
    ;;
  lint-metrics)
    sleep 0.01
    printf 'metrics line 1\\n'
    ;;
  *)
    printf 'unexpected target: %s\\n' "$target" >&2
    exit 9
    ;;
esac

if [ "$target" = "${failingTarget ?? ''}" ]; then
  printf 'failing %s\\n' "$target" >&2
  exit 2
fi
`;
  fs.writeFileSync(fakeMakePath, script, { mode: 0o755 });
  return fakeMakePath;
};

describe('make ci-lint contract', () => {
  it('delegates to the grouped parallel lint runner', () => {
    const output = execFileSync('make', ['-n', 'ci-lint'], {
      cwd: repoRoot,
      encoding: 'utf8',
    });

    expect(output).toContain(
      './scripts/ci/run-parallel-lint.sh lint-eslint lint-tsc lint-md lint-metrics'
    );
  });

  it('groups parallel lint output by target name', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ci-lint-pass-'));
    const fakeMakePath = writeFakeMake(tempDir);

    const output = execFileSync(
      'bash',
      [scriptPath, 'lint-eslint', 'lint-tsc', 'lint-md', 'lint-metrics'],
      {
        cwd: repoRoot,
        encoding: 'utf8',
        env: { ...process.env, MAKE_BIN: fakeMakePath },
      }
    );

    expect(output).toContain('===== lint-eslint =====');
    expect(output).toContain('eslint line 1\neslint line 2');
    expect(output).toContain('===== lint-tsc =====');
    expect(output).toContain('tsc line 1');
    expect(output).toContain('===== lint-md =====');
    expect(output).toContain('md line 1\nmd line 2');
    expect(output).toContain('===== lint-metrics =====');
    expect(output).toContain('metrics line 1');

    const eslintIndex = output.indexOf('===== lint-eslint =====');
    const tscIndex = output.indexOf('===== lint-tsc =====');
    const mdIndex = output.indexOf('===== lint-md =====');
    const metricsIndex = output.indexOf('===== lint-metrics =====');
    expect(eslintIndex).toBeLessThan(tscIndex);
    expect(tscIndex).toBeLessThan(mdIndex);
    expect(mdIndex).toBeLessThan(metricsIndex);
  });

  it('fails ci-lint when any grouped lint target fails', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ci-lint-fail-'));
    const fakeMakePath = writeFakeMake(tempDir, 'lint-md');

    try {
      execFileSync('bash', [scriptPath, 'lint-eslint', 'lint-tsc', 'lint-md'], {
        cwd: repoRoot,
        encoding: 'utf8',
        env: { ...process.env, MAKE_BIN: fakeMakePath },
      });
      throw new Error('expected the grouped lint runner to fail');
    } catch (error) {
      const executionError = error as NodeJS.ErrnoException & {
        status?: number;
        stdout?: string;
      };

      expect(executionError.status).toBe(1);
      expect(executionError.stdout).toContain('===== lint-md =====');
      expect(executionError.stdout).toContain('md line 1\nmd line 2');
      expect(executionError.stdout).toContain('ci-lint: lint-md failed with exit code 2');
    }
  });
});
