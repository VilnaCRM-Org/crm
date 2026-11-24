import type { Page, Route } from '@playwright/test';

import type { ScreenSize } from './constants';

const STATE = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';
const CALLBACK = '/auth/callback/google';

type CompleteAnswer = 'none' | 'never' | 'unreachable';

export interface SocialCallbackShot {
  readonly name: string;
  readonly url: string;
  readonly startedHere: boolean;
  readonly complete: CompleteAnswer;
}

export const socialCallbackShots: ReadonlyArray<SocialCallbackShot> = [
  {
    name: 'social-callback-loading',
    url: `${CALLBACK}?code=visual&state=${STATE}`,
    startedHere: true,
    complete: 'never',
  },
  {
    name: 'social-callback-cancelled',
    url: `${CALLBACK}?error=access_denied&state=${STATE}`,
    startedHere: true,
    complete: 'none',
  },
  {
    name: 'social-callback-expired',
    url: `${CALLBACK}?code=visual&state=${STATE}`,
    startedHere: false,
    complete: 'none',
  },
  {
    name: 'social-callback-unavailable',
    url: `${CALLBACK}?code=visual&state=${STATE}`,
    startedHere: true,
    complete: 'unreachable',
  },
];

export const socialCallbackScreens: ReadonlyArray<ScreenSize> = [
  { width: 1440, height: 940, name: 'desktop' },
  { width: 1024, height: 1366, name: 'tablet' },
  { width: 375, height: 1082, name: 'mobile' },
];

async function answerComplete(route: Route, answer: CompleteAnswer): Promise<void> {
  const body = route.request().postDataJSON() as { operationName?: string } | null;
  if (body?.operationName !== 'CompleteSocialSignIn') {
    await route.fallback();
    return;
  }
  if (answer === 'unreachable') await route.abort('connectionrefused');
}

export async function arrangeSocialCallback(page: Page, shot: SocialCallbackShot): Promise<void> {
  if (shot.startedHere) {
    await page.addInitScript((saved) => {
      window.sessionStorage.setItem('crm.socialSignIn.state', saved);
    }, `google:${STATE}`);
  }
  if (shot.complete !== 'none') {
    await page.route('**/graphql', (route) => answerComplete(route, shot.complete));
  }
}
