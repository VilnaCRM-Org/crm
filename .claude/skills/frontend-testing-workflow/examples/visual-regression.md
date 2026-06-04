# Visual Regression Example

```typescript
import { test, expect } from '@playwright/test';

test('registration notification', async ({ page }) => {
  await page.goto('/sign-up');
  await expect(page).toHaveScreenshot('registration-notification.png');
});
```

Only update snapshots after inspecting the rendered diff.
