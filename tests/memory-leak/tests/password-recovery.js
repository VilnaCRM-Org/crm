const verifyPage = require('../utils/verify-page');
const ScenarioBuilder = require('../utils/scenario-builder');
const logger = require('../utils/logger');

const BASELINE_PATH = '/sign-in';
const REQUEST_PATH = '/password-recovery';
const RESET_PATH = '/password-reset';
const RESET_URL = `${RESET_PATH}?token=MemlabResetToken0000000000000001`;
const EMAIL_INPUT = 'input#email';
const NEW_PASSWORD_INPUT = 'input#newPassword';
const CONFIRM_INPUT = 'input#confirmPassword';
const RULES_LIST = 'ul#new-password-rules';
const SUBMIT = 'form button[type="submit"]';
const SIGN_IN_EMAIL_INPUT = 'form input#email';
const PAGE_TIMEOUT = 15000;
const BACK_TIMEOUT = 5000;

const scenarioBuilder = new ScenarioBuilder(BASELINE_PATH);

async function navigateInApp(page, targetPath) {
  await page.evaluate((path) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, targetPath);
}

async function waitForSelectors(page, selectors, timeout) {
  const rendered = await page.waitForFunction(
    (wanted) => wanted.every((selector) => document.querySelector(selector) !== null),
    { timeout },
    selectors
  );
  await rendered.dispose();
}

async function exerciseRequestForm(page) {
  await navigateInApp(page, REQUEST_PATH);
  await waitForSelectors(page, [EMAIL_INPUT, SUBMIT], PAGE_TIMEOUT);
  await verifyPage(page, REQUEST_PATH);
  await page.type(EMAIL_INPUT, 'memlab@example.com');
}

async function exerciseResetForm(page) {
  await navigateInApp(page, RESET_URL);
  await waitForSelectors(page, [NEW_PASSWORD_INPUT, CONFIRM_INPUT, RULES_LIST], PAGE_TIMEOUT);
  await verifyPage(page, RESET_PATH);
  await page.type(NEW_PASSWORD_INPUT, 'Memlab1Password');
  await page.click(SUBMIT);
  await waitForSelectors(page, [`${CONFIRM_INPUT}[aria-invalid="true"]`], PAGE_TIMEOUT);
}

async function action(page) {
  try {
    await exerciseRequestForm(page);
    await exerciseResetForm(page);
  } catch (error) {
    logger.error(`❌ Password recovery action failed: ${error.message}`);
    throw error;
  }
}

async function back(page) {
  try {
    await navigateInApp(page, BASELINE_PATH);

    const unmounted = await page.waitForFunction(
      (selectors) =>
        selectors.every((selector) => document.querySelector(selector) === null) &&
        document.querySelector('form') !== null,
      { timeout: BACK_TIMEOUT },
      [NEW_PASSWORD_INPUT, RULES_LIST]
    );
    await unmounted.dispose();
    await verifyPage(page, BASELINE_PATH);
    await page.click(SIGN_IN_EMAIL_INPUT);
  } catch (error) {
    logger.error(`❌ Password recovery back navigation failed: ${error.message}`);
    throw error;
  }
}

module.exports = scenarioBuilder.createScenario({ action, back });
