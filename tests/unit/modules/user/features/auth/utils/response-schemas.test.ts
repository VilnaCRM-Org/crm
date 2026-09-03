import { buildEmail, buildFullName, buildGraphqlUser } from '@tests/builders';

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
});
