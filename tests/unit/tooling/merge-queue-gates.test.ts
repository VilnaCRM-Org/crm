/**
 * @jest-environment node
 */

import fs from 'fs';
import path from 'path';

import { parse } from 'yaml';

const projectRoot = path.resolve(__dirname, '..', '..', '..');
const workflowsDir = path.join(projectRoot, '.github/workflows');

type Step = { name?: string; if?: string; run?: string; env?: Record<string, string> };

type Workflow = {
  on: Record<string, unknown>;
  concurrency?: { group: string; 'cancel-in-progress': string | boolean };
  jobs: Record<string, { steps?: Step[] }>;
};

const MERGE_QUEUE_WORKFLOWS = [
  'bats-testing.yml',
  'dependency-cruiser.yml',
  'eslint-suppressions.yml',
  'static-testing.yml',
  'unit-testing.yml',
];

const PR_ONLY_CANCEL = "${{ github.event_name == 'pull_request' }}";

const readWorkflow = (file: string): Workflow =>
  parse(fs.readFileSync(path.join(workflowsDir, file), 'utf8')) as Workflow;

const workflowFiles = (): string[] =>
  fs
    .readdirSync(workflowsDir)
    .filter((entry) => entry.endsWith('.yml'))
    .sort();

const declaresMergeGroup = (workflow: Workflow): boolean => 'merge_group' in workflow.on;

const pullRequestBranches = (workflow: Workflow): unknown =>
  (workflow.on.pull_request as { branches?: unknown } | undefined)?.branches;

const stepsOf = (workflow: Workflow): Step[] =>
  Object.values(workflow.jobs).flatMap((job) => job.steps ?? []);

const readsPullRequestContext = (step: Step): boolean =>
  /github\.(event\.pull_request|base_ref|head_ref)/.test(
    JSON.stringify([step.run ?? '', step.env ?? {}])
  );

describe('merge-queue gating (issue #185, phase 2)', () => {
  it('routes exactly the fast, deterministic gates through the merge queue', () => {
    const withMergeGroup = workflowFiles().filter((file) => declaresMergeGroup(readWorkflow(file)));

    expect(withMergeGroup).toEqual(MERGE_QUEUE_WORKFLOWS);
  });

  it.each(MERGE_QUEUE_WORKFLOWS)('%s still gates every pull request into main', (file) => {
    expect(pullRequestBranches(readWorkflow(file))).toEqual(['main']);
  });

  it.each(MERGE_QUEUE_WORKFLOWS)('%s never lets a pull-request push cancel a queue run', (file) => {
    const { concurrency } = readWorkflow(file);

    expect(concurrency?.group).toContain('github.event.merge_group.head_ref');
    expect(concurrency?.['cancel-in-progress']).toBe(PR_ONLY_CANCEL);
  });

  it('keeps the sharded mutation matrix and the browser suites out of the queue', () => {
    for (const file of [
      'mutation-testing.yml',
      'e2e-testing.yml',
      'visual-testing.yml',
      'performance-testing.yml',
      'load-testing.yml',
      'memory-leak-testing.yml',
    ]) {
      expect(declaresMergeGroup(readWorkflow(file))).toBe(false);
    }
  });

  it('skips the pull-request-only steps of static-testing on a queue run, and nothing else', () => {
    const steps = stepsOf(readWorkflow('static-testing.yml'));
    const prContextSteps = steps.filter(readsPullRequestContext);
    const adrDrift = steps.find((step) => step.run === 'make check-adr-drift');

    expect(prContextSteps.length).toBeGreaterThan(0);
    for (const step of [...prContextSteps, adrDrift]) {
      expect(step?.if).toBe("github.event_name == 'pull_request'");
    }
    for (const run of ['make start', 'make lint', 'make codegen-check']) {
      expect(steps.find((step) => step.run === run)?.if).toBeUndefined();
    }
  });
});
