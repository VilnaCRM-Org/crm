import HttpRequestConfigBuilder from '@/services/HttpsClient/http-request-config-builder';

describe('HttpRequestConfigBuilder', () => {
  const builder = new HttpRequestConfigBuilder();

  it('does not serialize null bodies into the request payload', () => {
    const config = builder.create('POST', null, undefined);

    expect(config).toEqual({
      method: 'POST',
      headers: {
        Accept: 'application/json',
      },
    });
  });
});
