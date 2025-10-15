/**
 * Example for the home page. Should be removed after the design is implemented.
 */

const ScenarioBuilder = require('../utils/scenarioBuilder');

const scenarioBuilder = new ScenarioBuilder();

const signUpButtonSelector = 'button';

async function action(page) {
  try {
    await page.waitForSelector(signUpButtonSelector, { timeout: 5000 });
    await page.click(signUpButtonSelector);
  } catch (error) {
    throw new Error(`Button interaction failed`, { cause: error });
  }
}

module.exports = scenarioBuilder.createScenario({ action });
