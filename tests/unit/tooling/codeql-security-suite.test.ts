import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(__dirname, '..', '..', '..');
const workflow = readFileSync(join(ROOT, '.github/workflows/security-testing.yml'), 'utf8');
const governance = readFileSync(join(ROOT, 'docs/governance/branch-protection.md'), 'utf8');

describe('CodeQL security-extended enforcement (issue #172)', () => {
  it('runs the security-extended query suite, not the shallow default', () => {
    expect(workflow).toContain('queries: security-extended');
  });

  it('keeps the query suite on the init input, where the action reads it', () => {
    const initStep = workflow.slice(workflow.indexOf('codeql-action/init'));
    const configBlock = initStep.slice(initStep.indexOf('config: |'));
    expect(initStep.indexOf('queries: security-extended')).toBeLessThan(
      initStep.indexOf('config: |')
    );
    expect(configBlock).not.toContain('queries:');
  });

  it('excludes the test tree so the extended suite stays high-signal', () => {
    expect(workflow).toContain('paths-ignore:');
    expect(workflow).toContain('- tests');
  });

  it('analyzes push to main so pull-request alert diffing has a baseline', () => {
    const triggers = workflow.slice(workflow.indexOf('on:'), workflow.indexOf('permissions:'));
    expect(triggers).toContain('pull_request:');
    expect(triggers).toContain('push:');
    expect(triggers).toContain("cron: '0 6 * * 1'");
  });

  it('never cancels the baseline or scheduled analysis in progress', () => {
    expect(workflow).toContain("cancel-in-progress: ${{ github.event_name == 'pull_request' }}");
    expect(workflow).toContain('${{ github.workflow }}-${{ github.event_name }}-');
  });

  it('bounds the analysis so a hung run cannot occupy a runner indefinitely', () => {
    expect(workflow).toContain('timeout-minutes:');
  });

  it('pins every CodeQL action by commit SHA', () => {
    const codeqlUses = workflow.match(/uses: github\/codeql-action\/[a-z]+@[^\n]+/g) ?? [];
    expect(codeqlUses).toHaveLength(3);
    codeqlUses.forEach((line) => expect(line).toMatch(/@[0-9a-f]{40} #/));
  });

  it('records the out-of-repo merge rule so the settings change is auditable', () => {
    expect(governance).toContain('Require code scanning results');
    expect(governance).toContain('High or higher');
    expect(governance).toContain('Errors');
    expect(governance).toContain('Ruleset ID');
  });
});
