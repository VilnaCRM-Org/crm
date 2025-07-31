const ScenarioBuilder = require('../utils/ScenarioBuilder');

const scenarioBuilder = new ScenarioBuilder();

const signUpButtonSelector = 'button';

async function action(page) {
  try {
    await page.waitForSelector(signUpButtonSelector, { timeout: 5000 });
    await page.click(signUpButtonSelector);
  } catch (error) {
    throw new Error('Something went wrong');
  }
}

module.exports = scenarioBuilder.createScenario({ action });
