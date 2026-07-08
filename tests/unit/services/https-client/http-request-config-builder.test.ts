import HttpRequestConfigBuilder from '@/services/https-client/http-request-config-builder';

jest.mock('uuid', () => ({ v4: (): string => 'test-request-id' }));

describe('HttpRequestConfigBuilder', () => {
  const builder = new HttpRequestConfigBuilder();

  it('does not serialize null bodies into the request payload', () => {
    const config = builder.create('POST', null, undefined);

    expect(config).toEqual({
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'X-Request-Id': 'test-request-id',
      },
    });
  });

  it('adds a generated X-Request-Id correlation header to every request', () => {
    const config = builder.create('GET', undefined, undefined);
    const headers = config.headers as Record<string, string>;

    expect(headers['X-Request-Id']).toBe('test-request-id');
  });

  it('overrides a caller-provided X-Request-Id with the generated correlation id', () => {
    const config = builder.create('GET', undefined, { 'X-Request-Id': 'caller-id' });
    const headers = config.headers as Record<string, string>;

    expect(headers['X-Request-Id']).toBe('test-request-id');
  });

  it('replaces a differently-cased caller correlation header with the generated id', () => {
    const config = builder.create('GET', undefined, { 'x-request-id': 'caller-id' });
    const headers = config.headers as Record<string, string>;

    expect(headers['X-Request-Id']).toBe('test-request-id');
    expect(headers['x-request-id']).toBeUndefined();
  });
});
