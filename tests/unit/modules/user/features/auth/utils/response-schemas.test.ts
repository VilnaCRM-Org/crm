import type { CompleteTwoFactorUserMutation, SignInUserMutation } from '@/api/generated/graphql';
import {
  buildEmail,
  buildFullName,
  buildGraphqlUser,
  buildPendingSessionId,
  buildToken,
} from '@tests/builders';

/**
 * The schemas are module-level values, so they are built the moment the module is imported.
 * Importing inside each test keeps the schema construction itself under test.
 */
describe('auth response schemas', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  describe('RegistrationResponseSchema', () => {
    it('keeps the optional fullName and email fields it declares', async () => {
      const { RegistrationResponseSchema } = await import('@auth/utils/response-schemas');
      const fullName = buildFullName();
      const email = buildEmail();

      expect(RegistrationResponseSchema.parse({ fullName, email })).toEqual({ fullName, email });
    });

    it('keeps each declared field on its own', async () => {
      const { RegistrationResponseSchema } = await import('@auth/utils/response-schemas');
      const fullName = buildFullName();
      const email = buildEmail();

      expect(RegistrationResponseSchema.parse({ fullName })).toEqual({ fullName });
      expect(RegistrationResponseSchema.parse({ email })).toEqual({ email });
    });

    it('rejects a declared field of the wrong type', async () => {
      const { RegistrationResponseSchema } = await import('@auth/utils/response-schemas');

      expect(() => RegistrationResponseSchema.parse({ fullName: 42 })).toThrow();
      expect(() => RegistrationResponseSchema.parse({ email: 42 })).toThrow();
    });
  });

  describe('CreateUserResultSchema', () => {
    it('keeps every field of a valid user node', async () => {
      const { CreateUserResultSchema } = await import('@auth/utils/response-schemas');
      const user = buildGraphqlUser();

      expect(CreateUserResultSchema.parse({ createUser: { user } })).toEqual({
        createUser: { user },
      });
    });

    it('rejects a user node that is missing a required field', async () => {
      const { CreateUserResultSchema } = await import('@auth/utils/response-schemas');
      const { id, confirmed, email, initials } = buildGraphqlUser();

      expect(() => CreateUserResultSchema.parse({ createUser: { user: {} } })).toThrow();
      expect(() =>
        CreateUserResultSchema.parse({ createUser: { user: { confirmed, email, initials } } })
      ).toThrow();
      expect(() =>
        CreateUserResultSchema.parse({ createUser: { user: { id, email, initials } } })
      ).toThrow();
      expect(() =>
        CreateUserResultSchema.parse({ createUser: { user: { id, confirmed, initials } } })
      ).toThrow();
      expect(() =>
        CreateUserResultSchema.parse({ createUser: { user: { id, confirmed, email } } })
      ).toThrow();
    });

    it('rejects a user node whose field has the wrong type', async () => {
      const { CreateUserResultSchema } = await import('@auth/utils/response-schemas');
      const user = buildGraphqlUser();

      expect(() =>
        CreateUserResultSchema.parse({ createUser: { user: { ...user, confirmed: 'yes' } } })
      ).toThrow();
    });
  });

  describe('SignInUserResultSchema', () => {
    it('accepts the generated SignInUserMutation shape (contract parity)', async () => {
      const { SignInUserResultSchema } = await import('@auth/utils/response-schemas');
      const sample: SignInUserMutation = {
        signInUser: {
          user: {
            success: true,
            twoFactorEnabled: true,
            accessToken: null,
            pendingSessionId: buildPendingSessionId(),
          },
        },
      };

      expect(SignInUserResultSchema.safeParse(sample).success).toBe(true);
    });

    it('keeps the three fields the sign-in outcome reads and drops the rest', async () => {
      const { SignInUserResultSchema } = await import('@auth/utils/response-schemas');
      const accessToken = buildToken();
      const pendingSessionId = buildPendingSessionId();

      expect(
        SignInUserResultSchema.parse({
          signInUser: {
            user: { success: true, twoFactorEnabled: true, accessToken, pendingSessionId },
          },
        })
      ).toEqual({
        signInUser: { user: { twoFactorEnabled: true, accessToken, pendingSessionId } },
      });
    });

    it.each([null, undefined, { signInUser: null }, { signInUser: { user: null } }])(
      'accepts the nullish shape %p',
      async (payload) => {
        const { SignInUserResultSchema } = await import('@auth/utils/response-schemas');

        expect(SignInUserResultSchema.safeParse(payload).success).toBe(true);
      }
    );

    it.each([
      ['twoFactorEnabled', 'true'],
      ['accessToken', 42],
      ['pendingSessionId', { id: 1 }],
    ])('rejects a %s of the wrong type', async (field, value) => {
      const { SignInUserResultSchema } = await import('@auth/utils/response-schemas');

      expect(
        SignInUserResultSchema.safeParse({ signInUser: { user: { [field]: value } } }).success
      ).toBe(false);
    });
  });

  describe('CompleteTwoFactorUserResultSchema', () => {
    it('accepts the generated CompleteTwoFactorUserMutation shape (contract parity)', async () => {
      const { CompleteTwoFactorUserResultSchema } = await import('@auth/utils/response-schemas');
      const sample: CompleteTwoFactorUserMutation = {
        completeTwoFactorUser: {
          user: { twoFactorEnabled: true, accessToken: buildToken(), recoveryCodesRemaining: 3 },
        },
      };

      expect(CompleteTwoFactorUserResultSchema.safeParse(sample).success).toBe(true);
    });

    it('keeps the token and the remaining recovery-code count', async () => {
      const { CompleteTwoFactorUserResultSchema } = await import('@auth/utils/response-schemas');
      const accessToken = buildToken();

      expect(
        CompleteTwoFactorUserResultSchema.parse({
          completeTwoFactorUser: {
            user: { twoFactorEnabled: true, accessToken, recoveryCodesRemaining: 0 },
          },
        })
      ).toEqual({ completeTwoFactorUser: { user: { accessToken, recoveryCodesRemaining: 0 } } });
    });

    it.each([
      null,
      undefined,
      { completeTwoFactorUser: null },
      { completeTwoFactorUser: { user: null } },
      { completeTwoFactorUser: { user: { accessToken: null, recoveryCodesRemaining: null } } },
    ])('accepts the nullish shape %p', async (payload) => {
      const { CompleteTwoFactorUserResultSchema } = await import('@auth/utils/response-schemas');

      expect(CompleteTwoFactorUserResultSchema.safeParse(payload).success).toBe(true);
    });

    it.each([
      ['accessToken', 42],
      ['recoveryCodesRemaining', '2'],
      ['recoveryCodesRemaining', -1],
      ['recoveryCodesRemaining', 1.5],
    ])('rejects a %s of %p', async (field, value) => {
      const { CompleteTwoFactorUserResultSchema } = await import('@auth/utils/response-schemas');

      expect(
        CompleteTwoFactorUserResultSchema.safeParse({
          completeTwoFactorUser: { user: { [field]: value } },
        }).success
      ).toBe(false);
    });
  });
});
