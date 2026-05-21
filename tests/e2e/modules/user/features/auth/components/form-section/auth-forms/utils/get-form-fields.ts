import { Locator, Page } from '@playwright/test';

import {
  placeholderEmail,
  placeholderInitials,
  placeholderPassword,
  signUpButton,
} from '../constants/constants';

type GetFormFields = {
  initialsInput: Locator;
  emailInput: Locator;
  passwordInput: Locator;
  signupButton: Locator;
};

export default function getFormFields(page: Page): GetFormFields {
  const initialsInput: Locator = page.getByPlaceholder(placeholderInitials);
  const emailInput: Locator = page.getByPlaceholder(placeholderEmail);
  const passwordInput: Locator = page.getByPlaceholder(placeholderPassword);
  const signupButton: Locator = page.locator('button', { hasText: signUpButton });

  return { initialsInput, emailInput, passwordInput, signupButton };
}
