/**
 * Memory Leak Test: Authentication Page
 * Tests memory leaks in login and registration forms, form switching,
 * and interactive elements like checkboxes and buttons.
 */

const { t } = require('i18next');
const { faker } = require('@faker-js/faker');

const verifyPage = require('../utils/verifyPage');
const ScenarioBuilder = require('../utils/scenarioBuilder');

const ROUTE_PATH = '/authentication';
const TRIPLE_CLICK_COUNT = 3;
const BACKSPACE_KEY = 'Backspace';
const DEFAULT_TIMEOUT = 5000;
const NETWORK_IDLE_TIMEOUT = 0;

const SELECTORS = {
  formSwitcher: 'button:last-of-type',
  rememberMeCheckbox: '#remember-me input[type="checkbox"]',
  forgotPasswordButton: 'button:contains("Забули пароль?")',
  submitButton: 'button[type="submit"]',
};

const scenarioBuilder = new ScenarioBuilder(ROUTE_PATH);

/**
 * Creates input selector by placeholder text
 * @param {string} placeholder - The placeholder text
 * @returns {string} CSS selector
 */
const createInputSelector = (placeholder) => `input[placeholder="${placeholder}"]`;

/**
 * Gets selectors for registration form fields
 * @returns {Object} Object containing field selectors
 */
const getRegistrationSelectors = () => ({
  fullName: createInputSelector(t('sign_up.form.name_input.placeholder')),
  email: createInputSelector(t('sign_up.form.email_input.placeholder')),
  password: createInputSelector(t('sign_up.form.password_input.placeholder')),
});

/**
 * Gets selectors for login form fields
 * @returns {Object} Object containing field selectors
 */
const getLoginSelectors = () => ({
  email: createInputSelector('vilnaCRM@gmail.com'),
  password: createInputSelector(t('sign_in.form.password_input.placeholder')),
});

/**
 * Generates fake user data for testing
 * @returns {Object} Object containing fake user data
 */
const generateFakeUserData = () => ({
  fullName: faker.person.fullName(),
  email: faker.internet.email(),
  password: faker.internet.password({ length: 12 }),
});

/**
 * Clears input field by triple-clicking and pressing backspace
 * @param {Object} page - Puppeteer page instance
 * @param {string} selector - Input field selector
 */
async function clearInputField(page, selector) {
  const input = await page.$(selector);
  if (input) {
    await input.click({ clickCount: TRIPLE_CLICK_COUNT });
    await page.keyboard.press(BACKSPACE_KEY);
  }
}

/**
 * Fills form fields with provided data
 * @param {Object} page - Puppeteer page instance
 * @param {Object} selectors - Object containing field selectors
 * @param {Object} data - Object containing data to fill
 */
async function fillFormFields(page, selectors, data) {
  const fields = Object.keys(selectors);
  for (const field of fields) {
    if (data[field] && selectors[field]) {
      await page.waitForSelector(selectors[field], { timeout: DEFAULT_TIMEOUT });
      await page.type(selectors[field], data[field]);
    }
  }
}

/**
 * Clears all form fields
 * @param {Object} page - Puppeteer page instance
 * @param {Object} selectors - Object containing field selectors
 */
async function clearFormFields(page, selectors) {
  const fields = Object.keys(selectors);
  for (const field of fields) {
    if (selectors[field]) {
      await clearInputField(page, selectors[field]);
    }
  }
}

/**
 * Setup function: Navigate to authentication page and verify
 * @param {Object} page - Puppeteer page instance
 */
async function setup(page) {
  await page.goto(scenarioBuilder.url(), {
    waitUntil: 'networkidle0',
    timeout: NETWORK_IDLE_TIMEOUT,
  });
  await verifyPage(page, ROUTE_PATH);
}

/**
 * Action function: Fill registration form with test data
 * @param {Object} page - Puppeteer page instance
 */
async function action(page) {
  const selectors = getRegistrationSelectors();
  const userData = generateFakeUserData();
  await fillFormFields(page, selectors, userData);
}

/**
 * Back function: Clear all registration form fields
 * @param {Object} page - Puppeteer page instance
 */
async function back(page) {
  const selectors = getRegistrationSelectors();
  await clearFormFields(page, selectors);
}

/**
 * Scenario 2: Login form interaction
 * Tests memory leaks when filling and clearing login form
 */
async function loginFormAction(page) {
  // Switch to login form first
  await page.waitForSelector(SELECTORS.formSwitcher, { timeout: DEFAULT_TIMEOUT });
  await page.click(SELECTORS.formSwitcher);

  // Wait for form to switch
  await page.waitForTimeout(500);

  const selectors = getLoginSelectors();
  const userData = generateFakeUserData();
  await fillFormFields(page, selectors, {
    email: userData.email,
    password: userData.password,
  });
}

async function loginFormBack(page) {
  const selectors = getLoginSelectors();
  await clearFormFields(page, selectors);
}

/**
 * Scenario 3: Form switching
 * Tests memory leaks when switching between login and registration forms
 */
async function formSwitchAction(page) {
  // Switch to login
  await page.waitForSelector(SELECTORS.formSwitcher, { timeout: DEFAULT_TIMEOUT });
  await page.click(SELECTORS.formSwitcher);
  await page.waitForTimeout(300);

  // Switch back to registration
  await page.click(SELECTORS.formSwitcher);
  await page.waitForTimeout(300);

  // Switch to login again
  await page.click(SELECTORS.formSwitcher);
  await page.waitForTimeout(300);
}

async function formSwitchBack(page) {
  // Switch back to registration form (default)
  await page.waitForSelector(SELECTORS.formSwitcher, { timeout: DEFAULT_TIMEOUT });
  await page.click(SELECTORS.formSwitcher);
  await page.waitForTimeout(300);
}

/**
 * Scenario 4: Checkbox interaction (Remember Me)
 * Tests memory leaks with checkbox state changes
 */
async function checkboxAction(page) {
  // Switch to login form where checkbox exists
  await page.waitForSelector(SELECTORS.formSwitcher, { timeout: DEFAULT_TIMEOUT });
  await page.click(SELECTORS.formSwitcher);
  await page.waitForTimeout(500);

  try {
    await page.waitForSelector(SELECTORS.rememberMeCheckbox, { timeout: DEFAULT_TIMEOUT });
    await page.click(SELECTORS.rememberMeCheckbox);
    await page.waitForTimeout(200);
    await page.click(SELECTORS.rememberMeCheckbox);
    await page.waitForTimeout(200);
    await page.click(SELECTORS.rememberMeCheckbox);
  } catch (error) {
    throw new Error(`Checkbox interaction failed: ${error.message}`);
  }
}

async function checkboxBack(page) {
  // Uncheck if checked
  try {
    const isChecked = await page.$eval(SELECTORS.rememberMeCheckbox, (el) => el.checked);
    if (isChecked) {
      await page.click(SELECTORS.rememberMeCheckbox);
    }
  } catch (error) {
    // Checkbox might not be in expected state, continue
  }
}

/**
 * Scenario 5: Complete registration flow
 * Tests memory leaks in full registration form interaction
 */
async function completeRegistrationAction(page) {
  const currentUrl = page.url();
  if (currentUrl.includes('login')) {
    await page.waitForSelector(SELECTORS.formSwitcher, { timeout: DEFAULT_TIMEOUT });
    await page.click(SELECTORS.formSwitcher);
    await page.waitForTimeout(500);
  }

  const selectors = getRegistrationSelectors();
  const userData = generateFakeUserData();

  await fillFormFields(page, selectors, userData);

  await page.waitForTimeout(500);
}

async function completeRegistrationBack(page) {
  const selectors = getRegistrationSelectors();
  await clearFormFields(page, selectors);
}

module.exports = scenarioBuilder.createScenario({ setup, action, back });

module.exports.loginFormScenario = scenarioBuilder.createScenario({
  setup,
  action: loginFormAction,
  back: loginFormBack,
});

module.exports.formSwitchScenario = scenarioBuilder.createScenario({
  setup,
  action: formSwitchAction,
  back: formSwitchBack,
});

module.exports.checkboxScenario = scenarioBuilder.createScenario({
  setup,
  action: checkboxAction,
  back: checkboxBack,
});

module.exports.completeRegistrationScenario = scenarioBuilder.createScenario({
  setup,
  action: completeRegistrationAction,
  back: completeRegistrationBack,
});
