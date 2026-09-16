export const WCAG_AA_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] as const;

/**
 * Rules the jsdom (Jest) lane cannot evaluate: both need layout and a canvas, which jsdom lacks,
 * and axe-core 4.13 reports the gap through `console.error`, which the console gate turns into a
 * failure. WCAG 1.4.3 is owned by the Playwright lane, which runs in real browsers.
 */
export const JSDOM_INCAPABLE_RULES = ['color-contrast', 'link-in-text-block'] as const;

export interface A11yException {
  /** axe rule id, e.g. `color-contrast`. */
  ruleId: string;
  /** CSS selector the offending element must match (`Element.matches`); `*` is never accepted. */
  selector: string;
  /** Why the violation is accepted debt rather than fixed. */
  reason: string;
  /** GitHub issue that tracks removing the exception. */
  trackingUrl: string;
}

const PALETTE_CONTRAST_ISSUE = 'https://github.com/VilnaCRM-Org/crm/issues/276';

/**
 * Accepted WCAG debt, per docs/accessibility/acceptance-standard.md. Every entry names one rule,
 * one exact scope, a reason and a tracking issue; an entry is deleted when its issue closes.
 */
export const A11Y_EXCEPTIONS: readonly A11yException[] = [
  {
    ruleId: 'color-contrast',
    selector: 'a[href="/"].MuiButton-root > span.MuiTypography-root',
    reason: 'Back-to-main label: Figma grey[50] #969B9D on white is 2.81:1; token owned by design.',
    trackingUrl: PALETTE_CONTRAST_ISSUE,
  },
  {
    ruleId: 'color-contrast',
    selector: 'form button[type="submit"].MuiButton-contained',
    reason: 'Submit button is white on the Figma primary #1EAEFF (2.45:1); token owned by design.',
    trackingUrl: PALETTE_CONTRAST_ISSUE,
  },
  {
    ruleId: 'color-contrast',
    selector:
      'section > a.MuiButton-text[href="/sign-up"], section > a.MuiButton-text[href="/sign-in"]',
    reason: 'Auth switcher: Figma grey[50] #969B9D on #FBFBFB is 2.71:1; token owned by design.',
    trackingUrl: PALETTE_CONTRAST_ISSUE,
  },
  {
    ruleId: 'color-contrast',
    selector: 'footer a.MuiLink-root > p.MuiTypography-root',
    reason:
      'Footer links: MUI default #1976D2 on #F4F5F6 is 4.21:1; UILink theme drops the palette.',
    trackingUrl: PALETTE_CONTRAST_ISSUE,
  },
];
