/**
 * TODO: Remove after the final homepage design is implemented.
 */

const ScenarioBuilder = require('../utils/scenarioBuilder');

const scenarioBuilder = new ScenarioBuilder();

const signUpButtonSelector = 'button';

async function setup(page) {
  await page.waitForSelector(signUpButtonSelector, { timeout: 5000 });
}

async function action(page) {
  try {
    await page.waitForSelector(signUpButtonSelector, { timeout: 5000 });
    await page.click(signUpButtonSelector);
  } catch (error) {
    throw new Error(`Button interaction failed`, { cause: error });
  }
}

async function back(page) {
  // TODO: Keep this as a no-op until the homepage button mutates UI state.
  // The current ButtonExample click only schedules a console log and leaves the DOM unchanged.
  await page.waitForSelector(signUpButtonSelector, { timeout: 5000 });
}

module.exports = scenarioBuilder.createScenario({ setup, action, back });
