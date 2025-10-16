const buildApiUrl = (endpoint: string): string => {
  const isProd: boolean = process.env.NODE_ENV === 'production';
  const baseUrl = isProd
    ? (process.env.REACT_APP_MOCKOON_URL?.trim() ?? '')
    : 'http://localhost:8080';

  const normalizedBase = baseUrl.replace(/\/+$/, '');
  const normalizedEndpoint = endpoint.replace(/^\/+/, '');

  return baseUrl ? `${normalizedBase}/${normalizedEndpoint}` : `/${normalizedEndpoint}`;
};

export default buildApiUrl;
