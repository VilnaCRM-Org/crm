import rawEnv from '@/config/env/raw-env';
import appConfigSource from '@/config/runtime/app-config-source';

class UrlBuilder {
  public build(endpoint: string): string {
    // Runtime configuration wins over the build-time default so the same image can be pointed at
    // a different REST origin without a rebuild (issue #145).
    const baseUrl = appConfigSource.text('apiBaseUrl') ?? rawEnv.mockoonUrl();
    const normalizedBase = baseUrl.replace(/\/+$/, '');
    const normalizedEndpoint = endpoint.replace(/^\/+/, '');

    return normalizedBase ? `${normalizedBase}/${normalizedEndpoint}` : `/${normalizedEndpoint}`;
  }
}

export default new UrlBuilder();
