import ScenarioBuilder from '../utils/scenarioBuilder.js';

const scenarioBuilder = new ScenarioBuilder();

const authFormSelector = 'form, [role="form"]';

async function action(page) {
  try {
    await page.evaluate((path) => {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }, '/authentication');
    await page.waitForSelector(authFormSelector, { timeout: 15000 });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    throw new Error(`Auth transition failed: ${errMsg}`);
  }
}

async function back(page) {
  await page.evaluate(() => {
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
}

export default scenarioBuilder.createScenario({ action, back });
