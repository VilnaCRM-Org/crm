const { t } = require('i18next');
const { faker } = require('@faker-js/faker');

const verifyPage = require('../utils/verifyPage');
const ScenarioBuilder = require('../utils/scenarioBuilder');
const logger = require('../utils/logger');

const ROUTE_PATH = '/authentication';
const DEFAULT_TIMEOUT = 5000;
const NETWORK_IDLE_TIMEOUT = 30000;

const scenarioBuilder = new ScenarioBuilder(ROUTE_PATH);

const createInputSelector = (placeholder) => `input[placeholder="${placeholder}"]`;

const getRegistrationSelectors = () => ({
  fullName: createInputSelector(t('sign_up.form.name_input.placeholder')),
  email: createInputSelector(t('sign_up.form.email_input.placeholder')),
  password: createInputSelector(t('sign_up.form.password_input.placeholder')),
});

async function waitForRegistrationForm(page, timeout = DEFAULT_TIMEOUT) {
  await page.waitForFunction(
    () => {
      const formInputs = document.querySelectorAll(
        'form input[type="text"], form input[type="email"], form input[type="password"]'
      );
      const fullNameInput = document.querySelector('input[name="fullName"]');
      return formInputs.length >= 3 && fullNameInput !== null;
    },
    { timeout }
  );

  logger.debug('✓ Registration form detected (3+ inputs, has fullName field)');
}

const generateFakeUserData = () => ({
  fullName: faker.person.fullName(),
  email: faker.internet.email(),
  password: faker.internet.password({ length: 12 }),
});

async function clearInputField(page, selector) {
  const input = await page.$(selector);
  if (input) {
    await input.click({ clickCount: 3 });
    await page.evaluate((sel) => {
      const element = document.querySelector(sel);
      if (element) {
        element.value = '';
        element.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, selector);
  }
}

async function fillFormFields(page, selectors, data) {
  const fields = Object.keys(selectors);
  for (const field of fields) {
    if (data[field] && selectors[field]) {
      await page.waitForSelector(selectors[field], { timeout: DEFAULT_TIMEOUT });
      await page.type(selectors[field], data[field]);
    }
  }
}

async function clearFormFields(page, selectors) {
  const fields = Object.keys(selectors);
  for (const field of fields) {
    if (selectors[field]) {
      try {
        await clearInputField(page, selectors[field]);
      } catch (error) {
        logger.warn(`⚠️ Failed to clear field ${field}: ${error.message}`);
      }
    }
  }
}

async function setup(page) {
  try {
    await page.evaluateOnNewDocument(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    const client = await page.target().createCDPSession();
    await client.send('Network.clearBrowserCookies');
    await client.send('Network.clearBrowserCache');
    await client.detach();

    const cookies = await page.cookies();
    if (cookies.length > 0) {
      await page.deleteCookie(...cookies);
    }

    await page.goto(scenarioBuilder.url(), {
      waitUntil: 'networkidle0',
      timeout: NETWORK_IDLE_TIMEOUT,
    });
    await verifyPage(page, ROUTE_PATH);
  } catch (error) {
    logger.error(`❌ Setup failed: ${error.message}`);
    throw error;
  }
}

async function action(page) {
  try {
    const selectors = getRegistrationSelectors();
    const userData = generateFakeUserData();
    await fillFormFields(page, selectors, userData);
  } catch (error) {
    logger.error(`❌ Action failed: ${error.message}`);
    throw error;
  }
}

async function back(page) {
  try {
    const selectors = getRegistrationSelectors();
    await clearFormFields(page, selectors);
  } catch (error) {
    logger.warn(`⚠️ Back function warning: ${error.message}`);
  }
}

async function completeRegistrationAction(page) {
  try {
    const currentUrl = page.url();
    const formSwitcher = 'button:last-of-type';

    if (currentUrl.includes('login')) {
      await page.waitForSelector(formSwitcher, { timeout: DEFAULT_TIMEOUT });
      await page.click(formSwitcher);
      await waitForRegistrationForm(page);
    }

    const selectors = getRegistrationSelectors();
    const userData = generateFakeUserData();

    await fillFormFields(page, selectors, userData);

    await page.waitForFunction(
      () => {
        const inputs = document.querySelectorAll(
          'form input[type="text"], form input[type="email"], form input[type="password"]'
        );
        const filledInputs = Array.from(inputs).filter(
          (input) => input.value && input.value.length > 0
        );
        return filledInputs.length >= 3;
      },
      { timeout: DEFAULT_TIMEOUT }
    );
  } catch (error) {
    logger.error(`❌ Complete registration action failed: ${error.message}`);
    throw error;
  }
}

async function completeRegistrationBack(page) {
  try {
    const selectors = getRegistrationSelectors();
    await clearFormFields(page, selectors);
  } catch (error) {
    logger.warn(`⚠️ Complete registration back warning: ${error.message}`);
  }
}

module.exports = scenarioBuilder.createScenario({ setup, action, back });

module.exports.completeRegistrationScenario = scenarioBuilder.createScenario({
  setup,
  action: completeRegistrationAction,
  back: completeRegistrationBack,
});
