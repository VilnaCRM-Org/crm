import ScenarioBuilder from '../utils/scenarioBuilder.js';

const homeBuilder = new ScenarioBuilder();
const authBuilder = new ScenarioBuilder('/authentication');

const authFormSelector = 'form, [role="form"]';

async function action(page) {
  try {
    await page.evaluate((path) => {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }, new URL(authBuilder.url()).pathname);
    await page.waitForSelector(authFormSelector, { timeout: 15000 });
  } catch (error) {
    throw new Error(`Auth transition failed: ${error.message}`);
  }
}

async function back(page) {
  await page.goto(homeBuilder.url());
}

export default homeBuilder.createScenario({ action, back });
