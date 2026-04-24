import { execFileSync } from 'child_process';
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';

const repoRoot = path.resolve(__dirname, '../../..');
const lintMetricsScript = path.join(repoRoot, 'scripts/lint-metrics.sh');
const dockerComposePath = path.join(repoRoot, 'docker-compose.yml');
const storyPath = path.join(
  repoRoot,
  'specs/implementation-artifacts/stories/' +
    '2-2-baseline-compliance-verification-required-check-registration.md'
);

const baseEnv = {
  RCA_VERSION: '0.0.25',
  RCA_SCOPE: 'src/',
  RCA_EXCLUDES: '**/node_modules/** **/dist/** **/coverage/** **/.storybook/** **/tests/**',
  CYCLOMATIC_MAX: '20',
  COGNITIVE_MAX: '24',
  ABC_MAGNITUDE_MAX: '17',
  NARGS_FUNCTION_MAX: '5',
  NARGS_CLOSURE_MAX: '3',
  NEXITS_MAX: '15',
  LLOC_FUNCTION_MAX: '37',
  PLOC_FUNCTION_MAX: '145',
  SLOC_FUNCTION_MAX: '157',
  HALSTEAD_VOLUME_FUNCTION_MAX: '5558',
  HALSTEAD_BUGS_FUNCTION_MAX: '0.94',
  NOM_FUNCTIONS_FILE_MAX: '10',
  NOM_CLOSURES_FILE_MAX: '9',
  NOM_TOTAL_FILE_MAX: '15',
  LLOC_FILE_MAX: '120',
  PLOC_FILE_MAX: '366',
  SLOC_FILE_MAX: '372',
  HALSTEAD_VOLUME_FILE_MAX: '12427',
  HALSTEAD_BUGS_FILE_MAX: '1.58',
  MI_VISUAL_STUDIO_MIN: '15',
  CLASS_WMC_MAX: '30',
  CLASS_NPM_MAX: '8',
  CLASS_NPA_MAX: '2',
  CLASS_COA_MAX: '0.60',
  CLASS_CDA_MAX: '0.25',
  INTERFACE_NPM_MAX: '10',
  INTERFACE_NPA_MAX: '15',
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

const createFakeRcaBinary = (directory: string): string => {
  const binaryPath = path.join(directory, 'fake-rca');
  writeFileSync(binaryPath, `#!/bin/sh\nprintf '%s\\n' '${JSON.stringify(fakeRcaOutput)}'\n`);
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
    expect(output).toContain('Scope: src/ | hard-fail policy thresholds enforced.');
  });

  it('is listed in the required-check registration story file list', () => {
    expect(readFileSync(storyPath, 'utf8')).toContain('tests/unit/scripts/lint-metrics.test.ts');
  });

  it('keeps the rca service independent from the external app network', () => {
    const dockerCompose = readFileSync(dockerComposePath, 'utf8');

    expect(dockerCompose).toContain('  rca:\n');
    expect(dockerCompose).not.toContain(
      '  rca:\n    profiles: [tools]\n    build:\n      context: .\n' +
        '      target: rca\n    volumes:\n      - .:/app\n' +
        '    networks:\n      - crm-network\n'
    );
  });
});
