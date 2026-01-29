import { ApolloClient } from '@apollo/client';

import '../../setup';

import ApolloClientService from '@/services/ApolloClient/ApolloClientService';
import getGraphQLUrl from '@/utils/getGraphQLUrl';

jest.mock('@/utils/getGraphQLUrl');

const mockedGetGraphQLUrl = getGraphQLUrl as jest.MockedFunction<typeof getGraphQLUrl>;

describe('ApolloClientService Integration', () => {
  beforeEach(() => {
    mockedGetGraphQLUrl.mockReturnValue('http://example.com/graphql');
  });

  it('returns an ApolloClient instance', () => {
    const service = new ApolloClientService();

    expect(service.getClient()).toBeInstanceOf(ApolloClient);
  });
});
