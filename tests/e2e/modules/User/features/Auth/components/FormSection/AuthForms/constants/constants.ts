import { faker } from '@faker-js/faker';

import { t } from '../../../../../../../../utils/initializeLocalization';
import { ExpectationEmail, ExpectationsPassword, User } from '../types';

export const REGISTRATION_URL = '/authentication';
export const REGISTRATION_API_URL = '**/api/users'; // mockoon schema

export const placeholderInitials: string = t('sign_up.form.name_input.placeholder');
export const placeholderEmail: string = t('sign_up.form.email_input.placeholder');
export const placeholderPassword: string = t('sign_up.form.password_input.placeholder');
export const signUpButton: string = t('sign_up.form.submit_button');

export const requiredNameError: string = t('sign_up.form.name_input.required');
export const requiredEmailError: string = t('sign_up.form.name_input.required');

const firstName: string = faker.helpers.fromRegExp(/[A-Za-zА-Яа-яІіЇїЄєҐґ]{3,10}/);
const lastName: string = faker.helpers.fromRegExp(/[A-Za-zА-Яа-яІіЇїЄєҐґ]{3,10}/);

export function generateValidEmail(): string {
  const domain = faker.internet.domainName();
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`;
}

export const userData: User = {
  fullName: `${firstName} ${lastName}`,
  email: generateValidEmail(),
  password: faker.internet.password({ length: 16, prefix: 'Q9' }),
};

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
