import ScenarioBuilder from '../utils/scenarioBuilder.js';

const scenarioBuilder = new ScenarioBuilder();

const authSkeletonSelector = '[data-testid="auth-skeleton-title"]';

function handleRequest(req) {
  if (req.url().includes('/static/js/async/')) {
    req.abort().catch(() => {});
    return;
  }
  req.continue().catch(() => {});
}

async function action(page) {
  try {
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

export default scenarioBuilder.createScenario({ action, back });
