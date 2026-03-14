import ScenarioBuilder from '../utils/scenario-builder.js';

import {
  createRegistrationFormData,
  fillRegistrationForm,
  isGraphqlRequest,
  navigateHome,
  openAuthForm,
  registrationCorsHeaders,
  registrationNotificationSelectors,
  submitRegistrationForm,
  waitForNotificationButtonCount,
  clickNotificationButton,
} from '../utils/registration-notification-helpers.js';

const scenarioBuilder = new ScenarioBuilder();
const formData = createRegistrationFormData('memlab.success');

async function submitWithSuccessResponse(page) {
  await page.setRequestInterception(true);
  let interceptedGraphqlRequests = 0;

  const requestHandler = async (request) => {
    if (!isGraphqlRequest(request)) {
      await request.continue();
      return;
    }
    interceptedGraphqlRequests += 1;
    if (request.method() === 'OPTIONS') {
      await request.respond({
        status: 204,
        headers: registrationCorsHeaders,
      });
      return;
    }

    await request.respond({
      status: 200,
      headers: { ...registrationCorsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: {
          createUser: {
            user: {
              id: 'memlab-success-id',
              confirmed: false,
              email: formData.email,
              initials: formData.fullName,
            },
            clientMutationId: 'memlab-success-client-id',
          },
        },
      }),
    });
  };

  page.on('request', requestHandler);
  try {
    await submitRegistrationForm(page);
    const alertButtonCount = await waitForNotificationButtonCount(page);

    if (interceptedGraphqlRequests < 1) {
      throw new Error('No GraphQL requests were intercepted during success submission');
    }

    if (alertButtonCount !== 1) {
      throw new Error(
        `Expected success notification with 1 button, received ${alertButtonCount} button(s)`
      );
    }
  } finally {
    page.off('request', requestHandler);
    await page.setRequestInterception(false);
  }
}

async function action(page) {
  try {
    await openAuthForm(page);
    await fillRegistrationForm(page, formData);
    await submitWithSuccessResponse(page);
  } catch (error) {
    throw new Error(`Registration success transition failed: ${error.message}`);
  }
}

async function back(page) {
  try {
    await clickNotificationButton(page, 0);
    await page.waitForSelector(registrationNotificationSelectors.fullNameInput, {
      timeout: 15000,
    });
    await navigateHome(page);
  } catch (error) {
    throw new Error(`Registration success cleanup failed: ${error.message}`);
  }
}

export default scenarioBuilder.createScenario({ action, back });
