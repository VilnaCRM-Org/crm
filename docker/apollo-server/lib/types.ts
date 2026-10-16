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

export interface RequestPasswordResetInput {
  email: string;
  clientMutationId?: string | null;
}

export interface ConfirmPasswordResetInput {
  token: string;
  newPassword: string;
  clientMutationId?: string | null;
}

export interface UpdateUserInput {
  id: string;
  initials?: string | null;
  email?: string | null;
  newPassword?: string | null;
  oldPassword?: string | null;
  clientMutationId?: string | null;
}

export interface ResendEmailToUserInput {
  id: string;
  clientMutationId?: string | null;
}

export interface UserPayload {
  user: User;
  clientMutationId: string | null;
}

export interface UserEdge {
  node: User;
  cursor: string;
}

export interface UserPageInfo {
  startCursor: string;
  endCursor: string;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface UserConnection {
  edges: UserEdge[];
  pageInfo: UserPageInfo;
  totalCount: number;
}

export interface PasswordResetPayload {
  user: null;
  clientMutationId: string | null;
}

interface CreateUserPayload {
  user: User;
  clientMutationId: string;
}

export interface CreateUserResponse {
  data: {
    createUser: CreateUserPayload;
  };
  errors?: CustomFormattedError[];
}

export interface MutationResolvers {
  /**
   * Creates a new user.
   *
   * @param parent - The parent object, typically not used in root-level resolvers.
   * @param args - Object containing the `input` field with the user data required for creation.
   * @param context - GraphQL execution context (auth, database, loaders, etc).
   * @param info - GraphQL execution state, including the query AST and schema details.
   *
   * @returns Promise resolving to `CreateUserPayload` with the created user and `clientMutationId`.
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

export interface SchemaSource {
  schemaFilePath: string;
  pendingSchemaDir: string;
}
