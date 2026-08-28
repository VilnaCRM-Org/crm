/**
 * @jest-environment @stryker-mutator/jest-runner/jest-env/node
 */

import fs from 'fs';
import path from 'path';

const repoRoot = path.resolve(__dirname, '..', '..', '..');

const readRepoFile = (relativePath: string): string =>
  fs.readFileSync(path.join(repoRoot, relativePath), 'utf-8');

const readWorkflow = (name: string): string => readRepoFile(path.join('.github/workflows', name));

// Rationale comments name the very actions these gates ban, so scan directives, not prose.
const directivesOf = (contents: string): string => contents.replace(/^[ \t]*#.*$/gm, '');

const usesRefsOf = (contents: string): string[] =>
  contents.match(/^[ \t]*-?[ \t]*uses: .*$/gm) ?? [];

const workflowEntries = (): [string, string][] =>
  fs
    .readdirSync(path.join(repoRoot, '.github/workflows'))
    .filter((entry) => entry.endsWith('.yml') || entry.endsWith('.yaml'))
    .map((entry) => [entry, readWorkflow(entry)]);

describe('workflow-security gate (issue #174)', () => {
  const makefile = readRepoFile('Makefile');
  const workflow = readWorkflow('workflow-security.yml');

  it('pins zizmor by digest and audits every workflow at the medium severity threshold', () => {
    expect(makefile).toMatch(
      /^ZIZMOR_IMAGE\s+= ghcr\.io\/zizmorcore\/zizmor:\d+\.\d+\.\d+@sha256:[0-9a-f]{64}$/m
    );
    expect(makefile).toMatch(/^ZIZMOR_ARGS\s+=.*--min-severity medium/m);
    // Load-bearing: at the default persona, excessive-permissions does not fire on a
    // workflow-level `permissions: write-all` in a single-job workflow.
    expect(makefile).toMatch(/^ZIZMOR_ARGS\s+=.*--persona pedantic/m);
    expect(makefile).toMatch(
      /^\tdocker run .*\$\(ZIZMOR_IMAGE\) \$\(ZIZMOR_ARGS\) \.github\/workflows\/$/m
    );
  });

  it('runs the gate through the Makefile target so the pin cannot fork from the local run', () => {
    expect(directivesOf(workflow)).toContain('run: make lint-zizmor');
  });

  it('blocks every pull request to main rather than a filtered subset', () => {
    expect(workflow).toMatch(/on:\n {2}pull_request:\n {4}branches: \['main'\]/);
    expect(directivesOf(workflow)).not.toContain('paths:');
  });

  it('keeps the gate out of `make lint`, whose aggregate is mirrored by CI_LINT_TARGETS', () => {
    const lintAggregate = makefile.match(/^lint: (.*?) ## /m);

    expect(lintAggregate).not.toBeNull();
    expect(lintAggregate?.[1]).not.toContain('lint-zizmor');
  });
});

describe('workflow action-pin hygiene (issue #174)', () => {
  const workflows = workflowEntries();

  it.each(workflows)('%s pins every action to a full commit SHA', (_name, contents) => {
    const refs = usesRefsOf(contents);

    expect(refs.length).toBeGreaterThan(0);
    refs.forEach((ref) => expect(ref).toMatch(/uses: \S+@[0-9a-f]{40}(?: #.*)?$/));
  });

  it.each(workflows)('%s uses no archived or mutable-branch action', (_name, contents) => {
    usesRefsOf(contents).forEach((ref) => {
      expect(ref).not.toContain('tibdex/github-app-token');
      expect(ref).not.toContain('actions/create-release');
      expect(ref).not.toContain('norwd/fmtya');
      expect(ref).not.toMatch(/# (main|master)$/);
    });
  });
});

describe('scorecard posture monitor (issue #175)', () => {
  const workflow = readWorkflow('scorecard.yml');

  it('runs on the weekly cron and on push to main so the score is diffable run over run', () => {
    expect(workflow).toContain("- cron: '30 2 * * 1'");
    expect(workflow).toMatch(/push:\n {4}branches: \['main'\]/);
  });

  it('publishes signed results and uploads SARIF to code scanning', () => {
    expect(workflow).toContain('publish_results: true');
    expect(workflow).toContain('github/codeql-action/upload-sarif@');
    expect(workflow).toContain('sarif_file: results.sarif');
  });

  it('declares every scope at the job level, since a job block replaces the top level', () => {
    expect(workflow).toContain('permissions: {}');
    expect(workflow).toContain('contents: read');
    expect(workflow).toContain('security-events: write');
    expect(workflow).toContain('id-token: write');
  });

  it('never cancels an in-flight posture run, which has no successor until the next tick', () => {
    expect(workflow).toContain('cancel-in-progress: false');
  });

  it('shares the codeql-action pin with the security testing workflow', () => {
    const pinOf = (contents: string): string | undefined =>
      contents.match(/github\/codeql-action\/[a-z-]+@([0-9a-f]{40})/)?.[1];

    expect(pinOf(workflow)).toBe(pinOf(readWorkflow('security-testing.yml')));
  });
});

describe('binding YAML format gate (issue #161)', () => {
  const workflow = readWorkflow('yaml-formater.yml');
  const makefile = readRepoFile('Makefile');

  it('replaces the auto-format-and-commit no-op with a real check', () => {
    const directives = directivesOf(workflow);

    expect(directives).not.toContain('fmtya');
    expect(directives).toContain('--check');
    expect(directives).toContain('"**/*.{yml,yaml}"');
    expect(directives).toContain('--ignore-path .prettierignore');
  });

  // Prettier passes uniqueKeys: false, so it accepts duplicate mapping keys. Compose's own
  // loader is what rejects them, and it only helps if every combination the repo starts is
  // validated and the gate runs in `make lint` / CI_LINT_TARGETS.
  it('covers duplicate mapping keys through compose validation, which prettier cannot do', () => {
    const composeRecipe = makefile.match(/^lint-compose:.*\n((?:\t.*\n)+)/m)?.[1] ?? '';
    const configuredFiles = [
      'DOCKER_COMPOSE_DEV_FILE',
      'DOCKER_COMPOSE_TEST_FILE',
      'COMMON_HEALTHCHECKS_FILE',
      'DOCKER_COMPOSE_MEMLEAK_FILE',
    ];

    configuredFiles.forEach((variable) => expect(composeRecipe).toContain(`$(${variable})`));
    expect(composeRecipe.match(/config -q/g)).toHaveLength(4);

    expect(makefile).toMatch(/^lint: .*\blint-compose\b.* ## /m);
    expect(makefile).toMatch(/^CI_LINT_TARGETS\s+=.*\blint-compose\b/m);
  });

  it('keeps the workflow file name and the yamlfmt job identity', () => {
    expect(workflow).toContain('name: format yaml files');
    expect(workflow).toMatch(/^ {2}yamlfmt:$/m);
  });

  it('pins prettier to the version bun.lock resolves, so the YAML paths cannot disagree', () => {
    const pinned = workflow.match(/PRETTIER_VERSION: (\d+\.\d+\.\d+)/)?.[1];
    const resolved = readRepoFile('bun.lock').match(
      /"prettier": \["prettier@(\d+\.\d+\.\d+)"/
    )?.[1];

    expect(resolved).toBeDefined();
    expect(pinned).toBe(resolved);
  });

  it('brings YAML under `make format` and `make lint-prettier` as well', () => {
    expect(readRepoFile('Makefile')).toMatch(
      /^PRETTIER_FILE_GLOB\s+= "\*\*\/\*\.\{[^"]*,yml,yaml\}"$/m
    );
  });
});
