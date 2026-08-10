require('dotenv').config();

const fs = require('node:fs');
const path = require('node:path');

const { run, analyze, findLeaks } = require('@memlab/api');
const { StringAnalysis } = require('@memlab/heap-analysis');

const { hasValidScenarioHooks } = require('./utils/scenario-validation');
const { initializeLocalization } = require('./utils/initialize-localization');
const { LeakAllowlistLoader, LeakReporter } = require('./utils/leak-allowlist');
const logger = require('./utils/logger');

const memoryLeakDir = path.join('.', 'tests', 'memory-leak');
const testsDir = path.join(memoryLeakDir, 'tests');
const allowlistPath = path.join(memoryLeakDir, 'leak-allowlist.json');

const workDir = path.join(memoryLeakDir, 'results');
const consoleMode = 'VERBOSE';

(async function runMemoryLeakTests() {
  let testFilePaths;
  try {
    testFilePaths = fs
      .readdirSync(testsDir)
      .filter((file) => file.endsWith('.js'))
      .map((test) => path.resolve(testsDir, test));
  } catch (error) {
    logger.error(`Failed to read tests directory: ${testsDir}`, error);
    process.exit(1);
  }

  let leakReporter;
  try {
    leakReporter = new LeakReporter(new LeakAllowlistLoader().load(allowlistPath), logger);
  } catch (error) {
    logger.error(`Failed to load the leak allowlist ${allowlistPath}`, error);
    process.exit(1);
  }

  await initializeLocalization();

  let totalScenariosRun = 0;
  let totalLeaks = 0;

  for (const testFilePath of testFilePaths) {
    try {
      const testModule = require(testFilePath);

      logger.debug(`\n📂 Loading test file: ${path.basename(testFilePath)}`);
      logger.debug(`Exported keys: ${Object.keys(testModule).join(', ')}`);

      const scenarios = [];

      if (testModule && typeof testModule === 'object') {
        if (hasValidScenarioHooks(testModule)) {
          scenarios.push({ name: 'default', scenario: testModule });
          logger.debug(`✓ Found default export as scenario`);
        }

        for (const [key, value] of Object.entries(testModule)) {
          const isScenarioProperty = ['url', 'action', 'back', 'setup'].includes(key);

          if (
            !isScenarioProperty &&
            value &&
            typeof value === 'object' &&
            hasValidScenarioHooks(value)
          ) {
            scenarios.push({ name: key, scenario: value });
            logger.debug(`✓ Found named export: ${key}`);
          }
        }
      }

      const fileName = path.basename(testFilePath);
      if (scenarios.length === 0) {
        logger.error(`✗ ${fileName} exports no valid memory leak scenario.`);
        process.exit(1);
      }

      totalScenariosRun += scenarios.length;
      logger.info(`\n📋 Found ${scenarios.length} scenario(s) in ${fileName}`);

      for (const { name, scenario } of scenarios) {
        logger.info(`\n🧪 Running scenario: ${name} from ${path.basename(testFilePath)}`);
        const { runResult } = await run({
          scenario,
          consoleMode,
          workDir,
          skipWarmup: process.env.MEMLAB_SKIP_WARMUP === 'true',
          debug: process.env.MEMLAB_DEBUG === 'true',
        });
        try {
          const leaks = await findLeaks(runResult);
          totalLeaks += leakReporter.report(leaks, name);

          const analyzer = new StringAnalysis();
          await analyze(runResult, analyzer);
        } finally {
          runResult.cleanup();
        }

        logger.info(`✅ Completed scenario: ${name}`);
      }
    } catch (error) {
      logger.error(`✗ Failed memory leak test: ${path.basename(testFilePath)}`, error);
      process.exit(1);
    }
  }

  if (totalScenariosRun === 0) {
    logger.error(
      '✗ No memory leak scenarios were executed — the gate would pass vacuously. ' +
        `Ensure ${testsDir} contains files exporting valid scenarios.`
    );
    process.exit(1);
  }

  if (totalLeaks > 0) {
    logger.error(
      `✗ ${totalLeaks} unallowlisted memory leak(s) detected across ` +
        `${totalScenariosRun} scenario(s). Fix the retention, or add a reviewed ` +
        `waiver to ${allowlistPath}.`
    );
    process.exit(1);
  }

  logger.info(`\n✅ ${totalScenariosRun} scenario(s) executed with no unallowlisted leaks.`);
})();
