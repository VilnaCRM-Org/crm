require('dotenv').config();

const fs = require('node:fs');
const path = require('node:path');

const { run, analyze } = require('@memlab/api');
const { StringAnalysis } = require('@memlab/heap-analysis');

const { hasValidScenarioHooks } = require('./utils/scenarioValidation');
const { initializeLocalization } = require('./utils/initializeLocalization');
const logger = require('./utils/logger');

const memoryLeakDir = path.join('.', 'tests', 'memory-leak');
const testsDir = path.join(memoryLeakDir, 'tests');

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

  await initializeLocalization();

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

      if (scenarios.length === 0) {
        logger.error(`Available exports: ${JSON.stringify(Object.keys(testModule))}`);
        throw new Error(`No valid scenarios found in ${testFilePath}`);
      }

      logger.info(`\n📋 Found ${scenarios.length} scenario(s) in ${path.basename(testFilePath)}`);

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
})();
