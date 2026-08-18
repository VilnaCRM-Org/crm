// @jest-environment @stryker-mutator/jest-runner/jest-env/node

import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';

import { collectMutateFiles, shardMutateFiles } from '../../../scripts/ci/mutation-scope.mjs';

const projectRoot = path.resolve(__dirname, '..', '..', '..');

interface StrykerConfigShape {
  plugins?: string[];
  checkers?: string[];
  disableTypeChecks?: boolean;
  tsconfigFile?: string;
  typescriptChecker?: { prioritizePerformanceOverAccuracy?: boolean };
  jest?: { enableFindRelatedTests?: boolean };
  thresholds?: { high?: number; low?: number; break?: number | null };
  mutate?: string[];
}

const loadStrykerConfig = (configFile: string): StrykerConfigShape => {
  const script =
    `import config from './${configFile}';` + 'process.stdout.write(JSON.stringify(config));';
  const raw = execFileSync(process.execPath, ['--input-type=module', '--eval', script], {
    cwd: projectRoot,
    encoding: 'utf8',
    env: { ...process.env, MUTATION_SHARD_INDEX: '0', MUTATION_SHARD_TOTAL: '4' },
  });
  return JSON.parse(raw) as StrykerConfigShape;
};

const readJson = (relativePath: string): Record<string, unknown> =>
  JSON.parse(fs.readFileSync(path.join(projectRoot, relativePath), 'utf8')) as Record<
    string,
    unknown
  >;

describe('stryker mutant-classification config', () => {
  const base = loadStrykerConfig('stryker.config.mjs');
  const shard = loadStrykerConfig('stryker.shard.config.mjs');

  describe('the TypeScript checker is wired and can actually see type errors', () => {
    it('registers the typescript checker plugin and enables it', () => {
      expect(base.plugins).toContain('@stryker-mutator/typescript-checker');
      expect(base.checkers).toEqual(['typescript']);
    });

    it('keeps disableTypeChecks off so the checker is not blinded by @ts-nocheck', () => {
      expect(base.disableTypeChecks).toBe(false);
    });

    it('points the checker at a tsconfig that exists and covers the mutated sources', () => {
      const tsconfigFile = base.tsconfigFile ?? '';
      expect(fs.existsSync(path.join(projectRoot, tsconfigFile))).toBe(true);

      const tsconfig = readJson(tsconfigFile);
      expect(tsconfig.extends).toBe('./tsconfig.json');
      expect(tsconfig.include).toEqual(['src/**/*']);
    });

    it('pins the checker to the same major as the Stryker core it plugs into', () => {
      const packageJson = readJson('package.json');
      const devDependencies = packageJson.devDependencies as Record<string, string>;
      const major = (range: string): string => /\d+/.exec(range)?.[0] ?? '';

      expect(major(devDependencies['@stryker-mutator/typescript-checker'])).toBe(
        major(devDependencies['@stryker-mutator/core'])
      );
    });
  });

  describe('mutant runs execute only the tests that reach the mutated file', () => {
    it('enables findRelatedTests so a mutant run is not a whole-suite reload', () => {
      expect(base.jest?.enableFindRelatedTests).toBe(true);
    });

    it('groups checker work so type checking does not recompile per mutant', () => {
      expect(base.typescriptChecker?.prioritizePerformanceOverAccuracy).toBe(true);
    });
  });

  describe('the shard config inherits every classification setting', () => {
    it('carries the checker, findRelatedTests, and type-check settings into each shard', () => {
      expect(shard.checkers).toEqual(base.checkers);
      expect(shard.plugins).toEqual(base.plugins);
      expect(shard.disableTypeChecks).toBe(false);
      expect(shard.tsconfigFile).toBe(base.tsconfigFile);
      expect(shard.jest?.enableFindRelatedTests).toBe(true);
    });

    it('leaves the break gate to the merge job while keeping the base band intact', () => {
      expect(base.thresholds?.break).toBe(57);
      expect(shard.thresholds?.break).toBeNull();
    });
  });
});

describe('mutation shard slicing', () => {
  const TOTAL = 8;
  const everyFile: string[] = collectMutateFiles();
  const shards: string[][] = Array.from({ length: TOTAL }, (_unused, index) =>
    shardMutateFiles(TOTAL, index)
  );

  it('covers the whole mutate scope exactly once across every shard', () => {
    const union = shards.flat().sort();
    expect(union).toEqual([...everyFile].sort());
    expect(new Set(union).size).toBe(everyFile.length);
  });

  it('is deterministic, so a rerun of one shard mutates the same files', () => {
    expect(shardMutateFiles(TOTAL, 3)).toEqual(shards[3]);
  });

  it('packs shards tighter than round-robin, since the slowest shard sets the pace', () => {
    const bytes = (files: string[]): number =>
      files.reduce((total, file) => total + fs.statSync(path.join(projectRoot, file)).size, 0);

    const packed = shards.map(bytes);
    const roundRobin = Array.from({ length: TOTAL }, (_unused, index) =>
      bytes(everyFile.filter((_file, position) => position % TOTAL === index))
    );
    const spread = (loads: number[]): number =>
      Math.max(...loads) / (loads.reduce((sum, load) => sum + load, 0) / loads.length);

    expect(spread(packed)).toBeLessThan(spread(roundRobin));
    expect(spread(packed)).toBeLessThan(1.25);
  });

  it('degrades to a single shard holding everything', () => {
    expect(shardMutateFiles(1, 0)).toEqual([...everyFile].sort());
  });
});
