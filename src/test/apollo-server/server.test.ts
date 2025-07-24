import { gql } from '@apollo/client';
import { ApolloServer } from '@apollo/server';

// example
const typeDefs = `#graphql
  type Query {
    hello: String
  }
`;

const resolvers = {
  Query: {
    hello: () => 'Hello world!',
  },
};

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
      if (result.body.kind === 'single') {
        expect(result.body.singleResult?.data?.hello).toBe('Hello world!');
      } else if (result.body.kind === 'incremental') {
        expect(result.body.initialResult?.data?.hello).toBe('Hello world!');
      }
    } finally {
      await server.stop();
    }
  });
});
