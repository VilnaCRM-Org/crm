/**
 * @jest-environment @stryker-mutator/jest-runner/jest-env/node
 */

import { execFileSync } from 'child_process';
import path from 'path';

const repoRoot = path.resolve(__dirname, '..', '..', '..');

describe('make help discoverability contract', () => {
  it('describes the updated public workflow targets at a user-facing level', () => {
    const output = execFileSync('make', ['help'], {
      cwd: repoRoot,
      encoding: 'utf8',
    });

    expect(output).toContain('start');
    expect(output).toContain('Start the frontend dev server and Mockoon API mock');

    expect(output).toContain('ci');
    expect(output).toContain('Run the full local CI flow');

    expect(output).toContain('lighthouse-setup');
    expect(output).toContain(
      'Prepare shared Chromium and prod prerequisites for Lighthouse audits'
    );
  });
});
