import rawEnv from '@/config/env/raw-env';

class UrlBuilder {
  public build(endpoint: string): string {
    const baseUrl = rawEnv.mockoonUrl();
    const normalizedBase = baseUrl.replace(/\/+$/, '');
    const normalizedEndpoint = endpoint.replace(/^\/+/, '');

    return normalizedBase ? `${normalizedBase}/${normalizedEndpoint}` : `/${normalizedEndpoint}`;
  }
}

export default new UrlBuilder();
