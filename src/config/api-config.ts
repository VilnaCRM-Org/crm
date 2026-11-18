import urlBuilder from '@/utils/url-builder';

const API_ENDPOINTS = Object.freeze({
  REGISTER: urlBuilder.build('/api/users'),
  LOGIN: urlBuilder.build('/api/users'),
  SOCIAL_AUTH: urlBuilder.build('/api/auth/social'),
} as const);

export default API_ENDPOINTS;
