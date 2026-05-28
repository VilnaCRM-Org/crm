/**
 * @jest-environment node
 */

import { execFileSync } from 'child_process';
import path from 'path';

const repoRoot = path.resolve(__dirname, '..', '..', '..');

describe('make ci orchestration contract', () => {
  it('runs setup, lint, dev tests, prod setup, then prod tests in order', () => {
    const output = execFileSync('make', ['-n', 'ci'], {
      cwd: repoRoot,
      encoding: 'utf8',
    });

    const phases = [
      'make ci-setup',
      'make ci-lint',
      'make ci-test',
      'make ci-mutation',
      'make ci-prod-setup',
      'make ci-test-prod',
    ];

    for (const phase of phases) {
      expect(output).toContain(phase);
    }

    const indices = phases.map((phase) => output.indexOf(phase));
    for (let i = 1; i < indices.length; i += 1) {
      expect(indices[i - 1]).toBeLessThan(indices[i]);
    }
  });

  it('runs the mutation phase in isolation, not in the parallel dev-side test set', () => {
    const output = execFileSync('make', ['-n', 'ci-mutation'], {
      cwd: repoRoot,
      encoding: 'utf8',
    });

    expect(output).toContain('make ci-test-mutation');
  });
});
