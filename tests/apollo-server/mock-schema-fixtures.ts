import fs from 'node:fs';
import path from 'node:path';

import type { GraphQLResponse } from '@apollo/server';

export const PINNED_SDL_FIXTURE = `#graphql
  type Query {
    ping: Boolean
  }

  type User {
    id: ID!
    confirmed: Boolean!
    email: String!
    initials: String!
  }

  input createUserInput {
    clientMutationId: String
    email: String!
    initials: String!
    password: String!
  }

  type createUserPayload {
    user: User
    clientMutationId: String
  }

  type Mutation {
    createUser(input: createUserInput!): createUserPayload
  }
`;

export const PROFILE_SDL_FIXTURE = `#graphql
  type UserPageInfo {
    endCursor: String
    startCursor: String
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
  }

  type UserEdge {
    node: User
    cursor: String!
  }

  type UserCursorConnection {
    edges: [UserEdge]
    pageInfo: UserPageInfo!
    totalCount: Int!
  }

  extend type Query {
    users(first: Int, last: Int, before: String, after: String): UserCursorConnection
  }

  input updateUserInput {
    clientMutationId: String
    id: ID!
    newPassword: String
    password: String!
    email: String
    initials: String
  }

  type updateUserPayload {
    user: User
    clientMutationId: String
  }

  input resendEmailToUserInput {
    id: ID!
    clientMutationId: String
  }

  type resendEmailToUserPayload {
    user: User
    clientMutationId: String
  }

  extend type Mutation {
    updateUser(input: updateUserInput!): updateUserPayload
    resendEmailToUser(input: resendEmailToUserInput!): resendEmailToUserPayload
  }
`;

export const REQUEST_RESET = `
  mutation RequestPasswordReset($input: requestPasswordResetUserInput!) {
    requestPasswordResetUser(input: $input) {
      user {
        id
      }
      clientMutationId
    }
  }
`;

export type SingleBody = Extract<GraphQLResponse['body'], { kind: 'single' }>;

export interface OAuthEnvSandbox {
  clear(): void;
  restore(): void;
}

const OAUTH_ENV_KEYS = [
  'OAUTH_MODE',
  'OAUTH_SPA_ORIGIN',
  'OAUTH_GOOGLE_CLIENT_ID',
  'OAUTH_GITHUB_CLIENT_ID',
  'OAUTH_FACEBOOK_CLIENT_ID',
  'OAUTH_TWITTER_CLIENT_ID',
  'REACT_APP_MOCKOON_URL',
];

export function oauthEnvSandbox(): OAuthEnvSandbox {
  const saved = new Map(OAUTH_ENV_KEYS.map((key) => [key, process.env[key]]));
  return {
    clear: () => OAUTH_ENV_KEYS.forEach((key) => delete process.env[key]),
    restore: () =>
      saved.forEach((value, key) => {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }),
  };
}

export function assertSingleResponse(body: GraphQLResponse['body']): asserts body is SingleBody {
  if (body.kind !== 'single') {
    throw new Error(`Expected a single GraphQL response body, received: ${body.kind}`);
  }
}

const pendingSdl = (name: string): string =>
  fs.readFileSync(
    path.join(__dirname, '..', '..', 'src', 'api', 'contracts', 'pending', `${name}.graphql`),
    'utf-8'
  );

export const PASSWORD_RESET_SDL = pendingSdl('password-reset');

// The social extensions the shared resolver map answers; every server built from that map needs
// them in its schema (specs/social-sign-in, specs/social-account-linking).
export const SOCIAL_SDL = [
  `#graphql
  interface Node {
    id: ID!
  }
`,
  pendingSdl('social-sign-in'),
  pendingSdl('social-account-linking'),
];
