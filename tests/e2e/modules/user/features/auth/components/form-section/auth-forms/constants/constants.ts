import { faker } from '@faker-js/faker';

import { t } from '../../../../../../../../utils/initialize-localization';
import { ExpectationEmail, ExpectationsPassword, User } from '../types';

export const REGISTRATION_URL = '/authentication';
export const GRAPHQL_URL = '**/*graphql*';

export const placeholderInitials: string = t('sign_up.form.name_input.placeholder');
export const placeholderEmail: string = t('sign_up.form.email_input.placeholder');
export const placeholderPassword: string = t('sign_up.form.password_input.placeholder');
export const signUpButton: string = t('sign_up.form.submit_button');
export const duplicateEmailServerError: string = t('sign_up.errors.email_used');
export const registrationGenericError: string = t('sign_up.errors.signup_error');
export const notificationSuccessTitle: string = t('notifications.success.title');
export const notificationSuccessButton: string = t('notifications.success.button');
export const notificationSuccessConfettiAlt: string = t('notifications.success.images.confetti');
export const notificationErrorTitle: string = t('notifications.error.title');
export const notificationErrorButton: string = t('notifications.error.button');
export const notificationErrorRetryButton: string = t('notifications.error.retry_button');
export const notificationErrorImageAlt: string = t('notifications.error.images.error');
export const notificationCloseLabel: string = t('notifications.close');

export const requiredInitialsError: string = t('sign_up.form.name_input.required');

export function generateUserData(): User {
  const firstName: string = faker.helpers.fromRegExp(/[A-Za-zА-Яа-яІіЇїЄєҐґ]{3,10}/);
  const lastName: string = faker.helpers.fromRegExp(/[A-Za-zА-Яа-яІіЇїЄєҐґ]{3,10}/);
  const domain = faker.internet.domainName();
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`;
  return {
    fullName: `${firstName} ${lastName}`,
    email,
    password: faker.internet.password({ length: 16, prefix: 'Q9' }),
  };
}

export const userData: User = generateUserData();

const textShortText: string = faker.internet.password({
  length: 7,
});

const textNoNumbers: string = faker.internet.password({
  length: 10,
  pattern: /[A-Z]/,
});
const textNoUppercaseLetter: string = faker.internet.password({
  length: 10,
  pattern: /[a-z]/,
  prefix: '1',
});

const emailWithoutDot: string = 'test@test';
const InvalidEmail: string = 'test@test.';

const emailErrorKeys: { stepError: string; invalid: string } = {
  stepError: t('sign_up.form.email_input.email_format_error'),
  invalid: t('sign_up.form.email_input.invalid_message'),
};

const passwordErrorKeys: { length: string; numbers: string; uppercase: string } = {
  length: t('sign_up.form.password_input.error_length'),
  numbers: t('sign_up.form.password_input.error_numbers'),
  uppercase: t('sign_up.form.password_input.error_uppercase'),
};

export const serverPasswordNoNumbersError: string = t('sign_up.form.password_input.error_numbers');
export const serverInitialsOnlySpacesError: string = t('sign_up.form.name_input.only_spaces_error');

export const notificationNetworkError: string = t('failure_responses.network_errors.network_error');
export const notificationServerError: string = t('failure_responses.server_errors.server_error');
export const notificationUnauthorizedError: string = t(
  'failure_responses.authentication_errors.unauthorized_access'
);
export const notificationAccessDeniedError: string = t(
  'failure_responses.authentication_errors.access_denied'
);
export const notificationSomethingWentWrong: string = t(
  'failure_responses.client_errors.something_went_wrong'
);

export const expectationsEmail: ExpectationEmail[] = [
  {
    errorText: emailErrorKeys.stepError,
    email: emailWithoutDot,
  },
  { errorText: emailErrorKeys.invalid, email: InvalidEmail },
];

export const expectationsPassword: ExpectationsPassword[] = [
  { errorText: passwordErrorKeys.length, password: textShortText },
  {
    errorText: passwordErrorKeys.numbers,
    password: textNoNumbers,
  },
  {
    errorText: passwordErrorKeys.uppercase,
    password: textNoUppercaseLetter,
  },
];
