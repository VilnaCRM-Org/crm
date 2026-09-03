import { gql } from '@apollo/client';
import { ApolloServer, type GraphQLResponse } from '@apollo/server';

// example
const typeDefs = `#graphql
  type Query {
    hello: String
  }
`;

const resolvers = {
  Query: {
    hello: (): string => 'Hello world!',
  },
};

function assertSingleResponse(
  body: GraphQLResponse['body']
): asserts body is Extract<GraphQLResponse['body'], { kind: 'single' }> {
  if (body.kind !== 'single') {
    throw new Error(`Expected a single GraphQL response body, received: ${body.kind}`);
  }
}

describe('Apollo Server', () => {
  it('returns hello world', async () => {
    const server = new ApolloServer({ typeDefs, resolvers });
    await server.start();
    try {
      const result = await server.executeOperation({
        query: gql`
          query {
            hello
          }
        `,
      });
      assertSingleResponse(result.body);
      expect(result.body.singleResult.errors).toBeUndefined();
      expect(result.body.singleResult.data?.hello).toBe('Hello world!');
    } finally {
      await server.stop();
    }
  });
});
