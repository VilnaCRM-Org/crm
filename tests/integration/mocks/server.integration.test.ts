import '../setup';

import server, { defaultClientMutationId, defaultGraphqlUser, GRAPHQL_URL } from './server';

const post = (operationName: string, query: string): Promise<Response> =>
  fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ operationName, query, variables: {} }),
  });

describe('integration msw server default handlers', () => {
  afterEach(() => server.resetHandlers());

  it('answers the CreateUser operation with the default user', async () => {
    const response = await post(
      'CreateUser',
      'mutation CreateUser { createUser(input: {}) { clientMutationId } }'
    );

    expect(await response.json()).toEqual({
      data: {
        createUser: { user: defaultGraphqlUser, clientMutationId: defaultClientMutationId },
      },
    });
  });

  it('fails an operation no handler names instead of answering it', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    await expect(
      post('SetupTwoFactorUser', 'mutation SetupTwoFactorUser { setupTwoFactorUser { user } }')
    ).rejects.toThrow();

    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining('intercepted a request without a matching request handler')
    );
  });
});
