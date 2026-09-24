/**
 * @jest-environment @stryker-mutator/jest-runner/jest-env/node
 */

import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';

import YAML from 'yaml';

const repoRoot = path.resolve(__dirname, '..', '..', '..');

const readRepoFile = (relativePath: string): string =>
  fs.readFileSync(path.join(repoRoot, relativePath), 'utf-8');

interface Step {
  id?: string;
  uses?: string;
  run?: string;
  with?: Record<string, unknown>;
  env?: Record<string, string>;
}

interface Job {
  permissions?: Record<string, string>;
  steps?: Step[];
}

interface Workflow {
  jobs?: Record<string, Job>;
}

interface CompositeAction {
  inputs: Record<string, { default?: string }>;
  runs: { using: string; steps: Step[] };
}

interface ComposeFile {
  services: { dev: { build: { context: string; target: string; args: Record<string, string> } } };
}

const DEV_IMAGE_ACTION = './.github/actions/dev-image';
const MAKE_TARGET = /\bmake\s+([a-z][\w-]*)/g;
const DEV_SERVICE_COMPOSE = /docker compose -f docker-compose\.yml (?:up|run)\b[^\n|;&]*\bdev\b/;
const PUBLISHING_GRANTS = ['contents', 'packages', 'id-token', 'attestations'];

const workflows = (): [string, Workflow][] =>
  fs
    .readdirSync(path.join(repoRoot, '.github/workflows'))
    .filter((entry) => entry.endsWith('.yml') || entry.endsWith('.yaml'))
    .sort()
    .map((entry) => [entry, YAML.parse(readRepoFile(path.join('.github/workflows', entry)))]);

const makeDryRun = (target: string, extraEnv: Record<string, string> = {}): string => {
  const env = { ...process.env, ...extraEnv };
  if (!('DEV_IMAGE_PREBUILT' in extraEnv)) delete env.DEV_IMAGE_PREBUILT;
  if (!('CI' in extraEnv)) delete env.CI;

  return execFileSync('make', ['-n', target], { cwd: repoRoot, encoding: 'utf8', env });
};

const devImageTargets = new Map<string, boolean>();

const buildsDevImage = (target: string): boolean => {
  if (!devImageTargets.has(target)) {
    try {
      devImageTargets.set(target, DEV_SERVICE_COMPOSE.test(makeDryRun(target)));
    } catch {
      devImageTargets.set(target, false);
    }
  }

  return devImageTargets.get(target) === true;
};

const reachesDevImage = (step: Step): boolean =>
  [...(step.run ?? '').matchAll(MAKE_TARGET)].some(([, target]) => buildsDevImage(target ?? ''));

const startsDevStack = (job: Job): boolean => (job.steps ?? []).some(reachesDevImage);

const usesDevImageAction = (job: Job): boolean =>
  (job.steps ?? []).some((step) => step.uses === DEV_IMAGE_ACTION);

const uncachedDevStarts = (file: string, workflow: Workflow): string[] =>
  Object.entries(workflow.jobs ?? {})
    .filter(([, job]) => startsDevStack(job))
    .filter(([, job]) => {
      const steps = job.steps ?? [];
      const checkout = steps.findIndex((step) => step.uses?.startsWith('actions/checkout@'));
      const build = steps.findIndex((step) => step.uses === DEV_IMAGE_ACTION);
      const start = steps.findIndex(reachesDevImage);

      return !(checkout >= 0 && checkout < build && build < start);
    })
    .map(([id]) => `${file}#${id}`);

const publishingCacheUsers = (file: string, workflow: Workflow): string[] =>
  Object.entries(workflow.jobs ?? {})
    .filter(([, job]) => usesDevImageAction(job))
    .filter(([, job]) => PUBLISHING_GRANTS.some((grant) => job.permissions?.[grant] === 'write'))
    .map(([id]) => `${file}#${id}`);

const syntheticWorkflow = (steps: string, permissions = 'contents: read'): Workflow =>
  YAML.parse(`jobs:
  job:
    permissions:
      ${permissions}
    steps:
${steps}`);

const CHECKOUT = '      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1';
const BUILD = `      - uses: ${DEV_IMAGE_ACTION}`;
const START = '      - run: make start';

describe('dev image layer cache (issue #136)', () => {
  const action = YAML.parse(
    readRepoFile('.github/actions/dev-image/action.yml')
  ) as CompositeAction;
  const compose = YAML.parse(readRepoFile('docker-compose.yml')) as ComposeFile;
  const steps = action.runs.steps;
  const buildStep = steps.find((step) => step.uses?.startsWith('docker/build-push-action@'));
  const buildxStep = steps.find((step) => step.uses?.startsWith('docker/setup-buildx-action@'));
  const resolveStep = steps.find((step) => step.id === 'image');

  it('builds the dev image through the cached action in every job starting the dev stack', () => {
    const starters = workflows().flatMap(([file, workflow]) =>
      Object.entries(workflow.jobs ?? {})
        .filter(([, job]) => startsDevStack(job))
        .map(([id]) => `${file}#${id}`)
    );
    const uncached = workflows().flatMap(([file, workflow]) => uncachedDevStarts(file, workflow));

    expect(starters.length).toBeGreaterThanOrEqual(19);
    expect(starters).toEqual(
      expect.arrayContaining(['bats-testing.yml#bats', 'security-testing.yml#auth-seed-gate'])
    );
    expect(uncached).toEqual([]);
  });

  it('flags a dev-stack start that is missing the action or runs it out of order', () => {
    expect(uncachedDevStarts('bare.yml', syntheticWorkflow([CHECKOUT, START].join('\n')))).toEqual([
      'bare.yml#job',
    ]);
    expect(
      uncachedDevStarts('late.yml', syntheticWorkflow([CHECKOUT, START, BUILD].join('\n')))
    ).toEqual(['late.yml#job']);
    expect(
      uncachedDevStarts('early.yml', syntheticWorkflow([BUILD, CHECKOUT, START].join('\n')))
    ).toEqual(['early.yml#job']);
    expect(
      uncachedDevStarts(
        'dev.yml',
        syntheticWorkflow([CHECKOUT, BUILD, '      - run: make start-dev'].join('\n'))
      )
    ).toEqual([]);
    expect(
      uncachedDevStarts(
        'bats.yml',
        syntheticWorkflow([CHECKOUT, '      - run: make test-bats BATS_FORMATTER=tap'].join('\n'))
      )
    ).toEqual(['bats.yml#job']);
    expect(
      uncachedDevStarts(
        'bats.yml',
        syntheticWorkflow([CHECKOUT, BUILD, '      - run: make test-bats'].join('\n'))
      )
    ).toEqual([]);
    expect(
      uncachedDevStarts(
        'prod.yml',
        syntheticWorkflow([CHECKOUT, '      - run: make start-prod'].join('\n'))
      )
    ).toEqual([]);
  });

  it('keeps the layer cache out of every job that can publish or release', () => {
    const offenders = workflows().flatMap(([file, workflow]) =>
      publishingCacheUsers(file, workflow)
    );
    const releaseWorkflows = ['autorelease.yml', 'sbom.yml'].map((file) =>
      readRepoFile(path.join('.github/workflows', file))
    );

    expect(offenders).toEqual([]);
    releaseWorkflows.forEach((contents) => expect(contents).not.toContain('actions/dev-image'));
    expect(
      publishingCacheUsers(
        'publish.yml',
        syntheticWorkflow([CHECKOUT, BUILD, START].join('\n'), 'packages: write')
      )
    ).toEqual(['publish.yml#job']);
  });

  it('builds exactly the compose dev service image and loads it for compose to reuse', () => {
    const dev = compose.services.dev.build;

    expect(action.runs.using).toBe('composite');
    expect(buildxStep?.with).toEqual({ use: false });
    expect(buildStep?.with).toMatchObject({
      builder: `\${{ steps.${buildxStep?.id}.outputs.name }}`,
      context: dev.context,
      file: 'Dockerfile',
      target: dev.target,
      load: true,
      push: false,
      tags: '${{ steps.image.outputs.tag }}',
    });
    expect(
      String(buildStep?.with?.['build-args'])
        .trim()
        .split('\n')
        .map((arg) => arg.split('=')[0])
    ).toEqual(Object.keys(dev.args));
    expect(resolveStep?.run).toContain(
      "docker compose -f docker-compose.yml config --format json | jq -r '.name'"
    );
    expect(resolveStep?.run).toContain('echo "tag=${project}-dev"');
  });

  it('reads and writes one type=gha scope per image variant; an export never fails a build', () => {
    const scope = '${{ steps.image.outputs.scope }}';

    expect(buildStep?.with?.['cache-from']).toBe(`type=gha,scope=${scope}`);
    expect(buildStep?.with?.['cache-to']).toBe(
      `type=gha,mode=max,scope=${scope},ignore-error=true`
    );
    expect(resolveStep?.run).toContain('true) scope=dev-image-chromium ;;');
    expect(resolveStep?.run).toContain('false) scope=dev-image ;;');
    expect(action.inputs['install-chromium']?.default).toBe('false');
  });

  it('keeps the action pins inside the Dependabot github-actions lane', () => {
    const config = YAML.parse(readRepoFile('.github/dependabot.yml')) as {
      updates: { 'package-ecosystem': string; directories?: string[] }[];
    };
    const lane = config.updates.find((update) => update['package-ecosystem'] === 'github-actions');

    expect(lane?.directories).toEqual(['/', '/.github/actions/*']);
  });

  it('hands the prebuilt image to the Makefile through DEV_IMAGE_PREBUILT', () => {
    const last = steps[steps.length - 1];

    expect(last?.run?.trim()).toBe(`echo 'DEV_IMAGE_PREBUILT=1' >> "$GITHUB_ENV"`);
  });

  it('keeps the local compose build unchanged and drops --build only for a prebuilt image', () => {
    expect(makeDryRun('start')).toContain(
      'docker compose -f docker-compose.yml up -d --build dev mockoon apollo'
    );
    expect(makeDryRun('start-dev')).toContain(
      'docker compose -f docker-compose.yml up -d --build dev\n'
    );
    expect(makeDryRun('ci-setup')).toContain('up -d --no-recreate dev mockoon');
    expect(makeDryRun('ci-setup', { CI: 'true' })).toContain('up -d --build dev mockoon');

    const prebuilt = { DEV_IMAGE_PREBUILT: '1' };

    expect(makeDryRun('start', prebuilt)).toContain(
      'docker compose -f docker-compose.yml up -d dev mockoon apollo'
    );
    expect(makeDryRun('start-dev', prebuilt)).toContain(
      'docker compose -f docker-compose.yml up -d dev\n'
    );
    expect(makeDryRun('ci-setup', { ...prebuilt, CI: 'true' })).toContain('up -d dev mockoon');
    ['start', 'start-dev'].forEach((target) =>
      expect(makeDryRun(target, prebuilt)).not.toContain('--build')
    );
  });
});
