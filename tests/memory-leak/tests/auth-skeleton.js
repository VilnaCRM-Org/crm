import ScenarioBuilder from '../utils/scenarioBuilder.js';

const scenarioBuilder = new ScenarioBuilder();

const authSkeletonSelector = '[data-testid="auth-skeleton-title"]';

async function action(page) {
  try {
    await page.setRequestInterception(true);

    page.on('request', (req) => {
      if (req.url().includes('/static/js/async/')) {
        return;
      }
      req.continue().catch(() => {});
    });

    await page.goto(`${scenarioBuilder.url()}/authentication`);
    await page.waitForSelector(authSkeletonSelector, { timeout: 8000 });
  } catch (error) {
    throw new Error(`Auth skeleton memory leak test failed: ${error.message}`);
  }
}

async function back(page) {
  await page.setRequestInterception(false);
  await page.goto(scenarioBuilder.url());
}

export default scenarioBuilder.createScenario({ action, back });
