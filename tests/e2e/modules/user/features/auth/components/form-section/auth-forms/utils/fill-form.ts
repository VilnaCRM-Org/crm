import { Locator, Page, expect } from '@playwright/test';

import { RegisterUserDto } from '@/modules/user/features/auth/types/credentials';

import {
  placeholderInitials,
  requiredInitialsError,
  signUpButton,
  placeholderEmail,
  expectationsEmail,
  expectationsPassword,
  placeholderPassword,
} from '../constants/constants';

const requiredErrorSelector = 'p.MuiFormHelperText-root.Mui-error';

async function runFieldValidations(
  page: Page,
  input: Locator,
  expectations: Array<{ value: string; errorText: string }>
): Promise<void> {
  await page.locator('button', { hasText: signUpButton }).click();
  for (const { value, errorText } of expectations) {
    await input.fill(value);
    await input.blur();
    await expect(page.locator(requiredErrorSelector, { hasText: errorText }).first()).toBeVisible();
  }
}

export async function fillInitialsInput(page: Page, user: RegisterUserDto): Promise<void> {
  const initialsInput: Locator = page.getByPlaceholder(placeholderInitials);
  await page.locator('button', { hasText: signUpButton }).click();

  await initialsInput.fill(' ');
  const initialsError: Locator = page
    .locator(requiredErrorSelector, { hasText: requiredInitialsError })
    .first();

  await expect(initialsError).toBeVisible();
  await initialsInput.fill(user.fullName);
}

export async function fillEmailInput(page: Page, user: RegisterUserDto): Promise<void> {
  const emailInput: Locator = page.getByPlaceholder(placeholderEmail);
  await runFieldValidations(
    page,
    emailInput,
    expectationsEmail.map((e) => ({ value: e.email, errorText: e.errorText }))
  );
  await emailInput.fill(user.email);
}

export async function fillPasswordInput(page: Page, user: RegisterUserDto): Promise<void> {
  const passwordInput: Locator = page.getByPlaceholder(placeholderPassword);
  await runFieldValidations(
    page,
    passwordInput,
    expectationsPassword.map((e) => ({ value: e.password, errorText: e.errorText }))
  );
  await passwordInput.fill(user.password);
}
