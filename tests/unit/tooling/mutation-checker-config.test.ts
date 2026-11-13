import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

import {
  collectMutateFiles,
  fanOutFactor,
  packingWeights,
  packShards,
  shardMutateFiles,
} from '../../../scripts/ci/mutation-scope.mjs';

const projectRoot = path.resolve(__dirname, '..', '..', '..');

interface StrykerConfigShape {
  plugins?: string[];
  checkers?: string[];
  disableTypeChecks?: boolean;
  timeoutMS?: number;
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
  mutants: Record<string, number>;
  scored: Record<string, number>;
  unsharded: string[];
  runnable: Record<string, number>;
  fourth: string[];
  firstOfConfigTotal: string[];
}

interface MutantCount {
  runnable: number;
  scored: number;
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

    it('gives a mutant run time to load every related test file before it calls it a hang', () => {
      expect(base.timeoutMS).toBeGreaterThanOrEqual(60_000);
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
      expect(shard.timeoutMS).toBe(base.timeoutMS);
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
      `const packing = await scope.packMutateShards(${total});` +
        'const { shards, weights, unsharded } = packing;' +
        `const fourth = await scope.shardMutateFiles(${total}, 3);` +
        `const configTotal = ${SHARD_CONFIG_TOTAL};` +
        'const firstOfConfigTotal = scope.packShards(weights, configTotal, packing.mutants)[0];' +
        'const counts = await scope.countMutants(unsharded);' +
        'const runnable = Object.fromEntries([...counts].map(([f, c]) => [f, c.runnable]));' +
        'const scored = Object.fromEntries(' +
        '  [...weights.keys()].map((f) => [f, packing.counts.get(f).scored])' +
        ');' +
        'const mutants = Object.fromEntries(packing.mutants);' +
        'return { shards, weights: Object.fromEntries(weights), mutants, scored, unsharded,' +
        ' runnable, fourth, firstOfConfigTotal };'
    );

  const packed = packInChild(TOTAL);
  const everyFile: string[] = collectMutateFiles();
  const scoredLoad = (files: string[]): number =>
    files.reduce((sum, file) => sum + Math.max(1, packed.scored[file] ?? 0), 0);

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

  it('accounts for the whole mutate scope once, in a shard or in the unsharded list', () => {
    const sharded = packed.shards.flat();
    expect(packed.shards).toHaveLength(TOTAL);
    expect([...sharded, ...packed.unsharded].sort()).toEqual([...everyFile].sort());
    expect(new Set([...sharded, ...packed.unsharded]).size).toBe(everyFile.length);
    expect(sharded.sort()).toEqual(Object.keys(packed.weights).sort());
  });

  it('weighs every sharded file by a positive whole mutant-run cost', () => {
    for (const weight of Object.values(packed.weights)) {
      expect(Number.isInteger(weight)).toBe(true);
      expect(weight).toBeGreaterThanOrEqual(fanOutFactor({ logic: 0, component: 0 }));
    }
  });

  it('leaves only files without a runnable mutant out of every shard', () => {
    expect(packed.unsharded.length).toBeGreaterThan(0);
    expect(Object.keys(packed.runnable).sort()).toEqual([...packed.unsharded].sort());
    expect(new Set(Object.values(packed.runnable))).toEqual(new Set([0]));
    expect(packed.unsharded).toEqual(
      expect.arrayContaining([
        'src/modules/user/index.ts',
        'src/routes/route-paths.ts',
        'src/config/env/index.ts',
      ])
    );
  });

  it('spreads the files, so no shard draws a pile of cheap files and their related tests', () => {
    const counts = packed.shards.map((files) => files.length);
    const mean = counts.reduce((total, count) => total + count, 0) / counts.length;
    expect(Math.min(...counts)).toBeGreaterThan(0);
    expect(Math.max(...counts)).toBeLessThanOrEqual(2 * mean);
  });

  it('holds every shard to 1.05x the mean runnable mutants, so slow tests cannot pile up', () => {
    const held = (files: string[]): number =>
      files.reduce((sum, file) => sum + (packed.mutants[file] ?? 0), 0);
    const mean = held(packed.shards.flat()) / packed.shards.length;
    expect(Math.max(...packed.shards.map(held))).toBeLessThanOrEqual(Math.ceil(1.05 * mean));
  });

  it('keeps the heaviest cold shard within the mutant cap the kill switch allows', () => {
    expect(Math.max(...packed.shards.map(scoredLoad))).toBeLessThanOrEqual(SHARD_MUTANT_CAP);
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
    const sum = 'export function sum(a: number, b: number): number {\n  return a + b;\n}\n';
    const inFunction = fixture('in-function.ts', sum);
    const disabled = fixture('disabled.ts', `// Stryker disable all: fixture\n${sum}`);
    const typeOnly = fixture('type-only.ts', 'export type Sum = number;\n');
    const moduleLevel = fixture('module-level.ts', "export const LIST = ['a'];\n");
    const arrow = fixture(
      'arrow.ts',
      'export const sum = (a: number, b: number): number => a + b;\n'
    );
    const instanceField = fixture(
      'instance-field.ts',
      "export class ListProvider {\n  private readonly items = ['a'];\n}\n"
    );
    const staticField = fixture(
      'static-field.ts',
      "export class ListProvider {\n  static readonly items = ['a'];\n}\n"
    );
    const files = [inFunction, disabled, typeOnly, moduleLevel, arrow, instanceField, staticField];
    const counts = runScope<Record<string, MutantCount>>(
      `const counts = await scope.countMutants(${JSON.stringify(files)});` +
        'return Object.fromEntries(counts);'
    );

    afterAll(() => {
      fs.rmSync(fixtureDir, { recursive: true, force: true });
    });

    it('scores the mutants inside a function body: the block and the operator', () => {
      expect(counts[inFunction]).toEqual({ runnable: 2, scored: 2 });
    });

    it('leaves out the mutants a Stryker disable directive reports as Ignored', () => {
      expect(counts[disabled]).toEqual({ runnable: 0, scored: 0 });
    });

    it('keeps a file with nothing to mutate in the result at zero', () => {
      expect(counts[typeOnly]).toEqual({ runnable: 0, scored: 0 });
    });

    it('counts a module-level literal as runnable but static, so it scores nothing', () => {
      expect(counts[moduleLevel]).toEqual({ runnable: 2, scored: 0 });
    });

    it('scores the body of a module-level arrow but not the mutant replacing the arrow', () => {
      expect(counts[arrow]).toEqual({ runnable: 2, scored: 1 });
    });

    it('scores an instance property initializer, run when a test constructs the class', () => {
      expect(counts[instanceField]).toEqual({ runnable: 2, scored: 2 });
    });

    it('treats a static property initializer as static', () => {
      expect(counts[staticField]).toEqual({ runnable: 2, scored: 0 });
    });
  });

  describe('packing weights', () => {
    const weights = packingWeights(
      new Map([
        ['barrel.ts', { runnable: 0, scored: 0 }],
        ['styles.ts', { runnable: 3, scored: 0 }],
        ['service.ts', { runnable: 5, scored: 4 }],
      ]),
      new Map([
        ['barrel.ts', { logic: 90, component: 0 }],
        ['service.ts', { logic: 30, component: 2 }],
      ])
    );

    it('weighs a file by its runnable mutants plus its dry run, times its fan-out', () => {
      expect(weights.get('service.ts')).toBe((5 + 1) * (4 + 30 + 3 * 2));
    });

    it('charges a file with no related test the run overhead alone, dry run included', () => {
      expect(weights.get('styles.ts')).toBe((3 + 1) * 4);
    });

    it('leaves a file without a runnable mutant out of the packing', () => {
      expect([...weights.keys()]).toEqual(['styles.ts', 'service.ts']);
    });

    it.each([
      [{ logic: 0, component: 0 }, 4],
      [{ logic: 37, component: 0 }, 41],
      [{ logic: 0, component: 1 }, 7],
      [{ logic: 2, component: 3 }, 15],
    ])('charges %p related tests %p logic-test loads per mutant', (related, factor) => {
      expect(fanOutFactor(related)).toBe(factor);
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

    it('spreads equally light files one per shard before stacking any', () => {
      const light = new Map(['a.ts', 'b.ts', 'c.ts', 'd.ts', 'e.ts', 'f.ts'].map((f) => [f, 1]));
      expect(packShards(light, 3)).toEqual([
        ['a.ts', 'd.ts'],
        ['b.ts', 'e.ts'],
        ['c.ts', 'f.ts'],
      ]);
    });

    it('skips a lighter shard whose mutants would pass 1.05x the mean', () => {
      const weights = new Map([
        ['a.ts', 100],
        ['b.ts', 10],
        ['c.ts', 10],
      ]);
      const mutants = new Map([
        ['a.ts', 1],
        ['b.ts', 50],
        ['c.ts', 50],
      ]);

      expect(packShards(weights, 2)).toEqual([['a.ts'], ['b.ts', 'c.ts']]);
      expect(packShards(weights, 2, mutants)).toEqual([['a.ts', 'c.ts'], ['b.ts']]);
    });

    it('stops piling cheap files on one shard at twice the mean file count', () => {
      const tiny = Array.from({ length: 10 }, (_unused, index) => [`t${index}.ts`, 1] as const);
      const weights = new Map([['a.ts', 100], ['b.ts', 100], ...tiny]);

      const shards = packShards(weights, 3);

      expect(shards.map((files) => files.length)).toEqual([2, 2, 8]);
      expect(shards.flat().sort()).toEqual([...weights.keys()].sort());
    });

    it('falls back to the shard holding the fewest mutants when no shard has room', () => {
      const one = new Map([
        ['a.ts', 5],
        ['b.ts', 1],
      ]);
      const mutants = new Map([
        ['a.ts', 1],
        ['b.ts', 99],
      ]);

      expect(packShards(one, 2, mutants)).toEqual([['a.ts'], ['b.ts']]);
    });

    it('overshoots the mutant cap on the shard with the fewest mutants, not the lightest', () => {
      const weights = new Map([
        ['a.ts', 100],
        ['b.ts', 10],
        ['c.ts', 5],
      ]);
      const mutants = new Map([
        ['a.ts', 1],
        ['b.ts', 50],
        ['c.ts', 60],
      ]);

      expect(packShards(weights, 2, mutants)).toEqual([['a.ts', 'c.ts'], ['b.ts']]);
    });

    it('keeps an overshooting file off a shard already at the file cap', () => {
      const weights = new Map([
        ['a.ts', 6],
        ['b.ts', 2],
        ['c.ts', 3],
        ['d.ts', 2],
        ['e.ts', 2],
        ['f.ts', 1],
        ['g.ts', 3],
      ]);
      const mutants = new Map([
        ['a.ts', 5],
        ['b.ts', 2],
        ['c.ts', 7],
        ['d.ts', 1],
        ['e.ts', 1],
        ['f.ts', 3],
        ['g.ts', 7],
      ]);

      expect(packShards(weights, 4, mutants)).toEqual([
        ['a.ts', 'f.ts'],
        ['c.ts'],
        ['g.ts'],
        ['b.ts', 'd.ts', 'e.ts'],
      ]);
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
