import { execFileSync } from 'child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import os from 'os';
import path from 'path';

import {
  compareSnapshots,
  isWaived,
  formatFindingsTable,
} from '@scripts/ci/gate-ratchet/compare.mjs';

const REPO_ROOT = path.resolve(__dirname, '../../..');
const EXTRACT_CLI = path.join(REPO_ROOT, 'scripts/ci/gate-ratchet/extract-cli.mjs');
const MANIFEST_PATH = path.join(REPO_ROOT, 'config/gate-thresholds.manifest.json');

type Snapshot = {
  numeric: Record<string, { value: number; direction: 'min' | 'max' }>;
  sets: Record<string, { items: string[]; rule: 'no-grow' | 'no-shrink' }>;
};

type Finding = {
  file: string;
  key: string;
  subject: string | null;
  base: string | number;
  head: string | number | null;
  rule: string;
  reason: string;
};

let workspace: string;

beforeAll(() => {
  workspace = mkdtempSync(path.join(os.tmpdir(), 'gate-ratchet-test-'));
});

afterAll(() => {
  rmSync(workspace, { recursive: true, force: true });
});

function fixture(relativePath: string, contents: string): string {
  const root = mkdtempSync(path.join(workspace, 'tree-'));
  const target = path.join(root, relativePath);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, contents);
  return root;
}

function extract(root: string, relativePath: string, extractor: string, env = {}): Snapshot {
  const outFile = path.join(workspace, `snap-${process.hrtime.bigint()}.json`);
  // TEST_ENV is pinned before the caller's overrides so the scope key stays deterministic: the CI
  // runner invokes this suite as `make test-unit-client`, which exports TEST_ENV=client, and an
  // inherited value would silently rename every `[default]` key to `[client]`.
  execFileSync(process.execPath, [EXTRACT_CLI, root, relativePath, extractor, outFile], {
    env: { ...process.env, TEST_ENV: '', ...env },
  });
  return JSON.parse(readFileSync(outFile, 'utf8')) as Snapshot;
}

function snapshotPair(
  relativePath: string,
  extractor: string,
  baseContents: string,
  headContents: string,
  env = {}
): Finding[] {
  const base = extract(fixture(relativePath, baseContents), relativePath, extractor, env);
  const head = extract(fixture(relativePath, headContents), relativePath, extractor, env);
  return compareSnapshots(relativePath, base, head) as Finding[];
}

const LHCI = (score: number, level = 'error'): string => `module.exports = {
  ci: { assert: { assertions: {
    'categories:performance': ['${level}', { minScore: ${score} }],
    'resource-summary:script:size': ['error', { maxNumericValue: 265000 }],
  } } },
};
`;

const METRICS = (cyclomatic: number, miFloor: number): string =>
  `${JSON.stringify(
    { hard: { cyclomatic_max: cyclomatic, mi_visual_studio_min: miFloor } },
    null,
    2
  )}\n`;

const JSCPD = (minTokens: number, ignore: string[]): string =>
  `${JSON.stringify(
    { threshold: 0, minTokens, minLines: 5, ignore, path: ['src'], format: ['typescript'] },
    null,
    2
  )}\n`;

const JEST_CONFIG = (branches: number, exclusions: string[]): string => `const config = {
  collectCoverageFrom: ['<rootDir>/src/**/*.{ts,tsx}'${exclusions.map((e) => `, '${e}'`).join('')}],
  coverageThreshold: {
    global: { branches: ${branches}, functions: 100, lines: 100, statements: 100 },
  },
};
export default config;
`;

const STRYKER = (breakAt: number): string =>
  [
    `const config = { thresholds: { high: 100, low: 90, break: ${breakAt} } };`,
    'export default config;',
    '',
  ].join('\n');

const TSCONFIG = (uncheckedIndexedAccess: boolean): string =>
  `${JSON.stringify(
    {
      compilerOptions: {
        strict: true,
        noImplicitOverride: true,
        ...(uncheckedIndexedAccess ? { noUncheckedIndexedAccess: true } : {}),
      },
    },
    null,
    2
  )}\n`;

const LHCI_CEILING = (maxNumericValue: string): string => `module.exports = {
  ci: { assert: { assertions: {
    'resource-summary:script:size': ['error', { maxNumericValue: ${maxNumericValue} }],
  } } },
};
`;

const LOAD_CONFIG = (threshold: number, scenarios = ['smoke', 'average']): string =>
  `${JSON.stringify(
    {
      endpoints: {
        homepage: Object.fromEntries(
          scenarios.map((scenario) => [scenario, { threshold, rps: 5, vus: 5 }])
        ),
      },
    },
    null,
    2
  )}\n`;

const LOAD_BUILDER = (errorRate: number, checkPassRate: number): string =>
  `export default class ThresholdsBuilder {
  constructor() {
    this.thresholds = {};
  }

  addThreshold(testType) {
    this.thresholds[\`checks{scenario:\${testType}}\`] = ['rate>=${checkPassRate}'];
    this.thresholds[\`http_req_failed{scenario:\${testType}}\`] = ['rate<=${errorRate}'];
    return this;
  }

  build() {
    return this.thresholds;
  }
}
`;

const MANIFEST = (paths: string[]): string =>
  `${JSON.stringify(
    { waiverLabel: 'gate-relaxation', files: paths.map((p) => ({ path: p, extract: 'jscpd' })) },
    null,
    2
  )}\n`;

describe('gate ratchet — numeric directions', () => {
  it('fails when a lighthouse minScore floor is lowered', () => {
    const findings = snapshotPair('lighthouserc.js', 'lhci-assertions', LHCI(0.85), LHCI(0.84));
    expect(findings).toEqual([
      expect.objectContaining({
        key: 'categories:performance.minScore',
        base: 0.85,
        head: 0.84,
        rule: 'min',
        reason: 'threshold weakened',
      }),
    ]);
  });

  it('passes when a lighthouse minScore floor is raised', () => {
    expect(snapshotPair('lighthouserc.js', 'lhci-assertions', LHCI(0.84), LHCI(0.85))).toEqual([]);
  });

  it('fails when an assertion severity is downgraded from error to warn', () => {
    const findings = snapshotPair(
      'lighthouserc.js',
      'lhci-assertions',
      LHCI(0.85),
      LHCI(0.85, 'warn')
    );
    expect(findings).toEqual([
      expect.objectContaining({
        key: 'categories:performance.level',
        base: 2,
        head: 1,
        rule: 'min',
      }),
    ]);
  });

  it('fails when a metrics-policy ceiling is raised', () => {
    const findings = snapshotPair(
      'metrics.json',
      'metrics-policy-hard',
      METRICS(10, 20),
      METRICS(20, 20)
    );
    expect(findings).toEqual([
      expect.objectContaining({ key: 'hard.cyclomatic_max', base: 10, head: 20, rule: 'max' }),
    ]);
  });

  it('fails when a metrics-policy FLOOR (_min key) is lowered', () => {
    const findings = snapshotPair(
      'metrics.json',
      'metrics-policy-hard',
      METRICS(10, 20),
      METRICS(10, 5)
    );
    expect(findings).toEqual([
      expect.objectContaining({ key: 'hard.mi_visual_studio_min', base: 20, head: 5, rule: 'min' }),
    ]);
  });

  it('passes when a metrics-policy FLOOR is raised', () => {
    expect(
      snapshotPair('metrics.json', 'metrics-policy-hard', METRICS(10, 20), METRICS(10, 40))
    ).toEqual([]);
  });

  it('fails when the jscpd minimum clone size is raised', () => {
    const findings = snapshotPair('.jscpd.json', 'jscpd', JSCPD(75, []), JSCPD(200, []));
    expect(findings).toEqual([
      expect.objectContaining({ key: 'minTokens', base: 75, head: 200, rule: 'max' }),
    ]);
  });

  it('fails when the Stryker break threshold is lowered', () => {
    const findings = snapshotPair(
      'stryker.config.mjs',
      'stryker-thresholds',
      STRYKER(90),
      STRYKER(50)
    );
    expect(findings).toEqual([
      expect.objectContaining({ key: 'thresholds.break', base: 90, head: 50, rule: 'min' }),
    ]);
  });

  it('fails when a jest coverage threshold is lowered', () => {
    const findings = snapshotPair(
      'jest.config.ts',
      'jest-coverage',
      JEST_CONFIG(100, []),
      JEST_CONFIG(80, [])
    );
    expect(findings).toEqual([
      expect.objectContaining({
        key: 'coverageThreshold.global.branches[default]',
        base: 100,
        head: 80,
        rule: 'min',
      }),
    ]);
  });

  it('fails when a ceiling is raised to Infinity, which JSON would serialize as null', () => {
    const findings = snapshotPair(
      'lighthouserc.js',
      'lhci-assertions',
      LHCI_CEILING('265000'),
      LHCI_CEILING('Number.POSITIVE_INFINITY')
    );
    expect(findings).toEqual([
      expect.objectContaining({
        key: 'resource-summary:script:size.maxNumericValue',
        base: 265000,
        head: Number.MAX_VALUE,
        rule: 'max',
        reason: 'threshold weakened',
      }),
    ]);
  });

  it('fails when a k6 p99 latency ceiling is raised', () => {
    const findings = snapshotPair(
      'tests/load/config.json.dist',
      'load-config-thresholds',
      LOAD_CONFIG(5000),
      LOAD_CONFIG(50000)
    );
    expect(findings).toContainEqual(
      expect.objectContaining({
        key: 'endpoints.homepage.smoke.threshold',
        base: 5000,
        head: 50000,
        rule: 'max',
      })
    );
  });

  it('fails when a k6 fallback rate is weakened in either direction', () => {
    const findings = snapshotPair(
      'tests/load/utils/thresholds-builder.js',
      'load-threshold-fallbacks',
      LOAD_BUILDER(0.02, 0.95),
      LOAD_BUILDER(0.5, 0.5)
    );
    expect(findings).toContainEqual(
      expect.objectContaining({ key: 'smoke.errorRate', base: 0.02, head: 0.5, rule: 'max' })
    );
    expect(findings).toContainEqual(
      expect.objectContaining({ key: 'smoke.checkPassRate', base: 0.95, head: 0.5, rule: 'min' })
    );
  });

  it('reads the jest config once per TEST_ENV scope', () => {
    const findings = snapshotPair(
      'jest.config.ts',
      'jest-coverage',
      JEST_CONFIG(100, []),
      JEST_CONFIG(80, []),
      { TEST_ENV: 'server' }
    );
    expect(findings[0]?.key).toBe('coverageThreshold.global.branches[server]');
  });
});

describe('gate ratchet — set directions', () => {
  it('fails when the jest coverage exclusion list grows', () => {
    const findings = snapshotPair(
      'jest.config.ts',
      'jest-coverage',
      JEST_CONFIG(100, []),
      JEST_CONFIG(100, ['!<rootDir>/src/services/**'])
    );
    expect(findings).toEqual([
      expect.objectContaining({
        key: 'collectCoverageFrom.exclusions[default]',
        head: '!<rootDir>/src/services/**',
        rule: 'no-grow',
        reason: 'exclusion added',
      }),
    ]);
  });

  it('fails when a whole k6 load scenario is deleted', () => {
    const findings = snapshotPair(
      'tests/load/config.json.dist',
      'load-config-thresholds',
      LOAD_CONFIG(5000),
      LOAD_CONFIG(5000, ['smoke'])
    );
    expect(findings).toContainEqual(
      expect.objectContaining({
        key: 'thresholdKeys',
        subject: 'endpoints.homepage.average.threshold',
        rule: 'no-shrink',
      })
    );
  });

  it('fails when the jscpd ignore list grows', () => {
    const findings = snapshotPair(
      '.jscpd.json',
      'jscpd',
      JSCPD(75, []),
      JSCPD(75, ['src/modules/**'])
    );
    expect(findings).toEqual([
      expect.objectContaining({ key: 'ignore', head: 'src/modules/**', rule: 'no-grow' }),
    ]);
  });

  it('fails when a whole lighthouse assertion is deleted', () => {
    const stripped = LHCI(0.85).replace(/^.*resource-summary.*\n/m, '');
    const findings = snapshotPair('lighthouserc.js', 'lhci-assertions', LHCI(0.85), stripped);
    expect(findings.map((finding) => finding.reason)).toEqual([
      'guard removed',
      'guard removed',
      'guarded entry removed',
    ]);
  });

  it('fails when coveragePathIgnorePatterns grows', () => {
    const base = JEST_CONFIG(100, []);
    const head = base.replace(
      'const config = {',
      "const config = {\n  coveragePathIgnorePatterns: ['/node_modules/', '<rootDir>/src/routes/'],"
    );
    const withBaseline = base.replace(
      'const config = {',
      "const config = {\n  coveragePathIgnorePatterns: ['/node_modules/'],"
    );
    const findings = snapshotPair('jest.config.ts', 'jest-coverage', withBaseline, head);
    expect(findings).toEqual([
      expect.objectContaining({
        key: 'coveragePathIgnorePatterns[default]',
        head: '<rootDir>/src/routes/',
        rule: 'no-grow',
        reason: 'exclusion added',
      }),
    ]);
  });

  it('fails when a path-specific coverage threshold override is added', () => {
    const head = JEST_CONFIG(100, []).replace(
      'global: { branches: 100, functions: 100, lines: 100, statements: 100 },',
      'global: { branches: 100, functions: 100, lines: 100, statements: 100 },\n' +
        "    './src/routes/': { branches: 0, functions: 0, lines: 0, statements: 0 },"
    );
    const findings = snapshotPair('jest.config.ts', 'jest-coverage', JEST_CONFIG(100, []), head);
    expect(findings).toEqual([
      expect.objectContaining({
        key: 'coverageThreshold.pathOverrides[default]',
        head: './src/routes/',
        rule: 'no-grow',
        reason: 'exclusion added',
      }),
    ]);
  });

  it('fails when a tsconfig strictness flag is disabled', () => {
    const findings = snapshotPair(
      'tsconfig.json',
      'tsconfig-strict-flags',
      TSCONFIG(true),
      TSCONFIG(false)
    );
    expect(findings).toEqual([
      expect.objectContaining({
        key: 'compilerOptions.enabledStrictFlags',
        base: 'noUncheckedIndexedAccess',
        rule: 'no-shrink',
        reason: 'guarded entry removed',
      }),
    ]);
  });

  it('passes when a tsconfig strictness flag is added', () => {
    expect(
      snapshotPair('tsconfig.json', 'tsconfig-strict-flags', TSCONFIG(false), TSCONFIG(true))
    ).toEqual([]);
  });

  it('ignores non-strictness compiler options that are turned off', () => {
    const base = `${JSON.stringify(
      { compilerOptions: { strict: true, skipLibCheck: true, allowJs: true } },
      null,
      2
    )}\n`;
    const head = `${JSON.stringify({ compilerOptions: { strict: true } }, null, 2)}\n`;
    expect(snapshotPair('tsconfig.json', 'tsconfig-strict-flags', base, head)).toEqual([]);
  });

  it('fails when a dependsOn entry is removed from the manifest', () => {
    const withDep = `${JSON.stringify(
      {
        waiverLabel: 'gate-relaxation',
        files: [{ path: 'a.js', extract: 'jscpd', dependsOn: ['shared.json'] }],
      },
      null,
      2
    )}\n`;
    const withoutDep = `${JSON.stringify(
      { waiverLabel: 'gate-relaxation', files: [{ path: 'a.js', extract: 'jscpd' }] },
      null,
      2
    )}\n`;
    const findings = snapshotPair('manifest.json', 'manifest-self', withDep, withoutDep);
    expect(findings).toEqual([
      expect.objectContaining({
        key: 'guardedDependsOn',
        base: 'a.js::shared.json',
        rule: 'no-shrink',
      }),
    ]);
  });

  it('fails when envs is emptied, which would compare zero scopes for that entry', () => {
    const omitted = `${JSON.stringify(
      { waiverLabel: 'gate-relaxation', files: [{ path: 'a.js', extract: 'jscpd' }] },
      null,
      2
    )}\n`;
    const emptied = `${JSON.stringify(
      { waiverLabel: 'gate-relaxation', files: [{ path: 'a.js', extract: 'jscpd', envs: [] }] },
      null,
      2
    )}\n`;
    const findings = snapshotPair('manifest.json', 'manifest-self', omitted, emptied);
    expect(findings).toEqual([
      expect.objectContaining({ key: 'guardedEnvs', base: 'a.js::{}', rule: 'no-shrink' }),
    ]);
  });

  it('treats a reordered envs object as unchanged', () => {
    const build = (env: Record<string, string>): string =>
      `${JSON.stringify(
        {
          waiverLabel: 'gate-relaxation',
          files: [{ path: 'a.js', extract: 'jscpd', envs: [env] }],
        },
        null,
        2
      )}\n`;
    const findings = snapshotPair(
      'manifest.json',
      'manifest-self',
      build({ TEST_ENV: 'server', EXTRA: '1' }),
      build({ EXTRA: '1', TEST_ENV: 'server' })
    );
    expect(findings).toEqual([]);
  });

  it('fails when the waiver label is renamed', () => {
    const renamed = MANIFEST(['a.json']).replace('gate-relaxation', 'anything-goes');
    const findings = snapshotPair('manifest.json', 'manifest-self', MANIFEST(['a.json']), renamed);
    expect(findings).toEqual([
      expect.objectContaining({ key: 'waiverLabel', base: 'gate-relaxation', rule: 'no-shrink' }),
    ]);
  });

  it('fails when an entry is removed from the manifest itself', () => {
    const findings = snapshotPair(
      'manifest.json',
      'manifest-self',
      MANIFEST(['a.json', 'b.json']),
      MANIFEST(['a.json'])
    );
    // Dropping the entry removes both its guarded file and its implicit default env scope.
    expect(findings).toEqual([
      expect.objectContaining({
        key: 'guardedFiles',
        base: 'b.json::jscpd',
        rule: 'no-shrink',
        reason: 'guarded entry removed',
      }),
      expect.objectContaining({
        key: 'guardedEnvs',
        base: 'b.json::{}',
        rule: 'no-shrink',
        reason: 'guarded entry removed',
      }),
    ]);
  });
});

describe('gate ratchet — finding identity', () => {
  // The checker keeps only findings present against BOTH the merge base and the base tip. Every
  // no-shrink removal shares head '(absent)', so identity must key on `subject` or two removals
  // collapse into one and a removal already on main gets blamed on the PR.
  const identity = (finding: Finding): string =>
    JSON.stringify([finding.file, finding.key, finding.subject]);

  const guardedFiles = (findings: Finding[]): Finding[] =>
    findings.filter((finding) => finding.key === 'guardedFiles');

  it('gives each removed entry its own identity', () => {
    const removals = guardedFiles(
      snapshotPair(
        'manifest.json',
        'manifest-self',
        MANIFEST(['a.json', 'b.json', 'c.json']),
        MANIFEST(['a.json'])
      )
    );
    expect(removals).toHaveLength(2);
    expect(new Set(removals.map(identity)).size).toBe(2);
  });

  it('does not blame the pull request for a removal already present on the base tip', () => {
    const head = MANIFEST(['a.json']);
    const againstMergeBase = snapshotPair(
      'manifest.json',
      'manifest-self',
      MANIFEST(['a.json', 'b.json', 'c.json']),
      head
    );
    const againstBaseTip = new Set(
      snapshotPair('manifest.json', 'manifest-self', MANIFEST(['a.json', 'b.json']), head).map(
        identity
      )
    );
    const kept = againstMergeBase.filter((finding) => againstBaseTip.has(identity(finding)));

    expect(guardedFiles(kept).map((finding) => finding.base)).toEqual(['b.json::jscpd']);
  });
});

describe('gate ratchet — waiver and reporting', () => {
  it('treats an unlabelled pull request as not waived', () => {
    expect(isWaived({ pull_request: { labels: [{ name: 'ci' }] } }, 'gate-relaxation')).toBe(false);
  });

  it('treats the waiver label as a waiver', () => {
    expect(
      isWaived(
        { pull_request: { labels: [{ name: 'ci' }, { name: 'gate-relaxation' }] } },
        'gate-relaxation'
      )
    ).toBe(true);
  });

  it('treats a missing event payload as not waived', () => {
    expect(isWaived({}, 'gate-relaxation')).toBe(false);
  });

  it('renders every finding as a table row', () => {
    const table = formatFindingsTable([
      { file: 'a.json', key: 'k', base: 1, head: 0, rule: 'min', reason: 'threshold weakened' },
    ]);
    expect(table).toContain('FILE');
    expect(table).toContain('a.json');
    expect(table).toContain('threshold weakened');
  });

  it('reports nothing for identical snapshots', () => {
    expect(snapshotPair('.jscpd.json', 'jscpd', JSCPD(75, []), JSCPD(75, []))).toEqual([]);
  });

  // The workflow only refreshes the sticky PR comment when the run leaves a report file behind.
  // Without one, a green run after a reverted relaxation leaves the old weakened-values table up.
  // The `git` calls are served by a stub on PATH: the unit suite runs in the dev container, which
  // ships no git binary, and stubbing keeps the assertion about the report file rather than about
  // whatever the checkout happens to contain.
  it('writes a report file even when no guarded config changed', () => {
    const binDir = mkdtempSync(path.join(workspace, 'stub-bin-'));
    writeFileSync(
      path.join(binDir, 'git'),
      ['#!/bin/sh', 'case "$1" in', '  merge-base) echo deadbeefdeadbeef ;;', 'esac', ''].join(
        '\n'
      ),
      { mode: 0o755 }
    );
    const reportFile = path.join(workspace, `report-${process.hrtime.bigint()}.md`);

    execFileSync(process.execPath, [path.join(REPO_ROOT, 'scripts/ci/check-gate-ratchet.mjs')], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      env: {
        ...process.env,
        PATH: `${binDir}:${process.env.PATH ?? ''}`,
        GATE_RATCHET_REPORT_FILE: reportFile,
        GITHUB_STEP_SUMMARY: '',
      },
    });

    // The stubbed merge-base sha proves the stub answered, so the assertion cannot pass by
    // accident on a machine that happens to have git and a clean diff.
    expect(readFileSync(reportFile, 'utf8')).toContain('no guarded config changed since deadbeef');
  });
});

describe('gate ratchet — manifest integrity', () => {
  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));

  it('guards every file it names, and every named file exists', () => {
    for (const entry of manifest.files) {
      expect(existsSync(path.join(REPO_ROOT, entry.path))).toBe(true);
      for (const dependency of entry.dependsOn ?? []) {
        expect(existsSync(path.join(REPO_ROOT, dependency))).toBe(true);
      }
    }
  });

  it('guards itself against entry removal', () => {
    expect(manifest.files).toContainEqual(
      expect.objectContaining({
        path: 'config/gate-thresholds.manifest.json',
        extract: 'manifest-self',
      })
    );
  });

  it('names every binding gate config the repository enforces', () => {
    expect(manifest.files.map((entry: { path: string }) => entry.path)).toEqual(
      expect.arrayContaining([
        'lighthouse/lighthouserc.mobile.js',
        'lighthouse/lighthouserc.desktop.js',
        'stryker.config.mjs',
        'jest.config.ts',
        'config/metrics-policy.json',
        '.jscpd.json',
        'config/performance-budget.json',
        'tests/load/config.json.dist',
        'tests/load/utils/thresholds-builder.js',
      ])
    );
  });

  it('registers an implemented extractor for every manifest entry', () => {
    const registered = execFileSync(
      process.execPath,
      [
        '--input-type=module',
        '-e',
        "import {EXTRACTORS} from './scripts/ci/gate-ratchet/extractors.mjs';" +
          'process.stdout.write(JSON.stringify(Object.keys(EXTRACTORS)));',
      ],
      { cwd: REPO_ROOT, encoding: 'utf8' }
    );
    expect(JSON.parse(registered)).toEqual(
      expect.arrayContaining(manifest.files.map((entry: { extract: string }) => entry.extract))
    );
  });
});
