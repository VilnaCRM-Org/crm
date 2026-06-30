import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { type MutationReport, scoreReports } from './mutation-report';

const SHARD_FILE = /^mutation-shard-\d+\.json$/;
const REPORTS_DIR = resolve(process.cwd(), 'reports', 'mutation');

function loadShardReports(dir: string): { name: string; report: MutationReport }[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch (error) {
    throw new Error(`Could not read mutation report directory "${dir}": ${String(error)}`);
  }

  return entries
    .filter((name) => SHARD_FILE.test(name))
    .sort((a, b) => a.localeCompare(b))
    .map((name) => {
      const raw = readFileSync(join(dir, name), 'utf8');
      try {
        return { name, report: JSON.parse(raw) as MutationReport };
      } catch (error) {
        throw new Error(`Mutation report "${name}" is not valid JSON: ${String(error)}`);
      }
    });
}

async function resolveBreakThreshold(): Promise<number> {
  const { default: base } = (await import('../../stryker.config.mjs')) as {
    default: { thresholds?: { break?: number | null } };
  };
  const breakThreshold = base.thresholds?.break;
  if (typeof breakThreshold !== 'number') {
    throw new TypeError(
      'stryker.config.mjs has no numeric thresholds.break; refusing to gate without a threshold.'
    );
  }
  return breakThreshold;
}

async function main(): Promise<void> {
  const dir = REPORTS_DIR;

  const expectedShards = Number.parseInt(process.env.MUTATION_SHARD_TOTAL ?? '', 10);
  if (!Number.isInteger(expectedShards) || expectedShards <= 0) {
    throw new Error(
      'MUTATION_SHARD_TOTAL must be a positive integer so the gate can verify every shard.'
    );
  }

  const shards = loadShardReports(dir);
  if (shards.length !== expectedShards) {
    throw new Error(
      `Expected ${expectedShards} shard reports but found ${shards.length} (${
        shards.map((s) => s.name).join(', ') || 'none'
      }). A missing shard must not pass the gate vacuously.`
    );
  }

  const seen = new Set(shards.map((s) => Number.parseInt(/\d+/.exec(s.name)?.[0] ?? '-1', 10)));
  for (let i = 0; i < expectedShards; i += 1) {
    if (!seen.has(i)) {
      throw new Error(`Mutation shard ${i} of ${expectedShards} is missing from "${dir}".`);
    }
  }

  const breakThreshold = await resolveBreakThreshold();
  const { tally, fileCount, mutationScore } = scoreReports(shards.map((s) => s.report));

  if (!Number.isFinite(mutationScore) || tally.valid === 0) {
    throw new Error(
      `No valid mutants found across ${shards.length} shard(s) over ${fileCount} file(s); ` +
        'the mutation run is misconfigured.'
    );
  }

  const score = mutationScore.toFixed(2);
  process.stdout.write(
    [
      `Merged ${shards.length} mutation shard(s) over ${fileCount} source file(s):`,
      `  killed=${tally.killed} timeout=${tally.timeout} ` +
        `survived=${tally.survived} noCoverage=${tally.noCoverage}`,
      `  compileError=${tally.compileError} runtimeError=${tally.runtimeError} ` +
        `ignored=${tally.ignored}`,
      `  detected=${tally.detected} valid=${tally.valid} mutationScore=${score}%`,
      '',
    ].join('\n')
  );

  if (mutationScore < breakThreshold) {
    process.stderr.write(
      `Mutation score ${score}% is below the break threshold ${breakThreshold}%. Gate failed.\n`
    );
    process.exitCode = 1;
    return;
  }

  process.stdout.write(
    `Mutation score ${score}% meets the break threshold ${breakThreshold}%. Gate passed.\n`
  );
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
