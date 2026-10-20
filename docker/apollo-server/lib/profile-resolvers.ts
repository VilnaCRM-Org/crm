import { GraphQLError } from 'graphql';

import type {
  ResendEmailToUserInput,
  UpdateUserInput,
  User,
  UserConnection,
  UserPayload,
} from './types';
import { EMAIL_REGEX, MAX_EMAIL_LENGTH, rejectViolation } from './violations';

const SEEDED_USER: User = {
  id: '/api/users/0193a9e2-7c1d-7d8e-9f3a-5b6c7d8e9f01',
  email: 'olena.petrenko@example.com',
  initials: 'Олена Петренко',
  confirmed: true,
};

const SEEDED_CURSOR = 'MA==';

export const profileResolvers = {
  Query: {
    users: async (): Promise<UserConnection> => ({
      edges: [{ node: SEEDED_USER, cursor: SEEDED_CURSOR }],
      pageInfo: {
        startCursor: SEEDED_CURSOR,
        endCursor: SEEDED_CURSOR,
        hasNextPage: false,
        hasPreviousPage: false,
      },
      totalCount: 1,
    }),
  },
  Mutation: {
    updateUser: async (_: unknown, { input }: { input: UpdateUserInput }): Promise<UserPayload> => {
      if (input.id !== SEEDED_USER.id) {
        throw new GraphQLError('Access Denied.', {
          extensions: { code: 'FORBIDDEN', status: 403 },
        });
      }
      const email = input.email ?? SEEDED_USER.email;
      if (email.length > MAX_EMAIL_LENGTH || !EMAIL_REGEX.test(email)) {
        rejectViolation('email', 'This value is not a valid email address.');
      }
      return {
        user: {
          ...SEEDED_USER,
          initials: input.initials ?? SEEDED_USER.initials,
          email,
          confirmed: email === SEEDED_USER.email,
        },
        clientMutationId: input.clientMutationId ?? null,
      };
    },
    resendEmailToUser: async (
      _: unknown,
      { input }: { input: ResendEmailToUserInput }
    ): Promise<UserPayload> => ({
      user: SEEDED_USER,
      clientMutationId: input.clientMutationId ?? null,
    }),
  },
};
