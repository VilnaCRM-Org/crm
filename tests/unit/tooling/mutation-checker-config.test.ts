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

  describe('the TypeScript checker wiring a regression could silently undo', () => {
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
      const checkerMajor = major(devDependencies['@stryker-mutator/typescript-checker'] ?? '');
      const coreMajor = major(devDependencies['@stryker-mutator/core'] ?? '');

      expect(checkerMajor).not.toBe('');
      expect(coreMajor).not.toBe('');
      expect(checkerMajor).toBe(coreMajor);
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
      expect(shard.typescriptChecker?.prioritizePerformanceOverAccuracy).toBe(
        base.typescriptChecker?.prioritizePerformanceOverAccuracy
      );
      expect(shard.jest?.enableFindRelatedTests).toBe(true);
    });

    it('leaves the break gate to the merge job while keeping the base band intact', () => {
      expect(shard.thresholds?.break).toBeNull();
    });
  });

  describe('the enforced floor only ever ratchets up', () => {
    // Ratcheted from the 57 first derived when honest classification landed, through 90, to the
    // 100 the suite now scores: every mutant Stryker classifies is detected, every provably
    // equivalent one is either refactored away or annotated with its proof. It may never move down.
    const MEASURED_FLOOR = 100;

    it('never drops below the floor derived from that measurement', () => {
      expect(base.thresholds?.break).toBeGreaterThanOrEqual(MEASURED_FLOOR);
    });

    it('keeps the band coherent so break can climb toward high', () => {
      const { high = 0, low = 0, break: floor = 0 } = base.thresholds ?? {};
      expect(floor).toBeLessThanOrEqual(low);
      expect(low).toBeLessThanOrEqual(high);
      expect(high).toBe(100);
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

    expect(spread(packed)).toBeLessThanOrEqual(spread(roundRobin));
  });

  it('degrades to a single shard holding everything', () => {
    expect(shardMutateFiles(1, 0)).toEqual([...everyFile].sort());
  });

  it.each([0, -1, 2.5, Number.NaN])('refuses %p as a shard total', (total) => {
    expect(() => shardMutateFiles(total, 0)).toThrow(RangeError);
  });

  it.each([-1, 8, 9, 1.5])('refuses %p as a shard index of 8', (index) => {
    expect(() => shardMutateFiles(TOTAL, index)).toThrow(RangeError);
  });

  it('names the offending bound so a misconfigured matrix is diagnosable', () => {
    expect(() => shardMutateFiles(TOTAL, TOTAL)).toThrow(
      `MUTATION_SHARD_INDEX must be an integer in [0, ${TOTAL}), received ${TOTAL}.`
    );
  });
});
