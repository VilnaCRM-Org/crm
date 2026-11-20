import type { Page } from '@playwright/test';

import { expect } from '@tests/e2e/utils/fixtures';
import { findSecretLeaks, type NamedSecrets } from '@tests/utils/find-secret-leaks';

export async function expectNoSecrets(page: Page, secrets: NamedSecrets): Promise<void> {
  expect(await findSecretLeaks(page, secrets)).toEqual([]);
}
