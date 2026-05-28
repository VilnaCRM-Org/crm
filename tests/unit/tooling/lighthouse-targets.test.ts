/**
 * @jest-environment node
 */

import { execFileSync } from 'child_process';
import path from 'path';

const repoRoot = path.resolve(__dirname, '..', '..', '..');

describe('make Lighthouse audit target contracts', () => {
  it('routes the desktop audit through lighthouse-setup without inlining setup in the LHCI command', () => {
    const output = execFileSync('make', ['-n', 'lighthouse-desktop'], {
      cwd: repoRoot,
      encoding: 'utf8',
    });

    expect(output).toContain('make ensure-chromium');
    expect(output).toContain('make start-prod');
    expect(output).toContain(
      'docker compose exec -T dev bun x lhci autorun --config=./lighthouse/lighthouserc.desktop.js'
    );
    expect(output).not.toContain('make ensure-chromium && make start-prod &&');
  });

  it('routes the mobile audit through lighthouse-setup without inlining setup in the LHCI command', () => {
    const output = execFileSync('make', ['-n', 'lighthouse-mobile'], {
      cwd: repoRoot,
      encoding: 'utf8',
    });

    expect(output).toContain('make ensure-chromium');
    expect(output).toContain('make start-prod');
    expect(output).toContain(
      'docker compose exec -T dev bun x lhci autorun --config=./lighthouse/lighthouserc.mobile.js'
    );
    expect(output).not.toContain('make ensure-chromium && make start-prod &&');
  });
});
