import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

import {
  collectMutateFiles,
  packShards,
  shardMutateFiles,
} from '../../../scripts/ci/mutation-scope.mjs';

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
  mutator?: unknown;
  ignorers?: unknown;
}

interface PackedScope {
  shards: string[][];
  weights: Record<string, number>;
  fourth: string[];
  firstOfConfigTotal: string[];
}

const SHARD_CONFIG_TOTAL = 4;

/**
 * Run a body against the real `mutation-scope.mjs` in a plain Node ESM process: the instrumenter
 * it loads is an ES module the Jest runtime cannot import, and Stryker and the merge load it the
 * same way.
 */
const runScope = <T>(body: string): T => {
  const script =
    "import * as scope from './scripts/ci/mutation-scope.mjs';" +
    `const result = await (async () => { ${body} })();` +
    'process.stdout.write(JSON.stringify(result));';
  const raw = execFileSync(process.execPath, ['--input-type=module', '--eval', script], {
    cwd: projectRoot,
    encoding: 'utf8',
  });
  return JSON.parse(raw) as T;
};

const loadStrykerConfig = (configFile: string): StrykerConfigShape => {
  const script =
    `import config from './${configFile}';` + 'process.stdout.write(JSON.stringify(config));';
  const raw = execFileSync(process.execPath, ['--input-type=module', '--eval', script], {
    cwd: projectRoot,
    encoding: 'utf8',
    env: {
      ...process.env,
      MUTATION_SHARD_INDEX: '0',
      MUTATION_SHARD_TOTAL: String(SHARD_CONFIG_TOTAL),
    },
  });
  return JSON.parse(raw) as StrykerConfigShape;
};

const shard = loadStrykerConfig('stryker.shard.config.mjs');

const readJson = (relativePath: string): Record<string, unknown> =>
  JSON.parse(fs.readFileSync(path.join(projectRoot, relativePath), 'utf8')) as Record<
    string,
    unknown
  >;

describe('stryker mutant-classification config', () => {
  const base = loadStrykerConfig('stryker.config.mjs');

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

  it('counts with the instrumenter options Stryker uses when the config sets none', () => {
    expect(base.mutator).toBeUndefined();
    expect(base.ignorers).toBeUndefined();
  });
});

describe('mutation shard slicing', () => {
  // A cold shard holding more mutants than this is the one the 15-minute kill switch catches: the
  // 24-to-30 change measured a 443-mutant shard killed at 250 tested, and 240 was the cap it set.
  const SHARD_MUTANT_CAP = 240;
  const WORKFLOWS = [
    '.github/workflows/mutation-testing.yml',
    '.github/workflows/mutation-testing-full.yml',
  ];
  const CACHE_TOTAL = /mutation-incremental-shard-\$\{\{ matrix\.index \}\}-of(\d+)-/g;

  const workflowTotals = WORKFLOWS.map((workflow) => {
    const text = fs.readFileSync(path.join(projectRoot, workflow), 'utf8');
    const matrix = /index:\s*\[([\d,\s]+)\]/.exec(text)?.[1] ?? '';
    return {
      indexes: matrix
        .split(',')
        .map((entry) => entry.trim())
        .filter((entry) => entry !== '')
        .map(Number),
      totals: [...text.matchAll(/MUTATION_SHARD_TOTAL=(\d+)/g)].map((match) => Number(match[1])),
      cacheTotals: [...text.matchAll(CACHE_TOTAL)].map((match) => Number(match[1])),
    };
  });
  const TOTAL = workflowTotals[0]?.totals[0] ?? 0;

  const packInChild = (total: number): PackedScope =>
    runScope<PackedScope>(
      `const { shards, weights } = await scope.packMutateShards(${total});` +
        `const fourth = await scope.shardMutateFiles(${total}, 3);` +
        `const firstOfConfigTotal = scope.packShards(weights, ${SHARD_CONFIG_TOTAL})[0];` +
        'return { shards, weights: Object.fromEntries(weights), fourth, firstOfConfigTotal };'
    );

  const packed = packInChild(TOTAL);
  const everyFile: string[] = collectMutateFiles();
  const load = (files: string[]): number =>
    files.reduce((sum, file) => sum + (packed.weights[file] ?? 0), 0);

  it('runs one shard count everywhere the matrix, the totals and the cache keys name it', () => {
    expect(TOTAL).toBeGreaterThan(1);
    for (const { indexes, totals, cacheTotals } of workflowTotals) {
      expect(indexes).toEqual(Array.from({ length: TOTAL }, (_unused, index) => index));
      expect(totals.length).toBeGreaterThanOrEqual(2);
      expect(new Set(totals)).toEqual(new Set([TOTAL]));
      expect(cacheTotals.length).toBeGreaterThanOrEqual(1);
      expect(new Set(cacheTotals)).toEqual(new Set([TOTAL]));
    }
  });

  it('covers the whole mutate scope exactly once across every shard', () => {
    const union = packed.shards.flat().sort();
    expect(packed.shards).toHaveLength(TOTAL);
    expect(union).toEqual([...everyFile].sort());
    expect(new Set(union).size).toBe(everyFile.length);
  });

  it('weighs every file by a counted, non-negative number of mutants', () => {
    expect(Object.keys(packed.weights).sort()).toEqual([...everyFile].sort());
    for (const weight of Object.values(packed.weights)) {
      expect(Number.isInteger(weight)).toBe(true);
      expect(weight).toBeGreaterThanOrEqual(0);
    }
    expect(load(everyFile)).toBeGreaterThan(0);
  });

  it('keeps the heaviest cold shard within the mutant cap the kill switch allows', () => {
    expect(Math.max(...packed.shards.map(load))).toBeLessThanOrEqual(SHARD_MUTANT_CAP);
  });

  it('is deterministic across processes, so every shard job and the merge pack alike', () => {
    expect(packInChild(TOTAL).shards).toEqual(packed.shards);
    expect(packed.fourth).toEqual(packed.shards[3]);
  });

  it('hands each shard config exactly the slice the packing assigns its index', () => {
    expect(shard.mutate).toEqual(packed.firstOfConfigTotal);
  });

  it('merges by the same packing the shards ran, through the one shared entry point', () => {
    const read = (file: string): string => fs.readFileSync(path.join(projectRoot, file), 'utf8');
    const merge = read('scripts/ci/merge-mutation-reports.ts');
    expect(merge).toContain("import { packMutateShards } from './mutation-scope.mjs';");
    expect(merge).toContain('await packMutateShards(total)');
    expect(read('stryker.shard.config.mjs')).toContain('await shardMutateFiles(total, index)');
  });

  describe('counting mutants with the pinned instrumenter', () => {
    const fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mutant-count-'));
    const fixture = (name: string, content: string): string => {
      const file = path.join(fixtureDir, name);
      fs.writeFileSync(file, content);
      return file;
    };
    const sum = 'export const sum = (a: number, b: number): number => a + b;\n';
    const mutated = fixture('mutated.ts', sum);
    const disabled = fixture('disabled.ts', `// Stryker disable next-line all: fixture\n${sum}`);
    const typeOnly = fixture('type-only.ts', 'export type Sum = number;\n');
    const counts = runScope<Record<string, number>>(
      `const counts = await scope.countMutants(${JSON.stringify([mutated, disabled, typeOnly])});` +
        'return Object.fromEntries(counts);'
    );

    afterAll(() => {
      fs.rmSync(fixtureDir, { recursive: true, force: true });
    });

    it('counts the mutants the test runner will execute', () => {
      expect(counts[mutated]).toBeGreaterThan(0);
    });

    it('leaves out the mutants a Stryker disable directive reports as Ignored', () => {
      expect(counts[disabled]).toBe(0);
    });

    it('keeps a file with nothing to mutate in the result at zero', () => {
      expect(counts[typeOnly]).toBe(0);
    });
  });

  describe('longest-processing-time packing', () => {
    const weights = new Map([
      ['e.ts', 1],
      ['c.ts', 4],
      ['a.ts', 7],
      ['d.ts', 3],
      ['b.ts', 5],
    ]);

    it('puts the heaviest remaining file on the lightest shard', () => {
      expect(packShards(weights, 2)).toEqual([
        ['a.ts', 'd.ts'],
        ['b.ts', 'c.ts', 'e.ts'],
      ]);
    });

    it('breaks equal weights by code-unit path order, whatever order the files arrive in', () => {
      const tied = new Map([
        ['b.ts', 2],
        ['B.ts', 2],
        ['a.ts', 2],
      ]);
      expect(packShards(tied, 3)).toEqual([['B.ts'], ['a.ts'], ['b.ts']]);
      expect(packShards(new Map([...tied].reverse()), 3)).toEqual(packShards(tied, 3));
    });

    it('stays within the greedy bound of the mean load plus the heaviest file', () => {
      const many = new Map(
        Array.from({ length: 60 }, (_unused, index) => [`f${index}.ts`, (index * 37) % 23])
      );
      const shards = packShards(many, 7);
      const loads = shards.map((files) =>
        files.reduce((total, file) => total + (many.get(file) ?? 0), 0)
      );
      const mean = loads.reduce((total, value) => total + value, 0) / loads.length;
      expect(shards.flat().sort()).toEqual([...many.keys()].sort());
      expect(Math.max(...loads)).toBeLessThanOrEqual(mean + Math.max(...many.values()));
    });

    it('degrades to a single shard holding everything', () => {
      expect(packShards(weights, 1)).toEqual([['a.ts', 'b.ts', 'c.ts', 'd.ts', 'e.ts']]);
    });
  });

  it.each([0, -1, 2.5, Number.NaN])('refuses %p as a shard total', async (total) => {
    expect(() => packShards(new Map(), total)).toThrow(RangeError);
    await expect(shardMutateFiles(total, 0)).rejects.toThrow(RangeError);
  });

  it.each([-1, TOTAL, TOTAL + 1, 1.5])(`refuses %p as a shard index of ${TOTAL}`, async (index) => {
    await expect(shardMutateFiles(TOTAL, index)).rejects.toThrow(RangeError);
  });

  it('names the offending bound so a misconfigured matrix is diagnosable', async () => {
    await expect(shardMutateFiles(TOTAL, TOTAL)).rejects.toThrow(
      `MUTATION_SHARD_INDEX must be an integer in [0, ${TOTAL}), received ${TOTAL}.`
    );
  });

  it('names the offending total so a misconfigured matrix size is diagnosable', async () => {
    await expect(shardMutateFiles(0, 0)).rejects.toThrow(
      'MUTATION_SHARD_TOTAL must be a positive integer, received 0.'
    );
  });
});
