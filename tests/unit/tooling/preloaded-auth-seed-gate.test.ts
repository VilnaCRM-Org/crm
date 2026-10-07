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

// Sliced on the `FROM … AS <stage>` headers, never on the banner comments: a renamed banner
// would make indexOf return -1 and every assertion would pass against an empty string.
const dockerStage = (name: string): string => {
  const dockerfile = readFile('Dockerfile');
  const start = dockerfile.search(new RegExp(`^FROM .+ AS ${name}$`, 'm'));
  expect(start).toBeGreaterThan(-1);
  const rest = dockerfile.slice(start + 1);
  const end = rest.search(/^FROM /m);

  return end === -1 ? rest : rest.slice(0, end);
};

const makeRecipe = (makefile: string, target: string): string => {
  const start = makefile.search(new RegExp(`^${target}:`, 'm'));
  expect(start).toBeGreaterThan(-1);
  const rest = makefile.slice(start);
  const end = rest.search(/\n(?=[A-Za-z0-9_.-]+:)/);

  return end === -1 ? rest : rest.slice(0, end);
};

const DEMO_SEAM = 'src/config/env/sandbox-demo-session.ts';
const DEMO_OPT_IN_FLAG = 'ENABLE_SANDBOX_DEMO';
const DEMO_LITERALS = ['demo@vilnacrm.com', 'Demo1234', 'sandbox-demo-session-token'];

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
    // which is a runtime `process` read in a dev build. .env.example is the only tracked copy
    // (issue #142) and check-env-sync only enforces parity of the local .env against it, so no
    // other gate would notice the template losing the line.
    const declaration = new RegExp(`^${ENV_TOKEN_VAR}=`, 'm');

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
    expect(dockerStage('build')).not.toContain(ENV_TOKEN_VAR);
    expect(dockerStage('build')).not.toContain(OPT_IN_FLAG);
    expect(dockerStage('build-test-harness')).toContain(`ENV ${OPT_IN_FLAG}=true`);
    expect(dockerStage('production')).toContain('COPY --from=build --chown=node:node');
    expect(dockerStage('production')).not.toContain('build-test-harness');
    expect(dockerStage('test-harness')).toContain('COPY --from=build-test-harness');
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

  it('runs only on pull requests, not on the CodeQL push and schedule baseline', () => {
    const workflow = readFile('.github/workflows/security-testing.yml');
    const job = workflow.slice(workflow.indexOf('  auth-seed-gate:'));

    expect(job).toMatch(/^ {4}if: github\.event_name == 'pull_request'$/m);
    expect(job.indexOf("if: github.event_name == 'pull_request'")).toBeLessThan(
      job.indexOf('runs-on:')
    );
  });
});

describe('sandbox demo-session seam (issue #309)', () => {
  it('confines the guard, the demo credentials and the demo token to one foldable method', () => {
    const seam = readFile(DEMO_SEAM);
    const guardIndex = seam.indexOf(`process.env.NODE_ENV === 'production'`);
    const optInIndex = seam.indexOf(`process.env.${DEMO_OPT_IN_FLAG} !== 'true'`);

    expect(guardIndex).toBeGreaterThan(-1);
    expect(optInIndex).toBeGreaterThan(guardIndex);
    DEMO_LITERALS.forEach((literal) => {
      expect([literal, seam.indexOf(`'${literal}'`) > optInIndex]).toEqual([literal, true]);
    });
    expect(seam.match(/^\s*(?:public|private|protected)\s/gm)).toHaveLength(1);
    expect(seam).not.toMatch(/^\s*#/m);
  });

  it('keeps the demo identifiers out of every other source file', () => {
    [DEMO_OPT_IN_FLAG, ...DEMO_LITERALS].forEach((identifier) => {
      expect([identifier, sourceFilesMentioning(identifier)]).toEqual([identifier, [DEMO_SEAM]]);
    });
  });

  it('scans the emitted bundle for exactly the literals the seam compiles in', () => {
    const gateScript = readFile('scripts/ci/check-auth-seed-gate.mjs');

    expect(gateScript).toContain(`'${DEMO_OPT_IN_FLAG}'`);
    DEMO_LITERALS.forEach((literal) => {
      expect([literal, gateScript.includes(`'${literal}'`)]).toEqual([literal, true]);
    });
  });

  it('reads the opt-in before loadEnv, defines it, and gates the 404.html fallback on it', () => {
    const rsbuildConfig = readFile('rsbuild.config.ts');
    const optInReadIndex = rsbuildConfig.indexOf(`process.env.${DEMO_OPT_IN_FLAG} ??`);

    expect(optInReadIndex).toBeGreaterThan(-1);
    expect(optInReadIndex).toBeLessThan(rsbuildConfig.indexOf('loadEnv('));
    expect(rsbuildConfig).toContain(`'process.env.${DEMO_OPT_IN_FLAG}': JSON.stringify(`);
    expect(rsbuildConfig).toMatch(
      /sandboxDemoOptIn === 'true' \? \[pluginSpaFallbackDocument\(\)\] : \[\]/
    );
    expect(readFile('.env.example')).not.toContain(DEMO_OPT_IN_FLAG);
  });

  it('opts only the sandbox build stage in, and ships it only from the sandbox target', () => {
    expect(dockerStage('build-sandbox')).toContain(`ENV ${DEMO_OPT_IN_FLAG}=true`);
    expect(dockerStage('build-sandbox')).not.toContain(OPT_IN_FLAG);
    expect(dockerStage('build-sandbox')).not.toContain(ENV_TOKEN_VAR);
    expect(dockerStage('build')).not.toContain(DEMO_OPT_IN_FLAG);
    expect(dockerStage('build-test-harness')).not.toContain(DEMO_OPT_IN_FLAG);
    expect(dockerStage('production')).not.toContain('build-sandbox');
    expect(dockerStage('test-harness')).not.toContain('build-sandbox');
    expect(dockerStage('sandbox')).toContain('COPY --from=build-sandbox --chown=node:node');
    expect(readFile('Dockerfile')).toMatch(/^FROM serve-base AS sandbox$/m);
  });

  it('builds and scans the sandbox target as the positive control', () => {
    const makefile = readFile('Makefile');

    expect(makeRecipe(makefile, 'build-out-sandbox')).toContain('--target sandbox');
    expect(makeRecipe(makefile, 'build-out')).not.toContain('--target sandbox');
    expect(makeRecipe(makefile, 'check-auth-seed-gate')).toContain('--target sandbox');
    expect(makeRecipe(makefile, 'check-auth-seed-gate')).toContain(
      '--expect present --seam sandbox-demo'
    );
  });
});
