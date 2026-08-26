// @jest-environment @stryker-mutator/jest-runner/jest-env/node

import fs from 'fs';
import path from 'path';

const projectRoot = path.resolve(__dirname, '..', '..', '..');

const readFile = (relativePath: string): string =>
  fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');

const SEAM = 'src/config/env/preloaded-auth-token.ts';
const SEAM_TYPES = 'src/config/env/types/preloaded-auth-token.ts';
const WINDOW_KEY = '__PRELOADED_AUTH_TOKEN__';
const ENV_TOKEN_VAR = 'REACT_APP_LHCI_PRELOADED_AUTH_TOKEN';
const OPT_IN_FLAG = 'ENABLE_PRELOADED_AUTH_TOKEN_SEED';

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx']);

function walkSource(dir: string, acc: string[] = []): string[] {
  for (const entry of fs.readdirSync(path.join(projectRoot, dir))) {
    const relative = path.join(dir, entry);
    if (fs.statSync(path.join(projectRoot, relative)).isDirectory()) walkSource(relative, acc);
    else if (SOURCE_EXTENSIONS.has(path.extname(entry))) acc.push(relative);
  }
  return acc;
}

const sourceFilesMentioning = (identifier: string): string[] =>
  walkSource('src').filter((file) => readFile(file).includes(identifier));

describe('preloaded-auth-token seed gate (issue #158)', () => {
  it('confines both seed reads and the guard to a single foldable function', () => {
    const seam = readFile(SEAM);
    const guardIndex = seam.indexOf(`process.env.NODE_ENV === 'production'`);
    const optInIndex = seam.indexOf(`process.env.${OPT_IN_FLAG} !== 'true'`);

    expect(guardIndex).toBeGreaterThan(-1);
    expect(optInIndex).toBeGreaterThan(guardIndex);
    // Both reads must sit after the guard inside the same method: a helper method or a
    // cross-module call is not dead-code-eliminated, and the identifiers would ship.
    expect(seam.indexOf(WINDOW_KEY)).toBeGreaterThan(optInIndex);
    expect(seam.indexOf(ENV_TOKEN_VAR)).toBeGreaterThan(optInIndex);
    // Anchored to line starts so a mention inside the file's own comments cannot pad the count.
    // `#name()` carries no accessibility modifier, so it would slip past the count while still
    // being a helper the bundler leaves in place — ban it outright.
    expect(seam.match(/^\s*(?:public|private|protected)\s/gm)).toHaveLength(1);
    expect(seam).not.toMatch(/^\s*#/m);
  });

  it('keeps the seed identifiers out of every other source file', () => {
    expect(sourceFilesMentioning(WINDOW_KEY).sort()).toEqual([SEAM, SEAM_TYPES].sort());
    expect(sourceFilesMentioning(ENV_TOKEN_VAR)).toEqual([SEAM]);
    expect(sourceFilesMentioning(OPT_IN_FLAG)).toEqual([SEAM]);
  });

  it('keeps the token key declared so the bundler always has a value to inline', () => {
    // Deleting the key would leave `process.env.REACT_APP_LHCI_PRELOADED_AUTH_TOKEN` unreplaced,
    // which is a runtime `process` read in a dev build. check-env-sync only enforces parity
    // between the two files, so neither gate would notice both losing the line together.
    const declaration = new RegExp(`^${ENV_TOKEN_VAR}=`, 'm');

    expect(readFile('.env')).toMatch(declaration);
    expect(readFile('.env.example')).toMatch(declaration);
  });

  it('defines the opt-in flag for the bundler so the guard folds instead of throwing', () => {
    const rsbuildConfig = readFile('rsbuild.config.ts');
    const defineIndex = rsbuildConfig.indexOf(`'process.env.${OPT_IN_FLAG}'`);
    const optInReadIndex = rsbuildConfig.indexOf(`process.env.${OPT_IN_FLAG} ??`);
    const loadEnvIndex = rsbuildConfig.indexOf('loadEnv(');

    expect(defineIndex).toBeGreaterThan(-1);
    // loadEnv merges every key of the `.env*` files into process.env, prefixed or not, so
    // reading the flag afterwards would let an untracked `.env.local` compile the seam in.
    expect(optInReadIndex).toBeGreaterThan(-1);
    expect(optInReadIndex).toBeLessThan(loadEnvIndex);
    expect(rsbuildConfig).not.toContain(`'process.env.${ENV_TOKEN_VAR}'`);
  });

  it('never hands the deployable production image the seed', () => {
    // Sliced on the `FROM … AS <stage>` headers, never on the banner comments: a renamed
    // banner would make indexOf return -1 and every assertion below would pass against an
    // empty string while the real stage carried the seed.
    const dockerfile = readFile('Dockerfile');
    const stage = (name: string): string => {
      const start = dockerfile.search(new RegExp(`^FROM .+ AS ${name}$`, 'm'));
      expect(start).toBeGreaterThan(-1);
      const rest = dockerfile.slice(start + 1);
      const end = rest.search(/^FROM /m);

      return end === -1 ? rest : rest.slice(0, end);
    };

    expect(stage('build')).not.toContain(ENV_TOKEN_VAR);
    expect(stage('build')).not.toContain(OPT_IN_FLAG);
    expect(stage('build-test-harness')).toContain(`ENV ${OPT_IN_FLAG}=true`);
    expect(stage('production')).toContain('COPY --from=build --chown=node:node');
    expect(stage('production')).not.toContain('build-test-harness');
    expect(stage('test-harness')).toContain('COPY --from=build-test-harness');
  });

  it('builds the ephemeral harness image, not the deployable one, for the test stack', () => {
    const dockerCompose = readFile('docker-compose.test.yml');

    expect(dockerCompose).toContain('target: test-harness');
    expect(dockerCompose).not.toContain('target: production');
  });

  it('scans the emitted bundle in CI rather than the build configuration source', () => {
    const workflow = readFile('.github/workflows/security-testing.yml');
    const makefile = readFile('Makefile');

    expect(workflow).toContain('make check-auth-seed-gate');
    expect(makefile).toContain('--expect absent');
    expect(makefile).toContain('--expect present');
  });
});
