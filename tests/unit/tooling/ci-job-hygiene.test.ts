/**
 * @jest-environment @stryker-mutator/jest-runner/jest-env/node
 */

import fs from 'fs';
import path from 'path';

import YAML from 'yaml';

const repoRoot = path.resolve(__dirname, '..', '..', '..');

const readRepoFile = (relativePath: string): string =>
  fs.readFileSync(path.join(repoRoot, relativePath), 'utf-8');

interface WorkflowJob {
  'timeout-minutes'?: number;
  uses?: string;
  steps?: { uses?: string; with?: Record<string, unknown> }[];
}

interface Workflow {
  jobs?: Record<string, WorkflowJob>;
}

const workflows = (): [string, Workflow][] =>
  fs
    .readdirSync(path.join(repoRoot, '.github/workflows'))
    .filter((entry) => entry.endsWith('.yml') || entry.endsWith('.yaml'))
    .sort()
    .map((entry) => [entry, YAML.parse(readRepoFile(path.join('.github/workflows', entry)))]);

const jobsOf = (): { file: string; id: string; job: WorkflowJob }[] =>
  workflows().flatMap(([file, workflow]) =>
    Object.entries(workflow.jobs ?? {}).map(([id, job]) => ({ file, id, job }))
  );

const walk = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });

describe('CI job hygiene (issue #144)', () => {
  it('parses the known workflow count, so the guard cannot pass on an empty directory', () => {
    expect(workflows().length).toBeGreaterThanOrEqual(38);
  });

  it('bounds every job with timeout-minutes so a hung job cannot burn the 6-hour default', () => {
    const unbounded = jobsOf()
      .filter(
        ({ job }) => typeof job['timeout-minutes'] !== 'number' || job['timeout-minutes'] <= 0
      )
      .map(({ file, id }) => `${file}#${id}`);

    expect(unbounded).toEqual([]);
  });

  it('keeps every timeout under two hours, so a bound is not a rename of the default', () => {
    const generous = jobsOf()
      .filter(({ job }) => (job['timeout-minutes'] ?? 0) > 120)
      .map(({ file, id }) => `${file}#${id}`);

    expect(generous).toEqual([]);
  });

  it('pins the runner Node through .nvmrc on every setup-node step, never a literal', () => {
    const setupNodeSteps = jobsOf().flatMap(({ file, id, job }) =>
      (job.steps ?? [])
        .filter((step) => step.uses?.startsWith('actions/setup-node@'))
        .map((step) => ({ where: `${file}#${id}`, with: step.with ?? {} }))
    );

    expect(setupNodeSteps.length).toBeGreaterThan(0);
    for (const step of setupNodeSteps) {
      expect(step.with).not.toHaveProperty('node-version');
      expect(step.with).toHaveProperty('node-version-file', '.nvmrc');
    }
  });

  it('keeps .nvmrc, the Dockerfile base image, and engines.node on one Node version', () => {
    const nvmrc = readRepoFile('.nvmrc').trim();
    const dockerfileNode = readRepoFile('Dockerfile').match(/node:(\d+\.\d+\.\d+)-alpine/);
    const { engines } = JSON.parse(readRepoFile('package.json')) as { engines: { node: string } };

    expect(nvmrc).toMatch(/^\d+\.\d+\.\d+$/);
    expect(dockerfileNode?.[1]).toBe(nvmrc);
    expect(engines.node).toBe(`>=${nvmrc}`);
  });

  it('commits a codecov.yml whose statuses are binding rather than informational', () => {
    const codecov = YAML.parse(readRepoFile('codecov.yml')) as {
      codecov: { require_ci_to_pass: boolean };
      coverage: { status: Record<string, Record<string, { informational: boolean }>> };
    };

    expect(codecov.codecov.require_ci_to_pass).toBe(true);
    for (const statuses of Object.values(codecov.coverage.status)) {
      for (const status of Object.values(statuses)) {
        expect(status.informational).toBe(false);
      }
    }
  });

  it('leaves no fixed waitForTimeout sleep in the Playwright specs or their helpers', () => {
    const offenders = ['tests/e2e', 'tests/visual']
      .flatMap((dir) => walk(path.join(repoRoot, dir)))
      .filter((file) => file.endsWith('.ts'))
      .filter((file) => readRepoFile(path.relative(repoRoot, file)).includes('waitForTimeout('))
      .map((file) => path.relative(repoRoot, file));

    expect(offenders).toEqual([]);
  });
});
