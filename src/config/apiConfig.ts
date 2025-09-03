import buildApiUrl from '@/utils/urlBuilder';

const API_ENDPOINTS = {
  REGISTER: buildApiUrl('/api/users/register'),
  LOGIN: buildApiUrl('/api/users/login'),
};

export default API_ENDPOINTS;
