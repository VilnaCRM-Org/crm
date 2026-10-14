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

export function assertSingleResponse(body: GraphQLResponse['body']): asserts body is SingleBody {
  if (body.kind !== 'single') {
    throw new Error(`Expected a single GraphQL response body, received: ${body.kind}`);
  }
}
