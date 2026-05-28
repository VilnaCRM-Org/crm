/**
 * @jest-environment node
 */

import { execFileSync } from 'child_process';
import path from 'path';

const repoRoot = path.resolve(__dirname, '..', '..', '..');

describe('make lighthouse-setup contract', () => {
  it('runs ensure-chromium before start-prod to prepare Lighthouse prerequisites once', () => {
    const output = execFileSync('make', ['-n', 'lighthouse-setup'], {
      cwd: repoRoot,
      encoding: 'utf8',
    });

    expect(output).toContain('make ensure-chromium');
    expect(output).toContain('make start-prod');

    const ensureChromiumIndex = output.indexOf('make ensure-chromium');
    const startProdIndex = output.indexOf('make start-prod');

    expect(ensureChromiumIndex).toBeLessThan(startProdIndex);
  });
});
