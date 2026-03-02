import ScenarioBuilder from '../utils/scenarioBuilder.js';

const scenarioBuilder = new ScenarioBuilder();

const authFormSelector = 'form, [role="form"]';

async function action(page) {
  try {
    await page.goto(`${scenarioBuilder.url()}/authentication`);
    await page.waitForSelector(authFormSelector, { timeout: 15000 });
  } catch (error) {
    throw new Error(`Auth skeleton transition failed: ${error.message}`);
  }
}

async function back(page) {
  await page.goto(scenarioBuilder.url());
}

export default scenarioBuilder.createScenario({ action, back });
