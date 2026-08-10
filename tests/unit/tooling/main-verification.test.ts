/**
 * @jest-environment node
 */

import fs from 'fs';
import path from 'path';

import { parse } from 'yaml';

const projectRoot = path.resolve(__dirname, '..', '..', '..');

type Job = {
  name?: string;
  needs?: string[];
  if?: string;
  'continue-on-error'?: boolean;
  permissions?: Record<string, string>;
  steps?: Array<{ run?: string }>;
};

type Workflow = {
  on: { push?: { branches?: string[]; 'paths-ignore'?: string[]; paths?: string[] } };
  concurrency: { group: string; 'cancel-in-progress': boolean };
  jobs: Record<string, Job>;
};

const workflow = parse(
  fs.readFileSync(path.join(projectRoot, '.github/workflows/main-verification.yml'), 'utf8')
) as Workflow;

const runCommands = (job: Job): string[] => (job.steps ?? []).flatMap((step) => step.run ?? []);

describe('post-merge main verification (issue #185)', () => {
  it('triggers on every push to main, unfiltered', () => {
    expect(workflow.on.push?.branches).toEqual(['main']);
    expect(workflow.on.push?.['paths-ignore']).toBeUndefined();
    expect(workflow.on.push?.paths).toBeUndefined();
  });

  it('verifies merges in order instead of cancelling superseded runs', () => {
    expect(workflow.concurrency.group).toBe('main-verification');
    expect(workflow.concurrency['cancel-in-progress']).toBe(false);
  });

  it('re-runs the deterministic PR gates against the merged tree', () => {
    expect(runCommands(workflow.jobs.lint)).toEqual(
      expect.arrayContaining(['make start', 'make lint', 'make codegen-check'])
    );
    expect(runCommands(workflow.jobs.unit)).toEqual(
      expect.arrayContaining(['make start', 'make test-unit-all'])
    );
  });

  it('lets no verification job swallow its own failure', () => {
    for (const jobName of ['lint', 'unit'] as const) {
      expect(workflow.jobs[jobName]['continue-on-error']).toBeUndefined();
      expect(workflow.jobs[jobName].if).toBeUndefined();
    }
  });

  it('routes a red main to a single pinned issue', () => {
    const report = workflow.jobs.report;

    expect(report.needs).toEqual(expect.arrayContaining(['lint', 'unit']));
    expect(report.if).toContain('always()');
    expect(report.if).toContain("contains(needs.*.result, 'failure')");
    expect(report.permissions?.issues).toBe('write');
    expect(runCommands(report)).toContain('sh scripts/ci/report-main-verification-failure.sh');
  });

  it('clears the tracking issue once main recovers', () => {
    const resolve = workflow.jobs.resolve;

    expect(resolve.needs).toEqual(expect.arrayContaining(['lint', 'unit']));
    expect(resolve.if).toContain("needs.lint.result == 'success'");
    expect(resolve.if).toContain("needs.unit.result == 'success'");
    expect(resolve.permissions?.issues).toBe('write');
    expect(runCommands(resolve)).toContain(
      'sh scripts/ci/report-main-verification-failure.sh --resolve'
    );
  });
});
