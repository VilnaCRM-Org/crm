import type { Page } from '@playwright/test';

export const PRELOADED_AUTH_TOKEN = 'playwright-preloaded-auth-token';
export const preloadedAuthTokenEnvVar = 'REACT_APP_LHCI_PRELOADED_AUTH_TOKEN' as const;
// Held in lockstep with src/config/env/preloaded-auth-token.ts by that module's unit test,
// which seeds this exact key on `window` and asserts the seam reads it back.
export const PRELOADED_AUTH_TOKEN_WINDOW_KEY = '__PRELOADED_AUTH_TOKEN__' as const;

type PageInitTarget = Pick<Page, 'addInitScript'>;

type SeedArguments = { key: string; value: string };

export const seedWindowToken = ({ key, value }: SeedArguments): void => {
  (globalThis as unknown as Record<string, string>)[key] = value;
};

export async function seedPreloadedAuthToken(
  page: PageInitTarget,
  token: string = process.env[preloadedAuthTokenEnvVar]?.trim() || PRELOADED_AUTH_TOKEN
): Promise<void> {
  await page.addInitScript(seedWindowToken, { key: PRELOADED_AUTH_TOKEN_WINDOW_KEY, value: token });
}
