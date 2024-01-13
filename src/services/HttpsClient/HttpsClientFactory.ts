import HttpsClient from '@/services/HttpsClient/HttpsClient';

export default class HttpClientFactory {
  private clientConstructors = new Map<string, new () => HttpsClient>();

  public registerClient(name: string, constructor: new () => HttpsClient): void {
    this.clientConstructors.set(name, constructor);
  }

  public initiateClient(name: string): HttpsClient {
    // TODO: need just create one instance of HttpClient, maybe Singleton pattern?
    const Constructor = this.clientConstructors.get(name);
    if (!Constructor) {
      throw new Error(`HttpClient for "${name}" not registered.`);
    }
    return new Constructor();
  }
}
