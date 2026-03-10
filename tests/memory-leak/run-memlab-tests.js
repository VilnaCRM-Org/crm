require('dotenv').config();

const fs = require('node:fs');
const path = require('node:path');

const { run, analyze } = require('@memlab/api');
const { StringAnalysis } = require('@memlab/heap-analysis');

const { initializeLocalization } = require('./utils/initialize-localization');
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
      const scenarios = [];

      if (testModule && typeof testModule === 'object') {
        if (typeof testModule.url === 'function' || typeof testModule.url === 'string') {
          scenarios.push({ name: 'default', scenario: testModule });
        }

        for (const [key, value] of Object.entries(testModule)) {
          const isScenarioProperty = ['url', 'setup', 'action', 'back'].includes(key);
          if (
            !isScenarioProperty &&
            value &&
            typeof value === 'object' &&
            (typeof value.url === 'function' || typeof value.url === 'string')
          ) {
            scenarios.push({ name: key, scenario: value });
          }
        }
      }

      if (scenarios.length === 0) {
        throw new Error(`No valid scenarios found in ${testFilePath}`);
      }

      for (const { name, scenario } of scenarios) {
        logger.info(`Running memory leak scenario "${name}" from ${path.basename(testFilePath)}`);

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
      }
    } catch (error) {
      logger.error(`✗ Failed memory leak test: ${path.basename(testFilePath)}`, error);
      process.exit(1);
    }
  }
})();
