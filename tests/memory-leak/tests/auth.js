import ScenarioBuilder from '../utils/scenario-builder.js';

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
    throw new Error(`Auth transition failed: ${error.message}`);
  }
}

async function back(page) {
  await page.evaluate(() => {
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
}

export default scenarioBuilder.createScenario({ action, back });
