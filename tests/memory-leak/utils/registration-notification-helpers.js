export const AUTH_PATH = '/authentication';

export const registrationNotificationSelectors = {
  fullNameInput: 'input[name="fullName"]',
  emailInput: 'input[name="email"]',
  passwordInput: 'input[name="password"]',
  submitButton: 'form button[type="submit"]',
  alert: '[role="alert"]',
};

export const registrationCorsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
};

export function createRegistrationFormData(prefix) {
  return {
    fullName: prefix.includes('success') ? 'Memlab Success User' : 'Memlab Error User',
    email: `${prefix}.${Date.now()}@example.com`,
    password: 'SecurePass1',
  };
}

export function isGraphqlRequest(request) {
  return request.url().includes('graphql');
}

async function setInputValue(page, selector, value) {
  await page.waitForSelector(selector, { timeout: 15000 });
  await page.click(selector, { clickCount: 3 });
  await page.keyboard.press('Backspace');
  await page.type(selector, value);
}

export async function openAuthForm(page) {
  await page.evaluate((path) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, AUTH_PATH);

  await page.waitForSelector(registrationNotificationSelectors.fullNameInput, {
    timeout: 15000,
  });
  await page.waitForSelector(registrationNotificationSelectors.submitButton, {
    timeout: 15000,
  });
}

export async function fillRegistrationForm(page, formData) {
  await setInputValue(
    page,
    registrationNotificationSelectors.fullNameInput,
    formData.fullName
  );
  await setInputValue(page, registrationNotificationSelectors.emailInput, formData.email);
  await setInputValue(
    page,
    registrationNotificationSelectors.passwordInput,
    formData.password
  );
}

export async function submitRegistrationForm(page) {
  await page.evaluate((fullNameInputSelector) => {
    const fullNameInput = document.querySelector(fullNameInputSelector);
    if (!fullNameInput) {
      throw new Error(`Full name input not found: ${fullNameInputSelector}`);
    }

    const form = fullNameInput.closest('form');
    if (!form) {
      throw new Error('Registration form not found');
    }

    const submitButton = form.querySelector('button[type="submit"]');
    if (!submitButton) {
      throw new Error('Registration submit button not found');
    }

    submitButton.click();
  }, registrationNotificationSelectors.fullNameInput);
}

export async function waitForNotificationButtonCount(page) {
  await page.waitForFunction(
    (alertSelector) => {
      const alertEl = document.querySelector(alertSelector);
      if (!alertEl) return false;
      const buttonCount = alertEl.querySelectorAll('button').length;
      return buttonCount === 1 || buttonCount === 2;
    },
    { timeout: 15000 },
    registrationNotificationSelectors.alert
  );

  return page.$$eval(
    `${registrationNotificationSelectors.alert} button`,
    (buttons) => buttons.length
  );
}

export async function clickNotificationButton(page, index) {
  const notificationButtons = await page.$$(
    `${registrationNotificationSelectors.alert} button`
  );
  if (notificationButtons.length <= index) {
    throw new Error(
      `Expected alert button at index ${index}, found ${notificationButtons.length} button(s)`
    );
  }

  await notificationButtons[index].click();
}

export async function navigateHome(page) {
  await page.evaluate(() => {
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
}
