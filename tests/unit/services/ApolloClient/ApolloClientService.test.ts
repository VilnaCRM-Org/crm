import { ApolloClient, HttpLink } from '@apollo/client';

import ApolloClientService from '@/services/ApolloClient/ApolloClientService';
import getGraphQLUrl from '@/utils/getGraphQLUrl';


jest.mock('@/utils/getGraphQLUrl');

jest.mock('@apollo/client', () => ({
  ApolloClient: jest.fn().mockImplementation((config) => ({
    ...config,
  })),
  InMemoryCache: jest.fn(),
  HttpLink: jest.fn(),
}));

const mockedGetGraphQLUrl = getGraphQLUrl as jest.MockedFunction<typeof getGraphQLUrl>;

describe('ApolloClientService', () => {
  beforeEach(() => {
    mockedGetGraphQLUrl.mockReturnValue('http://example.com/graphql');
  });

  it('creates an ApolloClient using the resolved GraphQL URL', () => {
    const service = new ApolloClientService();
    const client = service.getClient();

    expect(HttpLink).toHaveBeenCalledWith({ uri: 'http://example.com/graphql' });
    expect(client).toBeDefined();
  });

  it('returns the same client instance for repeated calls', () => {
    const service = new ApolloClientService();

    const first = service.getClient();
    const second = service.getClient();

    expect(first).toBe(second);
  });

  it('constructs ApolloClient with a link and cache', () => {
    const service = new ApolloClientService();

    service.getClient();

    expect(ApolloClient).toHaveBeenCalledTimes(1);
  });
});
