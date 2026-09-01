/**
 * @jest-environment node
 */

import fs from 'fs';
import path from 'path';

import { parse } from 'yaml';

const projectRoot = path.resolve(__dirname, '..', '..', '..');

const readFile = (relativePath: string): string =>
  fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');

type Step = { name?: string; if?: string; run?: string; env?: Record<string, string> };

type Workflow = {
  on: { pull_request?: { branches?: string[]; types?: string[] } };
  jobs: Record<string, { name?: string; if?: string; steps?: Step[] }>;
};

const workflow = parse(readFile('.github/workflows/commitlint.yml')) as Workflow;
const jobNamed = (name: string): Workflow['jobs'][string] => {
  const found = workflow.jobs[name];
  if (found === undefined) throw new Error(`commitlint.yml declares no "${name}" job`);
  return found;
};
const job = jobNamed('commitlint');
const steps = job.steps ?? [];
const stepFor = (fragment: string): Step | undefined =>
  steps.find((step) => (step.run ?? '').includes(fragment));

describe('commitlint CI gate (issue #184)', () => {
  it('re-runs when the pull request title is edited', () => {
    expect(workflow.on.pull_request?.branches).toEqual(['main']);
    expect(workflow.on.pull_request?.types).toEqual(
      expect.arrayContaining(['opened', 'edited', 'synchronize', 'reopened'])
    );
  });

  it('lints the pull request title as the real squash-merge commit header', () => {
    const titleStep = stepFor('make lint-commit-message');

    expect(titleStep?.run).toContain(`printf '%s (#%s)\\n' "$PR_TITLE" "$PR_NUMBER"`);
    expect(titleStep?.env?.PR_TITLE).toBe('${{ github.event.pull_request.title }}');
    expect(titleStep?.env?.PR_NUMBER).toBe('${{ github.event.pull_request.number }}');
  });

  it('never interpolates the untrusted title into the shell command', () => {
    for (const step of steps) {
      expect(step.run ?? '').not.toContain('${{ github.event.pull_request.title }}');
    }
  });

  it('lints the pull request commit range against the merge base', () => {
    const rangeStep = stepFor('make lint-commit-range');

    expect(rangeStep?.run).toContain('git merge-base origin/main "$HEAD_SHA"');
    expect(rangeStep?.if).toBeUndefined();
  });

  it('keeps reporting on bot pull requests instead of skipping the job', () => {
    const humanTitle = stepFor('make lint-commit-message');
    const botTitle = stepFor('make lint-commit-bot-message');

    expect(humanTitle?.if).toBe("${{ !endsWith(github.event.pull_request.user.login, '[bot]') }}");
    expect(botTitle?.if).toBe("${{ endsWith(github.event.pull_request.user.login, '[bot]') }}");
    expect(job.if).toBeUndefined();
  });

  it('runs every header through commitlint with the config its author earns', () => {
    const makefile = readFile('Makefile');

    expect(makefile).toContain('$(COMMITLINT_CMD) --config $(COMMITLINT_CONFIG)');
    expect(makefile).toContain('$(COMMITLINT_CMD) --config $(COMMITLINT_BOT_CONFIG)');
    expect(makefile).toContain('COMMITLINT_CONFIG           = commitlint.config.js');
    expect(makefile).toContain('COMMITLINT_BOT_CONFIG       = commitlint.bot.config.js');
  });

  it('decides the bot exemption from GitHub-verified provenance, never commit metadata', () => {
    const rangeScript = readFile('scripts/ci/lint-commit-range.sh');
    const workflow = readFile('.github/workflows/commitlint.yml');

    expect(rangeScript).toContain('.commit.verification.verified == true');
    expect(rangeScript).toContain('.author.login');
    expect(rangeScript).toContain("*'[bot]')");
    // A verified signature attests the committer, not the author, and GitHub resolves the author
    // from a contributor-controlled email. Without the committer binding a contributor holding a
    // verified key could author a commit as a bot and still be vouched for, so the exemption has
    // to require an identity only GitHub writes -- `web-flow`, or the app account itself.
    expect(rangeScript).toContain('.committer.login');
    expect(rangeScript).toContain("web-flow | *'[bot]')");
    // The author email is contributor-controlled, so it must not reach the decision at all:
    // reading it back would re-open the forged-`[bot]`-noreply bypass this gate closed.
    expect(rangeScript).not.toContain('--format=%ae');
    expect(rangeScript).not.toContain('users.noreply.github.com');
    // No token means nothing to verify against, so the exemption has to fail closed.
    expect(rangeScript).toContain('GH_TOKEN');
    expect(rangeScript).toContain('COMMIT_PROVENANCE_REPO');
    expect(workflow).toContain('GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}');
    expect(workflow).toContain('COMMIT_PROVENANCE_REPO: ${{ github.repository }}');
    expect(rangeScript).toContain('contains no commits');
  });

  it('relaxes only the task-number rule for bots and leaves the human contract intact', () => {
    const botConfig = readFile('commitlint.bot.config.js');

    expect(botConfig).toContain("require('./commitlint.config')");
    expect(botConfig).toContain("'check-task-number-rule': [0, 'always']");
    expect(readFile('commitlint.config.js')).not.toContain('ignores');
  });
});
