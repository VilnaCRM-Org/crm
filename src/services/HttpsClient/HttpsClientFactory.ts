import HttpsClient from '@/services/HttpsClient/HttpsClient';

export default class HttpClientFactory {
  private clientConstructors = new Map<string, new () => HttpsClient>();

  private clientInstances = new Map<string, HttpsClient>();

  public registerClient(name: string, clientConstructor: new () => HttpsClient): void {
    this.clientConstructors.set(name, clientConstructor);
  }

  public initiateClient(name: string): HttpsClient {
    // TODO: need just create one instance of HttpClient, maybe Singleton pattern?

    const existingInstance = this.clientInstances.get(name);
    if (existingInstance) {
      return existingInstance;
    }

    const Constructor = this.clientConstructors.get(name);
    if (!Constructor) {
      throw new Error(`HttpClient for "${name}" not registered.`);
    }

    const instance = new Constructor();
    this.clientInstances.set(name, instance);
    return instance;
  }
}
