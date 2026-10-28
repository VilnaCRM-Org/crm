import fs from 'node:fs';
import path from 'node:path';

import { ApolloServer } from '@apollo/server';

import { buildClientMutationId, buildEmail, buildPassword } from '@tests/builders';

import { formatError } from '../../docker/apollo-server/lib/format-error';
import { resolvers } from '../../docker/apollo-server/lib/resolvers';
import { twoFactorResolvers } from '../../docker/apollo-server/lib/two-factor-resolvers';

import { assertSingleResponse, type SingleBody } from './mock-schema-fixtures';
import {
  COMPLETE,
  CONFIRM,
  DISABLE,
  PENDING_SDL_FILES,
  REGENERATE,
  SETUP,
  SIGN_IN,
  TWO_FACTOR_PENDING_SDL,
  TWO_FACTOR_TYPE_DEFS,
} from './two-factor-fixtures';

const repoRoot = path.resolve(__dirname, '..', '..');

const MOCK_RECOVERY_CODES = [
  'AB12-CD34',
  'EF56-GH78',
  'JK90-LM12',
  'NP34-QR56',
  'ST78-UV90',
  'WX12-YZ34',
  'AB56-CD78',
  'EF90-GH12',
];
const MOCK_SECRET = 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP';
const OTPAUTH_URI =
  'otpauth://totp/VilnaCRM%3Aolena.petrenko%40example.com' +
  `?secret=${MOCK_SECRET}&issuer=VilnaCRM`;
const EMAIL_VIOLATION = 'email: This value is not a valid email address.';
const CODE_VIOLATION = 'twoFactorCode: This value is not a valid two-factor code.';
const PASSWORD_VIOLATION = 'password: This value should not be blank.';
const PENDING_SESSION_VIOLATION = 'pendingSessionId: This value should not be blank.';

const execute = async (
  server: ApolloServer,
  query: string,
  input: Record<string, string>
): Promise<SingleBody['singleResult']> => {
  const response = await server.executeOperation({ query, variables: { input } });
  assertSingleResponse(response.body);
  return response.body.singleResult;
};

describe('2FA pending contract', () => {
  it('opens with the pending-against header the checker requires', () => {
    expect(TWO_FACTOR_PENDING_SDL.split('\n')[0]).toBe('# pending-against: v2.8.0');
  });

  it('names the source commit and the deleting follow-up in its header comment', () => {
    const header = TWO_FACTOR_PENDING_SDL.split('\n').slice(0, 8).join('\n');

    expect(header).toContain('a95c1e854bf21770b7fc630611a8257b0f9c600b');
    expect(header).toContain('Follow-up 5.1');
  });

  it('extends Mutation once with the six operations in the upstream order', () => {
    const extensions = TWO_FACTOR_PENDING_SDL.match(/extend type Mutation \{[^}]*\}/gu) ?? [];
    const fields = (extensions[0] ?? '').match(/^ {2}(\w+)\(/gmu) ?? [];

    expect(TWO_FACTOR_PENDING_SDL.match(/extend type /gu)).toHaveLength(1);
    expect(extensions).toHaveLength(1);
    expect(fields.map((field) => field.trim().slice(0, -1))).toEqual([
      'signInUser',
      'completeTwoFactorUser',
      'setupTwoFactorUser',
      'confirmTwoFactorUser',
      'disableTwoFactorUser',
      'regenerateRecoveryCodesUser',
    ]);
  });

  it('declares scalar Iterable once across all pending files', () => {
    const declarations = PENDING_SDL_FILES.flatMap(
      (file) => file.match(/^scalar Iterable$/gmu) ?? []
    );

    expect(declarations).toHaveLength(1);
  });

  it('gives every payload data type the twelve upstream fields in order', () => {
    const bodies = [
      ...TWO_FACTOR_PENDING_SDL.matchAll(/type \w+PayloadData implements Node \{([^}]*)\}/gu),
    ].map(([, body = '']) =>
      body
        .trim()
        .split('\n')
        .map((line) => line.trim())
    );

    expect(bodies).toHaveLength(6);
    for (const fields of bodies) {
      expect(fields).toEqual([
        'id: ID!',
        '_id: String!',
        'success: Boolean!',
        'twoFactorEnabled: Boolean',
        'accessToken: String',
        'refreshToken: String',
        'pendingSessionId: String',
        'otpauthUri: String',
        'secret: String',
        'recoveryCodes: Iterable!',
        'recoveryCodesRemaining: Int',
        'warning: String',
      ]);
    }
  });

  it('maps Iterable to unknown in codegen and leaves the schema array alone', () => {
    const codegen = fs.readFileSync(path.join(repoRoot, 'codegen.ts'), 'utf-8');

    expect(codegen).toContain("scalars: { ID: 'string', Iterable: 'unknown' }");
    expect(codegen).toContain('schema: [schemaPath, pendingSchemaPath]');
    expect(codegen).toContain("'src/api/contracts/pending/*.graphql'");
  });
});

describe('2FA operations on the stateless mock', () => {
  let server: ApolloServer;

  beforeEach(async () => {
    server = new ApolloServer({ typeDefs: TWO_FACTOR_TYPE_DEFS, resolvers, formatError });
    await server.start();
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await server.stop();
  });

  describe('composition', () => {
    it('spreads the six 2FA resolvers into the mutation map beside createUser', () => {
      expect(Object.keys(twoFactorResolvers.Mutation)).toEqual([
        'signInUser',
        'completeTwoFactorUser',
        'setupTwoFactorUser',
        'confirmTwoFactorUser',
        'disableTwoFactorUser',
        'regenerateRecoveryCodesUser',
      ]);
      for (const [name, resolver] of Object.entries(twoFactorResolvers.Mutation)) {
        expect(resolvers.Mutation).toHaveProperty(name, resolver);
      }
      expect(resolvers.Mutation).toHaveProperty('createUser');
    });
  });

  describe('signInUser', () => {
    it('answers an access token with twoFactorEnabled false for an ordinary e-mail', async () => {
      const clientMutationId = buildClientMutationId();

      const result = await execute(server, SIGN_IN, {
        email: buildEmail(),
        password: buildPassword(),
        clientMutationId,
      });

      expect(result.errors).toBeUndefined();
      expect(result.data).toEqual({
        signInUser: {
          user: {
            success: true,
            twoFactorEnabled: false,
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token',
            pendingSessionId: null,
          },
          clientMutationId,
        },
      });
    });

    it.each(['2fa@example.com', '2FA@example.com'])(
      'answers a pending session id and no token for %s',
      async (email) => {
        const result = await execute(server, SIGN_IN, { email, password: buildPassword() });

        expect(result.errors).toBeUndefined();
        expect(result.data).toEqual({
          signInUser: {
            user: {
              success: true,
              twoFactorEnabled: true,
              accessToken: null,
              refreshToken: null,
              pendingSessionId: '01JAQZ8M3K5N7P9R2T4V6X8Z0B',
            },
            clientMutationId: null,
          },
        });
      }
    );

    it('does not treat a local part that merely contains 2fa as a challenge', async () => {
      const result = await execute(server, SIGN_IN, {
        email: 'my2fa@example.com',
        password: buildPassword(),
      });

      expect(result.data).toMatchObject({
        signInUser: { user: { twoFactorEnabled: false, pendingSessionId: null } },
      });
    });

    it.each([
      ['a malformed address', 'not-an-email'],
      ['an address over 254 characters', `${'a'.repeat(250)}@example.com`],
    ])('rejects %s with a coded email violation at 422', async (_label, email) => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);

      const result = await execute(server, SIGN_IN, { email, password: buildPassword() });

      expect(result.errors).toHaveLength(1);
      expect(result.errors?.[0]?.message).toBe(EMAIL_VIOLATION);
      expect(result.errors?.[0]?.extensions).toMatchObject({
        code: 'BAD_USER_INPUT',
        status: 422,
      });
      expect(consoleError).toHaveBeenCalledWith('GraphQL Error:', expect.anything());
    });

    it.each(['', '   '])(
      'rejects the blank password %p with a coded password violation and no token',
      async (password) => {
        const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);

        const result = await execute(server, SIGN_IN, { email: buildEmail(), password });

        expect(result.errors).toHaveLength(1);
        expect(result.errors?.[0]?.message).toBe(PASSWORD_VIOLATION);
        expect(result.errors?.[0]?.extensions).toMatchObject({
          code: 'BAD_USER_INPUT',
          status: 422,
        });
        expect(result.data).toEqual({ signInUser: null });
        expect(consoleError).toHaveBeenCalledWith('GraphQL Error:', expect.anything());
      }
    );

    it('checks the email before the password', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);

      const result = await execute(server, SIGN_IN, { email: 'not-an-email', password: '' });

      expect(result.errors?.[0]?.message).toBe(EMAIL_VIOLATION);
      expect(consoleError).toHaveBeenCalledWith('GraphQL Error:', expect.anything());
    });
  });

  describe('completeTwoFactorUser', () => {
    const pendingSessionId = '01JAQZ8M3K5N7P9R2T4V6X8Z0B';

    it('answers an access token for 123456', async () => {
      const clientMutationId = buildClientMutationId();

      const result = await execute(server, COMPLETE, {
        pendingSessionId,
        twoFactorCode: '123456',
        clientMutationId,
      });

      expect(result.errors).toBeUndefined();
      expect(result.data).toEqual({
        completeTwoFactorUser: {
          user: {
            twoFactorEnabled: true,
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token',
            recoveryCodesRemaining: null,
          },
          clientMutationId,
        },
      });
    });

    it.each(['', '   '])(
      'rejects the blank pending session id %p before checking the code',
      async (blankSessionId) => {
        const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);

        const result = await execute(server, COMPLETE, {
          pendingSessionId: blankSessionId,
          twoFactorCode: '123456',
        });

        expect(result.errors).toHaveLength(1);
        expect(result.errors?.[0]?.message).toBe(PENDING_SESSION_VIOLATION);
        expect(result.errors?.[0]?.extensions).toMatchObject({
          code: 'BAD_USER_INPUT',
          status: 422,
        });
        expect(result.data).toEqual({ completeTwoFactorUser: null });
        expect(consoleError).toHaveBeenCalledWith('GraphQL Error:', expect.anything());
      }
    );

    it.each(['12345', '1234567', 'abcdef', 'ABCD2345', 'abc-123', '123 456'])(
      'rejects the malformed code %p with a coded twoFactorCode violation at 422',
      async (twoFactorCode) => {
        const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);

        const result = await execute(server, COMPLETE, { pendingSessionId, twoFactorCode });

        expect(result.errors).toHaveLength(1);
        expect(result.errors?.[0]?.message).toBe(CODE_VIOLATION);
        expect(result.errors?.[0]?.extensions).toMatchObject({
          code: 'BAD_USER_INPUT',
          status: 422,
        });
        expect(consoleError).toHaveBeenCalledWith('GraphQL Error:', expect.anything());
      }
    );

    it.each(['654321', 'ABCD-2345'])(
      'answers the upstream 401 message for the well-formed but wrong code %p',
      async (twoFactorCode) => {
        const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);

        const result = await execute(server, COMPLETE, { pendingSessionId, twoFactorCode });

        expect(result.errors).toHaveLength(1);
        expect(result.errors?.[0]?.message).toBe('Invalid two-factor code.');
        expect(result.errors?.[0]?.extensions).toEqual({ code: 'UNAUTHENTICATED', status: 401 });
        expect(result.data).toEqual({ completeTwoFactorUser: null });
        expect(consoleError).toHaveBeenCalledWith('GraphQL Error:', expect.anything());
      }
    );
  });

  describe('setupTwoFactorUser', () => {
    it('answers a fixed otpauth URI and a 32-character base32 secret', async () => {
      const clientMutationId = buildClientMutationId();

      const first = await execute(server, SETUP, { clientMutationId });
      const second = await execute(server, SETUP, { clientMutationId });

      expect(first.errors).toBeUndefined();
      expect(MOCK_SECRET).toMatch(/^[A-Z2-7]{32}$/u);
      expect(first.data).toEqual({
        setupTwoFactorUser: {
          user: {
            otpauthUri: OTPAUTH_URI,
            secret: MOCK_SECRET,
          },
          clientMutationId,
        },
      });
      expect(second.data).toEqual(first.data);
    });

    it('accepts an input without a clientMutationId', async () => {
      const result = await execute(server, SETUP, {});

      expect(result.errors).toBeUndefined();
      expect(result.data).toMatchObject({ setupTwoFactorUser: { clientMutationId: null } });
    });
  });

  describe('confirmTwoFactorUser', () => {
    it('answers the eight fixed recovery codes for a TOTP code', async () => {
      const clientMutationId = buildClientMutationId();

      const result = await execute(server, CONFIRM, { twoFactorCode: '654321', clientMutationId });

      expect(result.errors).toBeUndefined();
      expect(result.data).toEqual({
        confirmTwoFactorUser: { user: { recoveryCodes: MOCK_RECOVERY_CODES }, clientMutationId },
      });
    });

    it.each(['12345', 'abcdef', 'ABCD-2345'])(
      'rejects %p, because confirm takes a TOTP code only',
      async (twoFactorCode) => {
        const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);

        const result = await execute(server, CONFIRM, { twoFactorCode });

        expect(result.errors?.[0]?.message).toBe(CODE_VIOLATION);
        expect(result.errors?.[0]?.extensions).toMatchObject({
          code: 'BAD_USER_INPUT',
          status: 422,
        });
        expect(consoleError).toHaveBeenCalledWith('GraphQL Error:', expect.anything());
      }
    );
  });

  describe('disableTwoFactorUser', () => {
    it.each(['123456', 'ABCD-2345', 'abcd-2345'])(
      'answers success for the code %p',
      async (twoFactorCode) => {
        const clientMutationId = buildClientMutationId();

        const result = await execute(server, DISABLE, { twoFactorCode, clientMutationId });

        expect(result.errors).toBeUndefined();
        expect(result.data).toEqual({
          disableTwoFactorUser: { user: { success: true }, clientMutationId },
        });
      }
    );

    it.each(['12345', 'abcdef', 'ABCD2345'])(
      'rejects the malformed code %p with a coded twoFactorCode violation at 422',
      async (twoFactorCode) => {
        const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);

        const result = await execute(server, DISABLE, { twoFactorCode });

        expect(result.errors?.[0]?.message).toBe(CODE_VIOLATION);
        expect(result.errors?.[0]?.extensions).toMatchObject({
          code: 'BAD_USER_INPUT',
          status: 422,
        });
        expect(consoleError).toHaveBeenCalledWith('GraphQL Error:', expect.anything());
      }
    );
  });

  describe('regenerateRecoveryCodesUser', () => {
    it('answers the same eight fixed codes on every call', async () => {
      const clientMutationId = buildClientMutationId();

      const first = await execute(server, REGENERATE, { clientMutationId });
      const second = await execute(server, REGENERATE, {});

      expect(first.errors).toBeUndefined();
      expect(first.data).toEqual({
        regenerateRecoveryCodesUser: {
          user: { recoveryCodes: MOCK_RECOVERY_CODES },
          clientMutationId,
        },
      });
      expect(second.data).toEqual({
        regenerateRecoveryCodesUser: {
          user: { recoveryCodes: MOCK_RECOVERY_CODES },
          clientMutationId: null,
        },
      });
    });

    it('lists each code in the XXXX-XXXX shape of A-Z and 0-9', () => {
      expect(MOCK_RECOVERY_CODES).toHaveLength(8);
      for (const code of MOCK_RECOVERY_CODES) {
        expect(code).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/u);
      }
    });
  });

  describe('error shaping by the shared formatError', () => {
    it('keeps a violation message thrown with BAD_USER_INPUT', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);

      const result = await execute(server, CONFIRM, { twoFactorCode: 'nope' });

      expect(result.errors?.[0]?.message).toBe(CODE_VIOLATION);
      expect(consoleError).toHaveBeenCalledTimes(1);
    });

    it('would replace the same message with the generic one under BAD_REQUEST', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);

      const shaped = formatError(
        { message: CODE_VIOLATION, extensions: { code: 'BAD_REQUEST', status: 422 } },
        new Error(CODE_VIOLATION)
      );

      expect(shaped.message).toBe('The request was invalid. Please check your input.');
      expect(consoleError).toHaveBeenCalledTimes(1);
    });
  });
});
