# Playwright Flow Example

```typescript
import { test, expect } from '@playwright/test';

test('user can open sign up', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /sign up/i }).click();

  await expect(page.getByRole('heading', { name: /sign up/i })).toBeVisible();
});
```

Use accessible locators first. Add test IDs only when the UI has no stable
accessible name.
