import { buildUserNode } from '@tests/builders';
import loadIsolated from '@tests/unit/utils/isolated-module';

type SchemasModule = typeof import('@/modules/user/features/settings/utils/response-schemas');

const loadSchemas = (): Promise<SchemasModule> =>
  loadIsolated(async () => await import('@/modules/user/features/settings/utils/response-schemas'));

describe('settings response schemas', () => {
  it('accepts the generated CurrentUser shape and hands the node back unchanged', async () => {
    const { CurrentUserResultSchema } = await loadSchemas();
    const node = buildUserNode();
    const payload = { users: { edges: [{ node }] } };

    expect(CurrentUserResultSchema.safeParse(payload)).toEqual({ success: true, data: payload });
  });

  it.each([
    ['a null connection', { users: null }],
    ['null edges', { users: { edges: null } }],
    ['a null edge', { users: { edges: [null] } }],
    ['a null node', { users: { edges: [{ node: null }] } }],
    ['undefined data', undefined],
    ['null data', null],
  ])('accepts %s as a nullish CurrentUser envelope', async (_name, payload) => {
    const { CurrentUserResultSchema } = await loadSchemas();

    expect(CurrentUserResultSchema.safeParse(payload)).toEqual({ success: true, data: payload });
  });

  it.each([
    ['a missing confirmed flag', { id: 'a', email: 'a@b.co', initials: 'A B' }],
    ['a missing id', { email: 'a@b.co', initials: 'A B', confirmed: true }],
    ['a missing e-mail', { id: 'a', initials: 'A B', confirmed: true }],
    ['missing initials', { id: 'a', email: 'a@b.co', confirmed: true }],
    [
      'a non-boolean confirmed flag',
      { id: 'a', email: 'a@b.co', initials: 'A B', confirmed: 'yes' },
    ],
  ])('rejects a CurrentUser node with %s', async (_name, node) => {
    const { CurrentUserResultSchema } = await loadSchemas();

    expect(CurrentUserResultSchema.safeParse({ users: { edges: [{ node }] } }).success).toBe(false);
  });

  it('accepts the generated UpdateUser shape and hands the user back unchanged', async () => {
    const { UpdateUserResultSchema } = await loadSchemas();
    const payload = { updateUser: { user: buildUserNode() } };

    expect(UpdateUserResultSchema.safeParse(payload)).toEqual({ success: true, data: payload });
    expect(UpdateUserResultSchema.safeParse({ updateUser: { user: null } })).toEqual({
      success: true,
      data: { updateUser: { user: null } },
    });
  });

  it('rejects an UpdateUser user without the confirmed flag', async () => {
    const { UpdateUserResultSchema } = await loadSchemas();
    const user = { id: 'a', email: 'a@b.co', initials: 'A B' };

    expect(UpdateUserResultSchema.safeParse({ updateUser: { user } }).success).toBe(false);
  });

  it('accepts the generated ResendEmailToUser shape and hands the user back as is', async () => {
    const { ResendEmailResultSchema } = await loadSchemas();
    const payload = { resendEmailToUser: { user: { id: 'a', confirmed: false } } };

    expect(ResendEmailResultSchema.safeParse(payload)).toEqual({ success: true, data: payload });
    expect(ResendEmailResultSchema.safeParse({ resendEmailToUser: null })).toEqual({
      success: true,
      data: { resendEmailToUser: null },
    });
  });

  it.each([
    ['without an id', { confirmed: true }],
    ['without the confirmed flag', { id: 'a' }],
  ])('rejects a ResendEmailToUser user %s', async (_name, user) => {
    const { ResendEmailResultSchema } = await loadSchemas();

    expect(ResendEmailResultSchema.safeParse({ resendEmailToUser: { user } }).success).toBe(false);
  });

  describe('two-factor settings results', () => {
    const codes = ['ABCD-2345', 'WXYZ-6789'];

    it('accepts the generated setup shape and hands the secret back unchanged', async () => {
      const { SetupTwoFactorResultSchema } = await loadSchemas();
      const payload = {
        setupTwoFactorUser: {
          user: { otpauthUri: 'otpauth://totp/x?secret=ABCD', secret: 'ABCD' },
        },
      };

      expect(SetupTwoFactorResultSchema.safeParse(payload)).toEqual({
        success: true,
        data: payload,
      });
    });

    it.each([
      ['an empty URI', { otpauthUri: '', secret: 'ABCD' }],
      ['an empty secret', { otpauthUri: 'otpauth://totp/x', secret: '' }],
      ['a missing secret', { otpauthUri: 'otpauth://totp/x' }],
      ['a null URI', { otpauthUri: null, secret: 'ABCD' }],
    ])('rejects a setup user with %s', async (_name, user) => {
      const { SetupTwoFactorResultSchema } = await loadSchemas();

      expect(SetupTwoFactorResultSchema.safeParse({ setupTwoFactorUser: { user } }).success).toBe(
        false
      );
    });

    it('accepts the generated confirm and regenerate shapes', async () => {
      const { ConfirmTwoFactorResultSchema, RegenerateRecoveryCodesResultSchema } =
        await loadSchemas();
      const confirm = { confirmTwoFactorUser: { user: { recoveryCodes: codes } } };
      const regenerate = { regenerateRecoveryCodesUser: { user: { recoveryCodes: codes } } };

      expect(ConfirmTwoFactorResultSchema.safeParse(confirm)).toEqual({
        success: true,
        data: confirm,
      });
      expect(RegenerateRecoveryCodesResultSchema.safeParse(regenerate)).toEqual({
        success: true,
        data: regenerate,
      });
    });

    it('accepts a set of one one-character code', async () => {
      const { ConfirmTwoFactorResultSchema, RegenerateRecoveryCodesResultSchema } =
        await loadSchemas();
      const user = { recoveryCodes: ['A'] };

      expect(
        ConfirmTwoFactorResultSchema.safeParse({ confirmTwoFactorUser: { user } }).success
      ).toBe(true);
      expect(
        RegenerateRecoveryCodesResultSchema.safeParse({ regenerateRecoveryCodesUser: { user } })
          .success
      ).toBe(true);
    });

    it.each([
      ['an empty list', []],
      ['a list holding a blank code', ['ABCD-2345', '']],
      ['a string', 'ABCD-2345'],
      ['an object', { 0: 'ABCD-2345' }],
      ['an array holding a number', ['ABCD-2345', 7]],
      ['null', null],
      ['undefined', undefined],
    ])('rejects recovery codes given as %s', async (_name, recoveryCodes) => {
      const { ConfirmTwoFactorResultSchema, RegenerateRecoveryCodesResultSchema } =
        await loadSchemas();

      expect(
        ConfirmTwoFactorResultSchema.safeParse({
          confirmTwoFactorUser: { user: { recoveryCodes } },
        }).success
      ).toBe(false);
      expect(
        RegenerateRecoveryCodesResultSchema.safeParse({
          regenerateRecoveryCodesUser: { user: { recoveryCodes } },
        }).success
      ).toBe(false);
    });

    it('accepts the generated disable shape and rejects a non-boolean success', async () => {
      const { DisableTwoFactorResultSchema } = await loadSchemas();
      const payload = { disableTwoFactorUser: { user: { success: true } } };

      expect(DisableTwoFactorResultSchema.safeParse(payload)).toEqual({
        success: true,
        data: payload,
      });
      expect(
        DisableTwoFactorResultSchema.safeParse({
          disableTwoFactorUser: { user: { success: 'yes' } },
        }).success
      ).toBe(false);
    });

    it.each([
      ['SetupTwoFactorResultSchema', 'setupTwoFactorUser'],
      ['ConfirmTwoFactorResultSchema', 'confirmTwoFactorUser'],
      ['DisableTwoFactorResultSchema', 'disableTwoFactorUser'],
      ['RegenerateRecoveryCodesResultSchema', 'regenerateRecoveryCodesUser'],
    ] as const)('accepts a nullish %s envelope', async (schema, field) => {
      const schemas = await loadSchemas();

      expect(schemas[schema].safeParse(undefined).success).toBe(true);
      expect(schemas[schema].safeParse(null).success).toBe(true);
      expect(schemas[schema].safeParse({ [field]: null }).success).toBe(true);
      expect(schemas[schema].safeParse({ [field]: { user: null } }).success).toBe(true);
    });
  });
});
