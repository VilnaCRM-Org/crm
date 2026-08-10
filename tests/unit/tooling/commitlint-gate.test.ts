// @jest-environment @stryker-mutator/jest-runner/jest-env/node

import fs from 'fs';
import path from 'path';

const projectRoot = path.resolve(__dirname, '..', '..', '..');

const readFile = (relativePath: string): string =>
  fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');

describe('commitlint CI gate (issue #184)', () => {
  const workflow = readFile('.github/workflows/commitlint.yml');
  const makefile = readFile('Makefile');

  it('re-runs when the pull request title is edited', () => {
    expect(workflow).toContain('types: [opened, edited, synchronize, reopened]');
    expect(workflow).toContain("branches: ['main']");
  });

  it('lints the pull request title as the real squash-merge header', () => {
    expect(workflow).toContain(
      `run: printf '%s (#%s)\\n' "$PR_TITLE" "$PR_NUMBER" | make lint-commit-title`
    );
    expect(workflow).toContain('PR_TITLE: ${{ github.event.pull_request.title }}');
    expect(workflow).toContain('PR_NUMBER: ${{ github.event.pull_request.number }}');
  });

  it('lints the pull request commit range against the merge base', () => {
    expect(workflow).toContain('git merge-base origin/main "$HEAD_SHA"');
    expect(workflow).toContain('make lint-commit-range COMMIT_RANGE_FROM=');
  });

  it('keeps the job reporting on Dependabot pull requests instead of skipping it', () => {
    expect(workflow).toContain("if: github.event.pull_request.user.login != 'dependabot[bot]'");
    expect(workflow).toContain("if: github.event.pull_request.user.login == 'dependabot[bot]'");
    expect(workflow).not.toMatch(/^ {4}if:/m);
  });

  it('runs the title check against the strict config and each commit against the CI config', () => {
    expect(makefile).toContain('lint-commit-title:');
    expect(makefile).toContain('$(COMMITLINT_CMD) --config $(COMMITLINT_CONFIG)');
    expect(makefile).toContain('lint-commit-message:');
    expect(makefile).toContain('$(COMMITLINT_CMD) --config $(COMMITLINT_CI_CONFIG)');
  });

  it('reads the commit range where git exists instead of inside the dev container', () => {
    expect(makefile).toContain('sh scripts/ci/lint-commit-range.sh');
    expect(makefile).not.toContain(
      'commitlint --verbose --config $(COMMITLINT_CI_CONFIG) \\\n\t\t--from'
    );

    const rangeScript = readFile('scripts/ci/lint-commit-range.sh');

    expect(rangeScript).toContain('git rev-list "$from..$to"');
    expect(rangeScript).toContain('lint-commit-message');
    expect(rangeScript).toContain('contains no commits');
  });

  it('exempts only bot-authored commits, and only in the CI config', () => {
    const ciConfig = readFile('commitlint.ci.config.js');

    expect(ciConfig).toContain("require('./commitlint.config')");
    expect(ciConfig).toContain('Signed-off-by: dependabot\\[bot\\]');
    expect(ciConfig).toContain('Compressed Images');
    expect(readFile('commitlint.config.js')).not.toContain('ignores');
  });
});
