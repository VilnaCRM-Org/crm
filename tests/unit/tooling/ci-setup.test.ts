/**
 * @jest-environment node
 */

import { execFileSync } from 'child_process';
import path from 'path';

const repoRoot = path.resolve(__dirname, '..', '..', '..');

describe('make ci-setup startup contract', () => {
  it('reuses the running dev and mockoon services outside CI', () => {
    const output = execFileSync('make', ['-n', 'ci-setup'], {
      cwd: repoRoot,
      encoding: 'utf8',
    });

    expect(output).toContain(
      'docker network ls | grep -wq crm-network || docker network create crm-network'
    );
    expect(output).toContain(
      'docker compose -f docker-compose.yml up -d --no-recreate dev mockoon'
    );
    expect(output).toContain('make wait-for-dev');
    expect(output).toContain('make wait-for-mockoon');
  });

  it('rebuilds dev and mockoon when CI=1', () => {
    const output = execFileSync('make', ['-n', 'ci-setup'], {
      cwd: repoRoot,
      encoding: 'utf8',
      env: { ...process.env, CI: '1' },
    });

    expect(output).toContain('docker compose -f docker-compose.yml up -d --build dev mockoon');
    expect(output).toContain('make wait-for-dev');
    expect(output).toContain('make wait-for-mockoon');
  });
});
