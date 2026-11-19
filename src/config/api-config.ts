import urlBuilder from '@/utils/url-builder';

const API_ENDPOINTS = Object.freeze({
  REGISTER: urlBuilder.build('/api/users'),
  LOGIN: urlBuilder.build('/api/users'),
} as const);

export default API_ENDPOINTS;
