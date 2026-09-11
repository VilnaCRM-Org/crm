/**
 * @jest-environment @stryker-mutator/jest-runner/jest-env/node
 */

import fs from 'fs';
import path from 'path';

const repoRoot = path.resolve(__dirname, '..', '..', '..');

const readRepoFile = (relativePath: string): string =>
  fs.readFileSync(path.join(repoRoot, relativePath), 'utf-8');

const readWorkflow = (name: string): string => readRepoFile(path.join('.github/workflows', name));

const directivesOf = (contents: string): string => contents.replace(/^[ \t]*#.*$/gm, '');

const recipeOf = (makefile: string, target: string): string => {
  const match = makefile.match(new RegExp(`^${target}:.*\\n((?:\\t.*\\n)+)`, 'm'));

  expect(match).not.toBeNull();

  return match?.[1] ?? '';
};

const stageOf = (dockerfile: string, name: string): string => {
  const start = dockerfile.search(new RegExp(`^FROM .+ AS ${name}$`, 'm'));

  expect(start).toBeGreaterThan(-1);
  const rest = dockerfile.slice(start + 1);
  const end = rest.search(/^FROM /m);

  return end === -1 ? rest : rest.slice(0, end);
};

describe('supply-chain scanners (issue #140)', () => {
  const makefile = readRepoFile('Makefile');

  it('pins both scanner images by digest', () => {
    expect(makefile).toMatch(/^TRIVY_IMAGE\s+= aquasec\/trivy:\d+\.\d+\.\d+@sha256:[0-9a-f]{64}$/m);
    expect(makefile).toMatch(
      /^GITLEAKS_IMAGE\s+= ghcr\.io\/gitleaks\/gitleaks:v\d+\.\d+\.\d+@sha256:[0-9a-f]{64}$/m
    );
  });

  it('blocks on fixable HIGH and CRITICAL findings only, and fails the recipe on a hit', () => {
    expect(makefile).toMatch(/^TRIVY_SEVERITY\s+= HIGH,CRITICAL$/m);
    expect(makefile).toMatch(/^TRIVY_ARGS\s+=.*--severity \$\(TRIVY_SEVERITY\)/m);
    expect(makefile).toMatch(/^TRIVY_ARGS\s+=.*--ignore-unfixed/m);
    expect(recipeOf(makefile, 'scan-dependencies')).toMatch(
      /fs \$\(TRIVY_ARGS\) --exit-code 1 bun\.lock/
    );
    expect(recipeOf(makefile, 'scan-image')).toMatch(
      /image \$\(TRIVY_ARGS\) --exit-code 1 --input \$\(SCAN_IMAGE_TAR\)/
    );
  });

  it('runs the scanner unprivileged against a saved image, never the Docker socket', () => {
    expect(makefile).toMatch(
      /^TRIVY_RUN\s+= docker run --rm --user "\$\$\(id -u\):\$\$\(id -g\)"/m
    );
    expect(makefile).toMatch(/^TRIVY_RUN\s+=.*-v "\$\(CURDIR\):\/repo:ro"/m);
    expect(makefile).not.toContain('docker.sock');
    expect(recipeOf(makefile, 'scan-image')).toContain(
      'docker save -o $(SCAN_IMAGE_TAR) $(SCAN_IMAGE_TAG)'
    );
    expect(recipeOf(makefile, 'scan-secrets')).toMatch(/-v "\$\(CURDIR\):\/repo:ro"/);
  });

  it('scans the deployable production target, never the test harness', () => {
    expect(recipeOf(makefile, 'scan-image')).toContain('--target production');
    expect(recipeOf(makefile, 'sbom')).toContain('--target production');
    expect(recipeOf(makefile, 'scan-image')).not.toContain('test-harness');
  });

  it('never blocks a pull request on dev-only tooling; the weekly audit reports it', () => {
    expect(recipeOf(makefile, 'scan-dependencies')).not.toContain('--include-dev-deps');
    expect(readRepoFile('scripts/ci/report-dependency-audit.sh')).toContain('--include-dev-deps');
    expect(readRepoFile('scripts/ci/report-dependency-audit.sh')).toContain('--exit-code 0');
  });

  it('follows every history scan with the seeded-credential positive control', () => {
    const recipe = recipeOf(makefile, 'scan-secrets');

    expect(recipe).toMatch(/\$\(GITLEAKS_IMAGE\) \$\(GITLEAKS_ARGS\) \./);
    expect(recipe.indexOf('$(GITLEAKS_IMAGE) $(GITLEAKS_ARGS)')).toBeLessThan(
      recipe.indexOf('$(SECRET_SCAN_CONTROL_SCRIPT)')
    );
    expect(makefile).toMatch(/^GITLEAKS_ARGS\s+= git .*--exit-code 1 --config \.gitleaks\.toml$/m);
  });

  it('keeps the scans out of `make lint`, like the other standalone Docker gates', () => {
    const lintAggregate = makefile.match(/^lint: (.*?) ## /m);

    expect(lintAggregate).not.toBeNull();
    ['scan-secrets', 'scan-dependencies', 'scan-image', 'sbom', 'report-dependency-audit'].forEach(
      (target) => expect(lintAggregate?.[1]).not.toContain(target)
    );
  });
});

describe('secret-scanning policy (issue #140)', () => {
  const policy = readRepoFile('.gitleaks.toml');
  const allowlists = policy.split('[[allowlists]]').slice(1);

  it('extends the default ruleset rather than replacing it', () => {
    expect(policy).toMatch(/\[extend\]\nuseDefault = true/);
    expect(policy).not.toContain('[[rules]]');
    expect(policy).not.toContain('disabledRules');
  });

  it('allowlists only the generated contract artifact and the checksum shape', () => {
    expect(allowlists).toHaveLength(2);
    const paths = policy.match(/^paths = \[(.*)\]$/gm) ?? [];
    const regexes = policy.match(/^regexes = \[(.*)\]$/gm) ?? [];

    expect(paths).toEqual(["paths = ['''^src/api/generated/openapi\\.ts$''']"]);
    expect(regexes).toEqual(["regexes = ['''ARG OPENAPI_SPEC_SHA256=[0-9a-f]{64}''']"]);
    expect(policy).not.toMatch(/^commits = /m);
    expect(policy).not.toMatch(/^stopwords = /m);
  });

  it('gives every allowlist a description', () => {
    allowlists.forEach((entry) => expect(entry).toMatch(/^description = ".{20,}"$/m));
  });
});

describe('supply-chain security workflow (issue #140)', () => {
  const workflow = directivesOf(readWorkflow('supply-chain-security.yml'));

  it('runs every gate through its Makefile target', () => {
    [
      'make scan-secrets',
      'make scan-dependencies',
      'make scan-image',
      'make report-dependency-audit',
    ].forEach((command) => expect(workflow).toContain(`run: ${command}`));
  });

  it('blocks every pull request to main and re-evaluates main weekly', () => {
    expect(workflow).toMatch(/on:\n {2}pull_request:\n {4}branches: \['main'\]/);
    expect(workflow).toMatch(/^ {2}schedule:\n {4}- cron: /m);
    expect(workflow).not.toContain('paths:');
    expect(workflow).not.toContain('continue-on-error');
  });

  it('scans the full history, not a shallow tip', () => {
    const secrets = workflow.slice(
      workflow.indexOf('  secrets:'),
      workflow.indexOf('  dependencies:')
    );

    expect(secrets).toMatch(/fetch-depth: 0/);
  });

  it('routes the weekly audit to a tracking issue and keeps it off pull requests', () => {
    const audit = workflow.slice(workflow.indexOf('  audit:'));

    expect(audit).toMatch(/^ {4}if: github\.event_name != 'pull_request'$/m);
    expect(audit).toMatch(/permissions:\n {6}contents: read\n {6}issues: write/);
    expect(audit).toContain('GH_TOKEN: ${{ github.token }}');
  });
});

describe('sbom workflow (issue #140)', () => {
  const workflow = directivesOf(readWorkflow('sbom.yml'));

  it('generates the CycloneDX documents on every PR and attaches them to releases', () => {
    expect(workflow).toMatch(/^ {2}release:\n {4}types: \[published\]/m);
    expect(workflow).toContain('run: make sbom');
    expect(workflow).toContain('path: sbom/*.cdx.json');
    expect(workflow).toContain('if-no-files-found: error');
  });

  it('writes release assets only for a named release and never restores a cache', () => {
    const attach = workflow.slice(workflow.indexOf('  attach:'), workflow.indexOf('  report:'));
    const releaseOnly = "(github.event.release.tag_name || inputs.release_tag || '') != ''";

    expect(attach).toContain(`    if: ${releaseOnly}\n`);
    expect(attach).toMatch(/permissions:\n {6}contents: write/);
    expect(attach).toContain('gh release upload "$RELEASE_TAG" sbom/*.cdx.json');
    expect(workflow).not.toContain('actions/cache');
  });

  it('files a tracking issue when a release ends up without its SBOM, with a retry path', () => {
    const report = workflow.slice(workflow.indexOf('  report:'));

    expect(report).toMatch(/^ {4}if: failure\(\) && \(github\.event\.release\.tag_name/m);
    expect(report).toMatch(/needs: \[generate, attach\]/);
    expect(report).toMatch(/permissions:\n {6}contents: read\n {6}issues: write/);
    expect(report).toContain('run: sh scripts/ci/report-sbom-failure.sh');
    expect(workflow).toMatch(/workflow_dispatch:\n {4}inputs:\n {6}release_tag:/);
    expect(readRepoFile('scripts/ci/report-sbom-failure.sh')).toContain(
      'gh workflow run sbom.yml -f release_tag='
    );
  });
});

describe('production runtime image (issue #140)', () => {
  const dockerfile = readRepoFile('Dockerfile');

  it('ships no package manager: serve is resolved in a tooling stage and copied in', () => {
    expect(stageOf(dockerfile, 'serve-tools')).toMatch(/^RUN npm install -g serve@\d+\.\d+\.\d+$/m);
    const runtime = stageOf(dockerfile, 'serve-base');

    expect(dockerfile).toMatch(
      /^FROM public\.ecr\.aws\/docker\/library\/alpine:\d+\.\d+ AS serve-base$/m
    );
    expect(runtime).not.toContain('npm ');
    expect(runtime).toContain('COPY --from=serve-tools /usr/local/bin/node /usr/local/bin/node');
    expect(runtime).toContain(
      'COPY --from=serve-tools /usr/local/lib/node_modules/serve /usr/local/lib/node_modules/serve'
    );
  });

  it('pins every apk package it adds and runs as the unprivileged node user', () => {
    const runtime = stageOf(dockerfile, 'serve-base');
    const apkLines = runtime.match(/^ {4}[a-z+]+=\$\{[A-Z_]+\}/gm) ?? [];

    expect(apkLines.length).toBeGreaterThanOrEqual(3);
    expect(runtime).not.toMatch(/apk upgrade/);
    expect(runtime).toContain('adduser -u 1000 -G node -s /bin/sh -D node');
    expect(stageOf(dockerfile, 'production')).toMatch(/^USER node$/m);
  });
});

describe('README security claims (issue #140, issue #141)', () => {
  const readme = readRepoFile('README.md');
  const workflowNames = fs
    .readdirSync(path.join(repoRoot, '.github/workflows'))
    .filter((entry) => entry.endsWith('.yml') || entry.endsWith('.yaml'))
    .map((entry) => readWorkflow(entry).match(/^name: (.*)$/m)?.[1] ?? '');

  it('names no scanner that has no workflow', () => {
    expect(readme).not.toMatch(/snyk/i);
    expect(readme).not.toMatch(/deepscan/i);
  });

  it('lists only checks that a workflow actually declares', () => {
    const start = readme.indexOf('\n## CI checks');
    const end = readme.indexOf('\n## ', start + 1);
    const section = readme.slice(start, end);
    const claimed = [...section.matchAll(/^\| `([^`]+)`\s+\|/gm)].map((match) => match[1]);

    expect(new Set(claimed).size).toBe(workflowNames.length);
    claimed.forEach((name) => expect(workflowNames).toContain(name));
  });
});
