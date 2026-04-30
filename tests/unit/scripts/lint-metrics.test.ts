import { execFileSync } from 'child_process';
import { chmodSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';

const repoRoot = path.resolve(__dirname, '../../..');
const lintMetricsScript = path.join(repoRoot, 'scripts/lint-metrics.sh');
const metricsPolicy = path.join(repoRoot, 'config/metrics-policy.json');

const baseEnv = {
  RCA_VERSION: '0.0.25',
  RCA_SCOPE: 'src/',
  RCA_EXCLUDES: '**/node_modules/** **/dist/** **/coverage/** **/.storybook/** **/tests/**',
  METRICS_POLICY: metricsPolicy,
};

const fakeRcaOutput = {
  name: 'src/example.ts',
  kind: 'unit',
  metrics: {
    loc: { sloc: 10, lloc: 8, ploc: 9, cloc: 2, blank: 1 },
    nom: { functions: 1, closures: 0 },
    halstead: {
      volume: 100,
      bugs: 0.01,
      n1: 1,
      N1: 2,
      n2: 3,
      N2: 4,
      length: 6,
      estimated_program_length: 5,
      vocabulary: 4,
      difficulty: 1,
      level: 1,
      effort: 100,
      time: 10,
      purity_ratio: 1,
    },
    mi: { mi_visual_studio: 80, mi_original: 80, mi_sei: 80 },
    wmc: { classes_sum: 0 },
    npm: { classes: 0, classes_average: 0, interfaces: 0 },
    npa: { classes: 0, classes_average: 0, interfaces: 0 },
  },
  spaces: [
    {
      kind: 'function',
      name: 'example',
      start_line: 1,
      metrics: {
        cyclomatic: { sum: 1 },
        cognitive: { sum: 1 },
        abc: { magnitude: 1 },
        nargs: { functions_max: 1 },
        nexits: { average: 1 },
        loc: { lloc: 3, ploc: 4, sloc: 5 },
        halstead: {
          volume: 50,
          bugs: 0.01,
          n1: 1,
          N1: 2,
          n2: 3,
          N2: 4,
          length: 6,
          estimated_program_length: 5,
          vocabulary: 4,
          difficulty: 1,
          level: 1,
          effort: 100,
          time: 10,
          purity_ratio: 1,
        },
      },
    },
  ],
};

const createFakeRcaBinary = (directory: string, output: unknown = fakeRcaOutput): string => {
  const binaryPath = path.join(directory, 'fake-rca');
  const outputPath = path.join(directory, 'fake-rca.json');
  writeFileSync(outputPath, `${JSON.stringify(output)}\n`);
  writeFileSync(binaryPath, `#!/bin/sh\ncat "${outputPath}"\n`);
  chmodSync(binaryPath, 0o755);
  return binaryPath;
};

describe('scripts/lint-metrics.sh', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(path.join(tmpdir(), 'lint-metrics-test-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('prints passing hard-fail metric values with Makefile supplied policy', () => {
    const output = execFileSync('sh', [lintMetricsScript], {
      cwd: repoRoot,
      env: {
        ...process.env,
        ...baseEnv,
        RCA_BIN: createFakeRcaBinary(tempDir),
      },
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'inherit'],
    });

    expect(output).toContain('rust-code-analysis: all hard checks pass');
    expect(output).toContain('Cyclomatic Complexity');
    expect(output).toContain('Interface Public Attributes');
    expect(output).toContain(
      'Scope: src/ | selected hard-fail policy thresholds shown; all hard-fail thresholds enforced.'
    );
  });

  it('fails early with a jq-specific error before validating the policy JSON', () => {
    let thrownError: unknown;

    try {
      execFileSync('/bin/sh', [lintMetricsScript], {
        cwd: repoRoot,
        env: {
          ...process.env,
          ...baseEnv,
          PATH: tempDir,
        },
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });
    } catch (error) {
      thrownError = error;
    }

    expect(thrownError).toBeDefined();

    const stderr =
      thrownError && typeof thrownError === 'object' && 'stderr' in thrownError
        ? String(thrownError.stderr)
        : '';

    expect(stderr).toMatch(/ERROR: jq is required by lint-metrics but was not found in PATH/);
  });

  it('fails when the analyzer exits successfully but produces no JSON objects', () => {
    const emptyBinaryPath = path.join(tempDir, 'fake-rca-empty');
    writeFileSync(emptyBinaryPath, '#!/bin/sh\nexit 0\n');
    chmodSync(emptyBinaryPath, 0o755);

    expect(() => {
      execFileSync('/bin/sh', [lintMetricsScript], {
        cwd: repoRoot,
        env: {
          ...process.env,
          ...baseEnv,
          RCA_BIN: emptyBinaryPath,
        },
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });
    }).toThrow(/ERROR: rust-code-analysis produced no JSON output objects/);
  });

  it('fails with a schema error when a policy section is not an object', () => {
    const malformedPolicyPath = path.join(tempDir, 'metrics-policy.json');
    writeFileSync(malformedPolicyPath, JSON.stringify({ hard: 1, review: {} }));

    let thrownError: unknown;

    try {
      execFileSync('/bin/sh', [lintMetricsScript], {
        cwd: repoRoot,
        env: {
          ...process.env,
          ...baseEnv,
          METRICS_POLICY: malformedPolicyPath,
          RCA_BIN: createFakeRcaBinary(tempDir),
        },
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });
    } catch (error) {
      thrownError = error;
    }

    expect(thrownError).toBeDefined();

    const stderr =
      thrownError && typeof thrownError === 'object' && 'stderr' in thrownError
        ? String(thrownError.stderr)
        : '';

    expect(stderr).toContain('ERROR: METRICS_POLICY does not satisfy schema');
    expect(stderr).toContain('non-object section: hard: got number');
  });
});
