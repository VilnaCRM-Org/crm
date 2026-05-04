/**
 * TODO: Remove after the final homepage design is implemented.
 * Opt-in example: only runs when MEMLEAK_INCLUDE_EXAMPLES=true.
 */

if (process.env.MEMLEAK_INCLUDE_EXAMPLES === 'true') {
  const ScenarioBuilder = require('../utils/scenario-builder');

  const scenarioBuilder = new ScenarioBuilder();

  const signUpButtonSelector = 'button';

  const setup = async (page) => {
    await page.waitForSelector(signUpButtonSelector, { timeout: 5000 });
  };

  const action = async (page) => {
    try {
      await page.click(signUpButtonSelector);
    } catch (error) {
      throw new Error(`Button interaction failed`, { cause: error });
    }
  };

  const back = async (page) => {
    // TODO: Keep this as a no-op until the homepage button mutates UI state.
    // The current ButtonExample click only schedules a console log and leaves the DOM unchanged.
    await page.waitForSelector(signUpButtonSelector, { timeout: 5000 });
  };

  module.exports = scenarioBuilder.createScenario({ setup, action, back });
} else {
  module.exports = {};
}
