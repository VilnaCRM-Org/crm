import { CreateUserInput, User } from './type.js';
import { v4 as uuidv4 } from 'uuid';
import { GraphQLError } from 'graphql';

const validateCreateUserInput = (input: CreateUserInput) => {
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

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
function rejectIfExists<K, V>(
  collection: Map<K, V>,
  item: K,
  message = 'Item already exists',
  status = 409,
  code = 'BAD_REQUEST'
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
  },
};
