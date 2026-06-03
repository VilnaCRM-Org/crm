import { Locator } from '@playwright/test';

export default async function fillInput(input: Locator, value: string): Promise<void> {
  await input.click();
  await input.fill(value);
}
