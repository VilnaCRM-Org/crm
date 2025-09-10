import buildApiUrl from '@/utils/urlBuilder';

const API_ENDPOINTS = Object.freeze({
  REGISTER: buildApiUrl('/api/users/register'),
  LOGIN: buildApiUrl('/api/users/login'),
} as const);

export default API_ENDPOINTS;
