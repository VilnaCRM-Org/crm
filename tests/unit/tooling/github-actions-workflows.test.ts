/**
 * @jest-environment node
 */

import fs from 'fs';
import path from 'path';

import YAML from 'yaml';

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const workflowsDir = path.join(repoRoot, '.github', 'workflows');

const readWorkflow = (
  name: string
): {
  source: string;
  jobs: Record<string, { steps?: Array<{ run?: string }> }>;
} => {
  const source = fs.readFileSync(path.join(workflowsDir, name), 'utf8');
  const parsed = YAML.parse(source) as {
    jobs?: Record<string, { steps?: Array<{ run?: string }> }>;
  };
  return { source, jobs: parsed.jobs ?? {} };
};

describe('GitHub Actions granular workflow contract', () => {
  it('does not bundle every check into a single make ci workflow', () => {
    expect(fs.existsSync(path.join(workflowsDir, 'ci.yml'))).toBe(false);
  });

  it('runs linters through the dedicated static workflow', () => {
    const { jobs } = readWorkflow('static-testing.yml');

    expect(Object.keys(jobs)).toEqual(['static']);
    const runs = (jobs.static.steps ?? []).map((step) => step.run);
    expect(runs).toContain('make lint');
  });

  it('runs unit tests through the dedicated unit workflow', () => {
    const { jobs } = readWorkflow('unit-testing.yml');

    expect(Object.keys(jobs)).toEqual(['unit']);
    const runs = (jobs.unit.steps ?? []).map((step) => step.run);
    expect(runs).toContain('make test-unit-all');
  });
});
