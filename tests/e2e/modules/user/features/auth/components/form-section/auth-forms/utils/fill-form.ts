import { Locator, Page, expect } from '@playwright/test';

import { RegisterUserDto } from '@/modules/user/features/auth/types/credentials';

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

type FieldExpectation<T extends 'email' | 'password'> = {
  errorText: string;
} & Record<T, string>;

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

async function assertFieldErrors<T extends 'email' | 'password'>(
  page: Page,
  input: Locator,
  expectations: ReadonlyArray<FieldExpectation<T>>,
  valueKey: T
): Promise<void> {
  await page.locator('button', { hasText: signUpButton }).click();
  for (const expectation of expectations) {
    await input.fill(expectation[valueKey]);
    await input.blur();
    const error: Locator = page
      .locator(requiredErrorSelector, { hasText: expectation.errorText })
      .first();

    await expect(error).toBeVisible();
  }
}

export async function fillEmailInput(page: Page, user: RegisterUserDto): Promise<void> {
  const emailInput: Locator = page.getByPlaceholder(placeholderEmail);
  await assertFieldErrors(page, emailInput, expectationsEmail, 'email');
  await emailInput.fill(user.email);
}

export async function fillPasswordInput(page: Page, user: RegisterUserDto): Promise<void> {
  const passwordInput: Locator = page.getByPlaceholder(placeholderPassword);
  await assertFieldErrors(page, passwordInput, expectationsPassword, 'password');
  await passwordInput.fill(user.password);
}
