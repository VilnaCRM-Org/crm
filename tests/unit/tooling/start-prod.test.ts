/**
 * @jest-environment node
 */

import { execFileSync } from 'child_process';
import path from 'path';

const repoRoot = path.resolve(__dirname, '..', '..', '..');

describe('make start-prod startup contract', () => {
  it('composes the shared mockoon stack and starts the required production test services', () => {
    const output = execFileSync('make', ['-n', 'start-prod'], {
      cwd: repoRoot,
      encoding: 'utf8',
    });

    expect(output).toContain(
      'docker compose -f docker-compose.yml -f docker-compose.test.yml -f common-healthchecks.yml up -d --no-recreate prod mockoon playwright'
    );
    expect(output).toContain('make wait-for-prod-health');
  });
});
