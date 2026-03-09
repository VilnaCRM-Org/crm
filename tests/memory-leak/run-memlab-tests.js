require('dotenv').config();

const fs = require('node:fs');
const path = require('node:path');

const { run, analyze } = require('@memlab/api');
const { StringAnalysis } = require('@memlab/heap-analysis');

const { initializeLocalization } = require('./utils/initialize-localization');

const memoryLeakDir = path.join('.', 'tests', 'memory-leak');
const testsDir = path.join(memoryLeakDir, 'tests');

const workDir = path.join(memoryLeakDir, 'results');
const consoleMode = 'VERBOSE';

function formatErrorDetails(error) {
  if (error instanceof Error) {
    return error.stack || error.message;
  }

  return String(error);
}

function writeFailure(message, error) {
  process.stderr.write(`${message}\n${formatErrorDetails(error)}\n`);
}

(async function runMemoryLeakTests() {
  let testFilePaths;
  try {
    testFilePaths = fs
      .readdirSync(testsDir)
      .filter((file) => file.endsWith('.js'))
      .map((test) => path.resolve(testsDir, test));
  } catch (error) {
    writeFailure(`Failed to read tests directory: ${testsDir}`, error);
    process.exit(1);
  }

  await initializeLocalization();

  for (const testFilePath of testFilePaths) {
    try {
      const scenario = require(testFilePath);
      if (!scenario || typeof scenario !== 'object') {
        throw new Error(`Invalid scenario exported from ${testFilePath}: must export an object`);
      }
      if (typeof scenario.url !== 'function' && typeof scenario.url !== 'string') {
        throw new Error(
          `Invalid scenario exported from ${testFilePath}: missing or invalid 'url' property`
        );
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
      writeFailure(`✗ Failed memory leak test: ${testFilePath}`, error);
      process.exit(1);
    }
  }
})();
