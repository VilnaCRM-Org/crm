require('dotenv').config();

const fs = require('node:fs');

const { run, analyze } = require('@memlab/api');
const { StringAnalysis } = require('@memlab/heap-analysis');

const { initializeLocalization } = require('./utils/initializeLocalization');

const memoryLeakDir = './src/test/memory-leak';
const testsDir = './tests';

const workDir = './src/test/memory-leak/results';
const consoleMode = 'VERBOSE';

(async function runMemoryLeakTests() {
  let testFilePaths;
  try {
    testFilePaths = fs
      .readdirSync(`${memoryLeakDir}/${testsDir}`)
      .filter((file) => file.endsWith('.js'))
      .map((test) => `${testsDir}/${test}`);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Failed to read tests directory: ${memoryLeakDir}/${testsDir}`, error);
    process.exit(1);
  }

  await initializeLocalization();

  for (const testFilePath of testFilePaths) {
    try {
      const scenario = require(testFilePath);
      if (!scenario || typeof scenario !== 'object') {
        throw new Error(`Invalid scenario exported from ${testFilePath}`);
      }
      const { runResult } = await run({
        scenario,
        consoleMode,
        workDir,
        skipWarmup: process.env.MEMLAB_SKIP_WARMUP === 'true',
        debug: process.env.MEMLAB_DEBUG === 'true',
      });
      const analyzer = new StringAnalysis();
      await analyze(runResult, analyzer);
      runResult.cleanup();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`✗ Failed memory leak test: ${testFilePath}`, error);
      process.exit(1);
    }
  }
})();
