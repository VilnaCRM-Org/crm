require('dotenv').config();

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const { initializeLocalization } = require('./utils/initialize-localization');
const { LeakAllowlistLoader } = require('./utils/leak-allowlist');
const { loadScenarios } = require('./utils/scenario-inventory');
const ScenarioFinder = require('./utils/scenario-finder');
const logger = require('./utils/logger');

const memoryLeakDir = path.resolve('tests', 'memory-leak');
const testsDir = path.join(memoryLeakDir, 'tests');
const allowlistPath = path.join(memoryLeakDir, 'leak-allowlist.json');
const resultsDir = path.join(memoryLeakDir, 'results');
const workerPath = path.join(__dirname, 'utils', 'scenario-worker.js');

async function runMemoryLeakTests() {
  // Validate the complete inventory and allowlist before launching any browsers.
  new LeakAllowlistLoader().load(allowlistPath);
  await initializeLocalization();
  const inventory = new ScenarioFinder().find(testsDir).flatMap((file) => {
    const scenarios = loadScenarios(file);
    logger.info(`\n📋 Found ${scenarios.length} scenario(s) in ${path.basename(file)}`);
    return scenarios.map(({ name }, index) => ({ file, name, index }));
  });
  if (inventory.length === 0) {
    throw new Error('No memory leak scenarios were executed — the gate would pass vacuously.');
  }

  fs.mkdirSync(resultsDir, { recursive: true });
  let totalLeaks = 0;
  let failedWorkers = 0;
  for (const { file, name, index } of inventory) {
    const workDir = fs.mkdtempSync(path.join(resultsDir, 'scenario-'));
    logger.info(`\n🧪 Running scenario: ${name} from ${path.basename(file)}`);
    // stdout/stderr stay live; a separate descriptor carries the completion verdict.
    // Wait for worker exit before starting another, never sharing MemLab module state.
    const child = spawnSync(
      process.execPath,
      [workerPath, file, String(index), name, workDir, allowlistPath],
      { stdio: ['ignore', 'inherit', 'inherit', 'pipe'] }
    );
    try {
      if (child.error) throw child.error;
      if (child.signal) throw new Error(`Worker terminated by ${child.signal}`);
      const result = JSON.parse(child.output[3].toString());
      if (
        result.name !== name ||
        result.pid !== child.pid ||
        !Number.isSafeInteger(result.leaks) ||
        result.leaks < 0 ||
        child.status !== (result.leaks > 0 ? 1 : 0)
      ) {
        throw new Error('Invalid worker completion or exit status');
      }
      totalLeaks += result.leaks;
    } catch (error) {
      failedWorkers += 1;
      logger.error(`✗ Failed memory leak test: ${path.basename(file)} (${name})`, error);
    }
  }

  if (totalLeaks > 0) {
    logger.error(
      `✗ ${totalLeaks} unallowlisted memory leak(s) detected across ` +
        `${inventory.length} scenario(s). Fix the retention, or add a reviewed waiver to ` +
        `${allowlistPath}.`
    );
  }
  if (failedWorkers > 0 || totalLeaks > 0) {
    throw new Error(`Memory leak gate failed: ${failedWorkers} worker failure(s).`);
  }
  logger.info(`\n✅ ${inventory.length} scenario(s) executed with no unallowlisted leaks.`);
}

runMemoryLeakTests().catch((error) => {
  logger.error(error);
  process.exitCode = 1;
});
