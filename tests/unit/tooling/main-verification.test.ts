// @jest-environment @stryker-mutator/jest-runner/jest-env/node

import fs from 'fs';
import path from 'path';

const projectRoot = path.resolve(__dirname, '..', '..', '..');

const readFile = (relativePath: string): string =>
  fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');

describe('post-merge main verification (issue #185)', () => {
  const workflow = readFile('.github/workflows/main-verification.yml');

  it('verifies every push to main', () => {
    expect(workflow).toContain("on:\n  push:\n    branches: ['main']");
  });

  it('verifies merges in order instead of cancelling superseded runs', () => {
    expect(workflow).toContain('group: main-verification');
    expect(workflow).toContain('cancel-in-progress: false');
  });

  it('re-runs the deterministic PR gates against the merged tree', () => {
    expect(workflow).toContain('run: make lint\n');
    expect(workflow).toContain('run: make codegen-check\n');
    expect(workflow).toContain('run: make test-unit-all\n');
  });

  it('routes a red main to a single pinned issue', () => {
    expect(workflow).toContain("contains(needs.*.result, 'failure')");
    expect(workflow).toContain('needs: [lint, unit]');
    expect(workflow).toContain('issues: write');
    expect(workflow).toContain('sh scripts/ci/report-main-verification-failure.sh');
  });

  it('still reports when a verification job fails rather than skipping', () => {
    expect(workflow).toContain('if: ${{ always() &&');
  });
});
