import ScenarioBuilder from '../utils/scenarioBuilder.js';

const homeBuilder = new ScenarioBuilder();
const authBuilder = new ScenarioBuilder('/authentication');

const authSkeletonSelector = '[data-testid="auth-skeleton-title"]';

async function action(page) {
  try {
    await page.setRequestInterception(true);

    page.on('request', (req) => {
      if (req.url().includes('/static/js/async/')) return;
      req.continue().catch(() => {});
    });

    await page.evaluate((path) => {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }, new URL(authBuilder.url()).pathname);

    await page.waitForSelector(authSkeletonSelector, { timeout: 8000 });
  } catch (error) {
    throw new Error(`Auth skeleton memory leak test failed: ${error.message}`);
  }
}

async function back(page) {
  await page.setRequestInterception(false);
  await page.goto(homeBuilder.url());
}

export default homeBuilder.createScenario({ action, back });
