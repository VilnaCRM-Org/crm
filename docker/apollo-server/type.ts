import { GraphQLResolveInfo, GraphQLFormattedError } from 'graphql';

export interface CreateUserInput {
  email: string;
  initials: string;
  clientMutationId: string;
}

export interface User {
  id: string;
  confirmed: boolean;
  email: string;
  initials: string;
}

interface CreateUserPayload {
  user: User;
  clientMutationId: string;
}

export interface CreateUserResponse {
  data: {
    createUser: CreateUserPayload;
  };
  errors?: { message: string }[];
}

export interface MutationResolvers {
  /**
   * Creates a new user.
   *
   * @param parent - The parent object, typically not used in root-level resolvers.
   * @param args - An object containing the `input` field, which holds the user data required for creation.
   * @param context - The GraphQL execution context, providing access to authentication, database, loaders, etc.
   * @param info - Information about the GraphQL execution state, including the query AST and schema details.
   *
   * @returns Promise resolving to `CreateUserPayload` containing the created user and `clientMutationId`.
   */
  createUser: (
    parent: unknown,
    args: { input: CreateUserInput },
    context: unknown,
    info: GraphQLResolveInfo
  ) => Promise<CreateUserPayload>;
}

export interface CustomFormattedError extends GraphQLFormattedError {
  details?: string;
}
