import type { Page } from '@playwright/test';

import {
  buildEmail,
  buildOtpauthUri,
  buildRecoveryCodeSet,
  buildTotpSecret,
  seedFaker,
} from '@tests/builders';

import {
  graphQLFailure,
  json,
  stubOperation,
  type SignInReply,
  type StubbedSignIn,
} from './two-factor-responses';

seedFaker();

const recoveryCodesOf = (): readonly string[] =>
  buildRecoveryCodeSet().items.map(({ value }) => value);

export const SETUP_SECRET = buildTotpSecret();
export const SETUP_URI = buildOtpauthUri(buildEmail(), SETUP_SECRET);
export const RECOVERY_CODES: readonly string[] = recoveryCodesOf();
export const NEW_RECOVERY_CODES: readonly string[] = recoveryCodesOf();

export type SetupOutcome =
  'created' | 'already_enabled' | 'rate_limited' | 'unavailable' | 'network';

export type ConfirmOutcome =
  'confirmed' | 'invalid_code' | 'setup_not_initiated' | 'rate_limited' | 'unavailable' | 'network';

export type DisableOutcome =
  'disabled' | 'invalid_code' | 'not_enabled' | 'rate_limited' | 'unavailable' | 'network';

export type RegenerateOutcome =
  'regenerated' | 'reauth_required' | 'not_enabled' | 'rate_limited' | 'unavailable' | 'network';

const SETUP_OPERATION = 'SetupTwoFactorUser';
const DISABLE_OPERATION = 'DisableTwoFactorUser';
const REGENERATE_OPERATION = 'RegenerateRecoveryCodesUser';
const CONFIRM_OPERATION = 'ConfirmTwoFactorUser';

const transport: Record<'rate_limited' | 'unavailable' | 'network', SignInReply> = {
  rate_limited: (route) => route.fulfill({ status: 429, body: '' }),
  unavailable: (route) => route.fulfill({ status: 503, body: '' }),
  network: (route) => route.abort('failed'),
};

export const replyWithSetup =
  (otpauthUri: string, secret: string): SignInReply =>
  (route) =>
    json(route, 200, { data: { setupTwoFactorUser: { user: { otpauthUri, secret } } } });

export const replyWithConfirmedCodes =
  (recoveryCodes: readonly string[]): SignInReply =>
  (route) =>
    json(route, 200, {
      data: { confirmTwoFactorUser: { user: { recoveryCodes: [...recoveryCodes] } } },
    });

export const replyWithRegeneratedCodes =
  (recoveryCodes: readonly string[]): SignInReply =>
  (route) =>
    json(route, 200, {
      data: { regenerateRecoveryCodesUser: { user: { recoveryCodes: [...recoveryCodes] } } },
    });

export const SETUP_REPLIES: Record<SetupOutcome, SignInReply> = {
  created: replyWithSetup(SETUP_URI, SETUP_SECRET),
  already_enabled: (route) =>
    json(route, 200, graphQLFailure('Two-factor authentication is already enabled.', 409)),
  ...transport,
};

export const CONFIRM_REPLIES: Record<ConfirmOutcome, SignInReply> = {
  confirmed: replyWithConfirmedCodes(RECOVERY_CODES),
  invalid_code: (route) => json(route, 200, graphQLFailure('Invalid two-factor code.', 401)),
  setup_not_initiated: (route) =>
    json(route, 200, graphQLFailure('Two-factor setup not initiated.', 401)),
  ...transport,
};

export function stubSetup(
  page: Page,
  outcomes: readonly (SetupOutcome | SignInReply)[] = ['created']
): Promise<StubbedSignIn> {
  return stubOperation(page, SETUP_OPERATION, SETUP_REPLIES, 'created', outcomes);
}

export function stubConfirm(
  page: Page,
  outcomes: readonly (ConfirmOutcome | SignInReply)[] = ['confirmed']
): Promise<StubbedSignIn> {
  return stubOperation(page, CONFIRM_OPERATION, CONFIRM_REPLIES, 'confirmed', outcomes);
}

const NOT_ENABLED = 'Two-factor authentication is not enabled.';

export const DISABLE_REPLIES: Record<DisableOutcome, SignInReply> = {
  disabled: (route) =>
    json(route, 200, { data: { disableTwoFactorUser: { user: { success: true } } } }),
  invalid_code: (route) => json(route, 200, graphQLFailure('Invalid two-factor code.', 401)),
  not_enabled: (route) => json(route, 200, graphQLFailure(NOT_ENABLED, 403)),
  ...transport,
};

export const REGENERATE_REPLIES: Record<RegenerateOutcome, SignInReply> = {
  regenerated: replyWithRegeneratedCodes(NEW_RECOVERY_CODES),
  reauth_required: (route) => json(route, 200, graphQLFailure('Re-authentication required.', 403)),
  not_enabled: (route) => json(route, 200, graphQLFailure(NOT_ENABLED, 403)),
  ...transport,
};

export function stubDisable(
  page: Page,
  outcomes: readonly (DisableOutcome | SignInReply)[] = ['disabled']
): Promise<StubbedSignIn> {
  return stubOperation(page, DISABLE_OPERATION, DISABLE_REPLIES, 'disabled', outcomes);
}

export function stubRegenerate(
  page: Page,
  outcomes: readonly (RegenerateOutcome | SignInReply)[] = ['regenerated']
): Promise<StubbedSignIn> {
  return stubOperation(page, REGENERATE_OPERATION, REGENERATE_REPLIES, 'regenerated', outcomes);
}
