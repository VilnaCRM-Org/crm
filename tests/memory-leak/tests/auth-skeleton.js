const ScenarioBuilder = require('../utils/scenario-builder');

const scenarioBuilder = new ScenarioBuilder();

const authSkeletonSelector = '#auth-skeleton-title';
const authRouteShellChunks = 2;
const lazyChunkDelayMs = 2000;
const preloadedAuthToken = 'memlab-preloaded-auth-token';

let lazyChunkCount = 0;

function isLazyChunkRequest(url) {
  return /\/static\/js\/.*\.js$/.test(url) && !/\/static\/js\/(?:main|runtime)/.test(url);
}

function handleRequest(req) {
  if (isLazyChunkRequest(req.url())) {
    lazyChunkCount += 1;

    if (lazyChunkCount > authRouteShellChunks) {
      setTimeout(() => {
        req.continue().catch(() => {});
      }, lazyChunkDelayMs);
      return;
    }

    req.continue().catch(() => {});
    return;
  }

  req.continue().catch(() => {});
}

async function beforeInitialPageLoad(page) {
  await scenarioBuilder.beforeInitialPageLoad(page);
  await page.evaluateOnNewDocument((token) => {
    Object.defineProperty(window, '__PRELOADED_AUTH_TOKEN__', {
      value: token,
      configurable: true,
    });
  }, preloadedAuthToken);
}

async function action(page) {
  try {
    lazyChunkCount = 0;
    await page.setRequestInterception(true);
    page.on('request', handleRequest);

    await page.evaluate((path) => {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }, '/authentication');

    await page.waitForSelector(authSkeletonSelector, { timeout: 8000 });
  } catch (error) {
    throw new Error(`Auth skeleton memory leak test failed: ${error.message}`);
  }
}

async function back(page) {
  page.off('request', handleRequest);
  await page.setRequestInterception(false);
  await page.evaluate(() => {
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
}

module.exports = scenarioBuilder.createScenario({ beforeInitialPageLoad, action, back });
