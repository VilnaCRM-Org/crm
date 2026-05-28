/**
 * @jest-environment node
 */

import { execFileSync } from 'child_process';
import path from 'path';

const repoRoot = path.resolve(__dirname, '..', '..', '..');

describe('make start startup contract', () => {
  it('starts dev and mockoon and waits for both readiness checks', () => {
    const output = execFileSync('make', ['-n', 'start'], {
      cwd: repoRoot,
      encoding: 'utf8',
    });

    expect(output).toContain('docker compose -f docker-compose.yml up -d --build dev mockoon');
    expect(output).toContain('make wait-for-dev');
    expect(output).toContain('make wait-for-mockoon');
  });
});
