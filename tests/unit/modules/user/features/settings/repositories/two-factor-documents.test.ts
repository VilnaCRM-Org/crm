import { print } from 'graphql';

import {
  ConfirmTwoFactorUserDocument as CONFIRM,
  DisableTwoFactorUserDocument as DISABLE,
  RegenerateRecoveryCodesUserDocument as REGENERATE,
  SetupTwoFactorUserDocument as SETUP,
} from '@/api/generated/graphql';

const compact = (document: Parameters<typeof print>[0]): string =>
  print(document).replace(/\s+/g, ' ').trim();

describe('two-factor settings GraphQL documents', () => {
  it('selects exactly the otpauth URI and secret from setup', () => {
    expect(compact(SETUP)).toBe(
      'mutation SetupTwoFactorUser($input: setupTwoFactorUserInput!) ' +
        '{ setupTwoFactorUser(input: $input) { user { otpauthUri secret } } }'
    );
  });

  it('selects exactly the recovery codes from confirm', () => {
    expect(compact(CONFIRM)).toBe(
      'mutation ConfirmTwoFactorUser($input: confirmTwoFactorUserInput!) ' +
        '{ confirmTwoFactorUser(input: $input) { user { recoveryCodes } } }'
    );
  });

  it('selects exactly success from disable', () => {
    expect(compact(DISABLE)).toBe(
      'mutation DisableTwoFactorUser($input: disableTwoFactorUserInput!) ' +
        '{ disableTwoFactorUser(input: $input) { user { success } } }'
    );
  });

  it('selects exactly the recovery codes from regenerate', () => {
    expect(compact(REGENERATE)).toBe(
      'mutation RegenerateRecoveryCodesUser($input: regenerateRecoveryCodesUserInput!) ' +
        '{ regenerateRecoveryCodesUser(input: $input) { user { recoveryCodes } } }'
    );
  });

  it.each([
    ['setup', SETUP],
    ['confirm', CONFIRM],
    ['disable', DISABLE],
    ['regenerate', REGENERATE],
  ])('never selects a session or identity field in %s', (_name, document) => {
    const text = compact(document);

    for (const field of ['id', '_id', 'accessToken', 'refreshToken', 'warning']) {
      expect(text).not.toMatch(new RegExp(`\\b${field}\\b`));
    }
    expect(text).not.toContain('clientMutationId');
  });
});
