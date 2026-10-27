import 'reflect-metadata';

import { GraphQLTwoFactorSettingsTransformer } from '@/modules/user/features/settings/transformers';
import type {
  UserServiceFailure,
  UserServiceFailureReason,
} from '@/modules/user/types/user-service/user-service-failure';
import { buildOtpauthUri, buildRecoveryCodeSet, buildTotpSecret } from '@tests/builders';
import loadIsolated from '@tests/unit/utils/isolated-module';

const isolatedTransformer = (): Promise<GraphQLTwoFactorSettingsTransformer> =>
  loadIsolated(async () => {
    const { GraphQLTwoFactorSettingsTransformer: Transformer } =
      await import('@/modules/user/features/settings/transformers');
    return new Transformer();
  });

const failure = (reason: UserServiceFailureReason): UserServiceFailure => ({
  reason,
  status: null,
  violations: { items: [], complete: true },
});

const SERVER = { kind: 'failed', reason: 'server' };

const codesOf = (set: ReturnType<typeof buildRecoveryCodeSet>): string[] =>
  set.items.map((code) => code.value);

describe('GraphQLTwoFactorSettingsTransformer', () => {
  const transformer = new GraphQLTwoFactorSettingsTransformer();

  describe('toSetupOutcome', () => {
    it('hands the URI and secret back with status disabled and no codes', () => {
      const otpauthUri = buildOtpauthUri();
      const secret = buildTotpSecret();

      expect(
        transformer.toSetupOutcome({ setupTwoFactorUser: { user: { otpauthUri, secret } } })
      ).toEqual({
        kind: 'changed',
        settings: { status: 'disabled', otpauthUri, secret, recoveryCodes: null },
      });
    });

    it.each([
      ['null data', null],
      ['a null payload', { setupTwoFactorUser: null }],
      ['a null user', { setupTwoFactorUser: { user: null } }],
      [
        'a null secret',
        { setupTwoFactorUser: { user: { otpauthUri: 'otpauth://x', secret: null } } },
      ],
      ['an empty URI', { setupTwoFactorUser: { user: { otpauthUri: '', secret: 'ABCD' } } }],
    ])('fails with the server reason for %s', (_name, payload) => {
      expect(transformer.toSetupOutcome(payload)).toEqual(SERVER);
    });
  });

  describe.each([
    ['toConfirmOutcome', 'confirmTwoFactorUser'],
    ['toRegenerateOutcome', 'regenerateRecoveryCodesUser'],
  ] as const)('%s', (method, field) => {
    it('turns the strings into a RecoveryCodeSet in response order with status enabled', () => {
      const set = buildRecoveryCodeSet();
      const payload = { [field]: { user: { recoveryCodes: codesOf(set) } } };

      expect(transformer[method](payload as never)).toEqual({
        kind: 'changed',
        settings: { status: 'enabled', otpauthUri: null, secret: null, recoveryCodes: set },
      });
    });

    it('keeps an empty list as an empty set', () => {
      expect(transformer[method]({ [field]: { user: { recoveryCodes: [] } } } as never)).toEqual({
        kind: 'changed',
        settings: {
          status: 'enabled',
          otpauthUri: null,
          secret: null,
          recoveryCodes: { items: [] },
        },
      });
    });

    it.each([
      ['a string', 'ABCD-2345'],
      ['an object', { 0: 'ABCD-2345' }],
      ['numbers', [1, 2]],
      ['null', null],
    ])('fails with the server reason for recovery codes given as %s', (_name, recoveryCodes) => {
      expect(transformer[method]({ [field]: { user: { recoveryCodes } } } as never)).toEqual(
        SERVER
      );
    });

    it.each([
      ['null data', null],
      ['undefined data', undefined],
      ['a null payload', { [field]: null }],
      ['a null user', { [field]: { user: null } }],
    ])('fails with the server reason for %s', (_name, payload) => {
      expect(transformer[method](payload as never)).toEqual(SERVER);
    });
  });

  describe('toDisableOutcome', () => {
    it('gives status disabled with every secret and code null', () => {
      expect(
        transformer.toDisableOutcome({ disableTwoFactorUser: { user: { success: true } } })
      ).toEqual({
        kind: 'changed',
        settings: { status: 'disabled', otpauthUri: null, secret: null, recoveryCodes: null },
      });
    });

    it.each([
      ['success false', { disableTwoFactorUser: { user: { success: false } } }],
      ['a null user', { disableTwoFactorUser: { user: null } }],
      ['a null payload', { disableTwoFactorUser: null }],
      ['null data', null],
    ])('fails with the server reason for %s', (_name, payload) => {
      expect(transformer.toDisableOutcome(payload)).toEqual(SERVER);
    });
  });

  describe('toFailure', () => {
    it.each([
      ['already_enabled', 'already_enabled'],
      ['not_enabled', 'not_enabled'],
      ['setup_not_initiated', 'setup_not_initiated'],
      ['invalid_code', 'invalid_code'],
      ['violation', 'invalid_code'],
      ['reauth_required', 'reauth_required'],
      ['unauthenticated', 'session_ended'],
      ['access_denied', 'session_ended'],
      ['rate_limited', 'rate_limited'],
      ['network', 'network'],
      ['aborted', 'network'],
      ['server', 'server'],
      ['refused', 'server'],
      ['unknown', 'server'],
      ['invalid_password', 'server'],
      ['locked', 'server'],
      ['expired_session', 'server'],
    ] as const)('maps the %s failure to the %s reason', async (reason, expected) => {
      const loaded = await isolatedTransformer();

      expect(loaded.toFailure(failure(reason))).toEqual({ kind: 'failed', reason: expected });
    });
  });

  it('has no constructor dependencies', () => {
    expect(GraphQLTwoFactorSettingsTransformer.length).toBe(0);
  });
});
