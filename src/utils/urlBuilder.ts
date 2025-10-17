const buildApiUrl = (endpoint: string): string => {
  const baseUrl = process.env.REACT_APP_API_BASE_URL?.trim() ?? '';
  const normalizedBase = baseUrl.replace(/\/+$/, '');
  const normalizedEndpoint = endpoint.replace(/^\/+/, '');

  return normalizedBase ? `${normalizedBase}/${normalizedEndpoint}` : `/${normalizedEndpoint}`;
};

export default buildApiUrl;
