require('dotenv').config();

const fs = require('node:fs');
const { run, analyze, config } = require('@memlab/api');
const { StringAnalysis } = require('@memlab/heap-analysis');

const { initializeLocalization } = require('./initialize-localization');
const { LeakAllowlistLoader, LeakReporter } = require('./leak-allowlist');
const { loadScenarios } = require('./scenario-inventory');
const { startResourceDiagnostics } = require('./resource-diagnostics');
const { configureBrowser } = require('./browser-config');
const logger = require('./logger');

async function runScenario() {
  const [file, index, name, workDir, allowlistPath] = process.argv.slice(2);
  const reporter = new LeakReporter(new LeakAllowlistLoader().load(allowlistPath), logger);
  await initializeLocalization();
  const selected = loadScenarios(file)[Number(index)];
  if (!selected || selected.name !== name) throw new Error('Scenario inventory changed in worker');

  configureBrowser(config.puppeteerConfig);

  logger.info(`[memlab] worker pid=${process.pid} scenario=${name} workDir=${workDir}`);
  logger.info(`[memlab] before scenario rssMiB=${Math.ceil(process.memoryUsage().rss / 1048576)}`);
  const stopDiagnostics = startResourceDiagnostics();
  let cleanupCompleted = false;
  try {
    const { leaks, runResult } = await run({
      scenario: selected.scenario,
      consoleMode: 'VERBOSE',
      workDir,
      skipWarmup: process.env.MEMLAB_SKIP_WARMUP === 'true',
      debug: process.env.MEMLAB_DEBUG === 'true',
    });
    let unexpectedLeaks;
    try {
      unexpectedLeaks = reporter.report(leaks, name);
      await analyze(runResult, new StringAnalysis());
    } finally {
      await runResult.cleanup();
      cleanupCompleted = true;
      logger.info(
        `[memlab] after scenario rssMiB=${Math.ceil(process.memoryUsage().rss / 1048576)}`
      );
    }
    if (unexpectedLeaks > 0) {
      logger.error(`✗ Scenario ${name} leaked — see the retainer trace above.`);
    } else {
      logger.info(`✅ Completed scenario: ${name}`);
    }
    // Completion requires both StringAnalysis and result cleanup, not merely run().
    fs.writeFileSync(3, JSON.stringify({ name, pid: process.pid, leaks: unexpectedLeaks }));
    process.exitCode = unexpectedLeaks > 0 ? 1 : 0;
  } finally {
    stopDiagnostics(cleanupCompleted ? 'after-cleanup' : 'after-failure');
  }
}

runScenario().catch((error) => {
  logger.error(error);
  // Failed browser initialization can leave handles alive. Never strand the coordinator.
  process.exit(1);
});
