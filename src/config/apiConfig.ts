import buildApiUrl from '@/utils/urlBuilder';

const API_ENDPOINTS = Object.freeze({
  REGISTER: buildApiUrl('/api/users'),
  LOGIN: buildApiUrl('/api/users'),
} as const);

export default API_ENDPOINTS;
