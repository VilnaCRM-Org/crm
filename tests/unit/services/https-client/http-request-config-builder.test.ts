import HttpRequestConfigBuilder from '@/services/https-client/http-request-config-builder';
import correlationIdProvider, {
  CorrelationIdProvider,
} from '@/services/observability/correlation-id-provider';

jest.mock('uuid', () => ({ v4: (): string => 'test-request-id' }));

describe('HttpRequestConfigBuilder', () => {
  const builder = new HttpRequestConfigBuilder(correlationIdProvider);

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

  it('takes the header name and the id from the injected correlation-id provider', () => {
    const injected: CorrelationIdProvider = {
      header: 'X-Trace-Id',
      currentId: '',
      next: (): string => 'injected-id',
    };

    const config = new HttpRequestConfigBuilder(injected).create('GET', undefined, {
      'x-trace-id': 'caller-id',
    });
    const headers = config.headers as Record<string, string>;

    expect(headers['X-Trace-Id']).toBe('injected-id');
    expect(headers['x-trace-id']).toBeUndefined();
    expect(headers['X-Request-Id']).toBeUndefined();
  });

  it('resolves the correlation id per request rather than once per builder', () => {
    const ids = ['first-id', 'second-id'];
    const injected: CorrelationIdProvider = {
      header: 'X-Request-Id',
      currentId: '',
      next: (): string => ids.shift() ?? 'exhausted',
    };
    const perRequestBuilder = new HttpRequestConfigBuilder(injected);

    const firstConfig = perRequestBuilder.create('GET', undefined, undefined);
    const secondConfig = perRequestBuilder.create('GET', undefined, undefined);
    const firstHeaders = firstConfig.headers as Record<string, string>;
    const secondHeaders = secondConfig.headers as Record<string, string>;

    expect(firstHeaders['X-Request-Id']).toBe('first-id');
    expect(secondHeaders['X-Request-Id']).toBe('second-id');
  });
});
