import container from '@/config/dependency-injection-config';
import TOKENS from '@/config/tokens';
import HttpClientFactory from '@/services/https-client/https-client-factory';
import type { HttpsClient } from '@/services/https-client/https-client.types';

class StubHttpsClient implements HttpsClient {
  public async get<T>(_url: string): Promise<T | undefined> {
    return undefined;
  }

  public async post<T, R>(_url: string, _data: T): Promise<R | undefined> {
    return undefined;
  }

  public async patch<T, R>(_url: string, _data: T): Promise<R | undefined> {
    return undefined;
  }

  public async put<T, R>(_url: string, _data: T): Promise<R | undefined> {
    return undefined;
  }

  public async delete<T, R>(_url: string, _data?: T): Promise<R | undefined> {
    return undefined;
  }
}

describe('HttpClientFactory Integration', () => {
  it('resolves from the DI container', () => {
    const factory = container.resolve<HttpClientFactory>(TOKENS.HttpClientFactory);

    expect(factory).toBeInstanceOf(HttpClientFactory);
  });

  it('registers, instantiates, and caches a client by name', () => {
    const factory = new HttpClientFactory();
    factory.registerClient('primary', StubHttpsClient);

    const first = factory.initiateClient('primary');
    const second = factory.initiateClient('primary');

    expect(first).toBeInstanceOf(StubHttpsClient);
    expect(second).toBe(first);
  });

  it('throws when initiating an unregistered client', () => {
    const factory = new HttpClientFactory();

    expect(() => factory.initiateClient('missing')).toThrow(
      'HttpClient for "missing" not registered.'
    );
  });
});
