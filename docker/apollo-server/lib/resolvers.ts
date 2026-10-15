import { GraphQLError } from 'graphql';
import { v4 as uuidv4 } from 'uuid';

import {
  ConfirmPasswordResetInput,
  CreateUserInput,
  PasswordResetPayload,
  RequestPasswordResetInput,
  User,
} from './types';

const EMAIL_LOCAL = String.raw`[a-zA-Z0-9.!#$%&'*+/=?^_\`{|}~-]+`;
const EMAIL_LABEL = String.raw`[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?`;
const EMAIL_REGEX = new RegExp(`^${EMAIL_LOCAL}@${EMAIL_LABEL}(?:\\.${EMAIL_LABEL})*$`);

const validateCreateUserInput = (input: CreateUserInput): void => {
  const emailRegex = EMAIL_REGEX;

  if (!input.email || !emailRegex.test(input.email)) {
    throw new GraphQLError('Invalid email format', {
      extensions: {
        code: 'BAD_REQUEST',
        http: { status: 400 },
      },
    });
  }

  if (!input.initials || input.initials.length < 2) {
    throw new GraphQLError('Invalid initials', {
      extensions: {
        code: 'BAD_REQUEST',
        http: { status: 400 },
      },
    });
  }
};

const PASSWORD_REGEX = /^(?=.*[0-9])(?=.*[A-Z]).{8,64}$/u;
const MAX_TOKEN_LENGTH = 255;
const MAX_EMAIL_LENGTH = 254;

const rejectViolation = (property: string, reason: string): never => {
  throw new GraphQLError(`${property}: ${reason}`, {
    extensions: { code: 'BAD_USER_INPUT', status: 422 },
  });
};

const passwordResetPayload = (clientMutationId?: string | null): PasswordResetPayload => ({
  user: null,
  clientMutationId: clientMutationId ?? null,
});

function rejectIfExists<K, V>(
  collection: Map<K, V>,
  item: K,
  message = 'Item already exists',
  status = 409,
  code = 'CONFLICT'
): void {
  if (collection.has(item)) {
    throw new GraphQLError(message, {
      extensions: {
        code,
        http: { status },
      },
    });
  }
}

const users = new Map<string, User>();

export function clearUsers(): void {
  users.clear();
}

export const resolvers = {
  Mutation: {
    createUser: async (
      _: unknown,
      { input }: { input: CreateUserInput }
    ): Promise<{ user: User; clientMutationId: string }> => {
      validateCreateUserInput(input);
      rejectIfExists(users, input.email, 'Email already exists');

      try {
        const newUser: User = {
          id: uuidv4(),
          confirmed: true,
          email: input.email,
          initials: input.initials,
        };
        users.set(newUser.email, newUser);
        return { user: newUser, clientMutationId: input.clientMutationId };
      } catch (error) {
        console.error('Failed to create user:', error);
        throw new GraphQLError('Internal Server Error: Failed to create user', {
          extensions: {
            code: 'INTERNAL_SERVER_ERROR',
            http: { status: 500, headers: { 'x-error-type': 'server-error' } },
          },
        });
      }
    },
    requestPasswordResetUser: async (
      _: unknown,
      { input }: { input: RequestPasswordResetInput }
    ): Promise<PasswordResetPayload> => {
      if (input.email.length > MAX_EMAIL_LENGTH || !EMAIL_REGEX.test(input.email)) {
        rejectViolation('email', 'This value is not a valid email address.');
      }
      return passwordResetPayload(input.clientMutationId);
    },
    confirmPasswordResetUser: async (
      _: unknown,
      { input }: { input: ConfirmPasswordResetInput }
    ): Promise<PasswordResetPayload> => {
      if (input.token.trim().length === 0 || input.token.length > MAX_TOKEN_LENGTH) {
        rejectViolation('token', 'This value should not be blank or longer than 255 characters.');
      }
      if (!PASSWORD_REGEX.test(input.newPassword)) {
        rejectViolation(
          'newPassword',
          'Password must be 8 to 64 characters long and contain a number and an uppercase letter.'
        );
      }
      return passwordResetPayload(input.clientMutationId);
    },
  },
};

// Expose internal helpers for targeted testing
export const __test__ = { rejectIfExists };
