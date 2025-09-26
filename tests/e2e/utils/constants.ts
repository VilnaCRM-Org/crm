import type { ViewportSize } from '@playwright/test';

const viewports: ReadonlyArray<ViewportSize> = [
  { width: 320, height: 568 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
];
export default viewports;
