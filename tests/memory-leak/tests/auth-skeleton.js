import ScenarioBuilder from '../utils/scenario-builder.js';

const scenarioBuilder = new ScenarioBuilder();

const authSkeletonSelector = '#auth-skeleton-title';

function handleRequest(req) {
  if (req.url().includes('/static/js/async/')) {
    // Intentionally left pending: keeps React in Suspense so the skeleton stays visible
    return;
  }
  req.continue().catch(() => {});
}

async function action(page) {
  let shouldCleanup = true;

  try {
    await page.setRequestInterception(true);
    page.on('request', handleRequest);

    await page.evaluate((path) => {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }, '/authentication');

    await page.waitForSelector(authSkeletonSelector, { timeout: 8000 });
    shouldCleanup = false;
  } catch (error) {
    throw new Error(`Auth skeleton memory leak test failed: ${error.message}`);
  } finally {
    if (shouldCleanup) {
      page.off('request', handleRequest);
      await page.setRequestInterception(false);
    }
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

export default scenarioBuilder.createScenario({ action, back });
