import { CreateUserInput, CreateUserResponse, User } from './type.js';
import { v4 as uuidv4 } from 'uuid';
import { GraphQLError } from 'graphql';

const validateCreateUserInput = (input: CreateUserInput) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
const users = new Map<string, User>();

export const resolvers = {
  Mutation: {
    createUser: async (
      _: unknown,
      { input }: { input: CreateUserInput }
    ): Promise<CreateUserResponse> => {
      validateCreateUserInput(input);
      try {
        const newUser: User = {
          id: input.clientMutationId || uuidv4(),
          confirmed: true,
          email: input.email,
          initials: input.initials,
        };
        users.set(newUser.email, newUser);
        return {
          data: {
            createUser: {
              user: newUser,
              clientMutationId: input.clientMutationId,
            },
          },
        };
      } catch (error) {
        console.error('Failed to create user:', error);
        throw new GraphQLError('Internal Server Error: Failed to create user', {
          extensions: {
            code: 'INTERNAL_SERVER_ERROR',
            originalError: error instanceof Error ? error.message : String(error),
            http: {
              status: 500,
              headers: { 'x-error-type': 'server-error' },
            },
          },
        });
      }
    },
  },
};
