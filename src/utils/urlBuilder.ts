const buildApiUrl = (endpoint: string): string => {
  const baseUrl = process.env.REACT_APP_MOCKOON_URL?.trim() ?? '';
  const normalizedBase = baseUrl.replace(/\/+$/, '');
  const normalizedEndpoint = endpoint.replace(/^\/+/, '');

  return baseUrl ? `${normalizedBase}/${normalizedEndpoint}` : `/${normalizedEndpoint}`;
};

export default buildApiUrl;
