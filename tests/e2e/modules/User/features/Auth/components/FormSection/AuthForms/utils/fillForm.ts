import { Locator, Page, expect } from '@playwright/test';

import { RegisterUserDto } from '@/modules/User/features/Auth/types/Credentials';

import {
  placeholderInitials,
  requiredNameError,
  signUpButton,
  placeholderEmail,
  expectationsEmail,
  expectationsPassword,
  placeholderPassword,
} from '../constants/constants';

const requiredErrorSelector = 'p.MuiFormHelperText-root.Mui-error';

export async function fillInitialsInput(page: Page, user: RegisterUserDto): Promise<void> {
  const initialsInput: Locator = page.getByPlaceholder(placeholderInitials);
  await page.locator('button', { hasText: signUpButton }).click();

  await initialsInput.fill(' ');
  const fullNameError: Locator = page
    .locator(requiredErrorSelector, { hasText: requiredNameError })
    .first();

  await expect(fullNameError).toBeVisible();
  await initialsInput.fill(user.fullName);
}

export async function fillEmailInput(page: Page, user: RegisterUserDto): Promise<void> {
  const emailInput: Locator = page.getByPlaceholder(placeholderEmail);
  await page.locator('button', { hasText: signUpButton }).click();
  for (const expectation of expectationsEmail) {
    await emailInput.fill(expectation.email);
    await emailInput.blur();
    const emailError: Locator = page
      .locator(requiredErrorSelector, { hasText: expectation.errorText })
      .first();

    await expect(emailError).toBeVisible();
  }

  await emailInput.fill(user.email);
}

export async function fillPasswordInput(page: Page, user: RegisterUserDto): Promise<void> {
  const passwordInput: Locator = page.getByPlaceholder(placeholderPassword);
  await page.locator('button', { hasText: signUpButton }).click();
  for (const expectation of expectationsPassword) {
    await passwordInput.fill(expectation.password);
    await passwordInput.blur();
    const passwordError: Locator = page
      .locator(requiredErrorSelector, { hasText: expectation.errorText })
      .first();

    await expect(passwordError).toBeVisible();
  }

  await passwordInput.fill(user.password);
}
