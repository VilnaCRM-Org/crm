const { resolve } = require('path');
const dotenv = require('dotenv');
const dotenvExpand = require('dotenv-expand');

dotenvExpand.expand(dotenv.config({ path: resolve(__dirname, '../.env') }));

const baseUrl =
  process.env.LHCI_TARGET_URL ||
  process.env.REACT_APP_PROD_CONTAINER_API_URL ||
  process.env.REACT_APP_PROD_HOST_API_URL ||
  'http://localhost:3001';

const normalizedBaseUrl = baseUrl === '/' ? '/' : baseUrl.replace(/\/+$/, '');

const RESET_TOKEN = 'LighthouseAuditResetToken0000001';

const pages = [
  normalizedBaseUrl,
  normalizedBaseUrl === '/' ? '/sign-up' : `${normalizedBaseUrl}/sign-up`,
  normalizedBaseUrl === '/' ? '/sign-in' : `${normalizedBaseUrl}/sign-in`,
  normalizedBaseUrl === '/' ? '/forbidden' : `${normalizedBaseUrl}/forbidden`,
  normalizedBaseUrl === '/' ? '/server-error' : `${normalizedBaseUrl}/server-error`,
  normalizedBaseUrl === '/'
    ? '/definitely-not-a-route'
    : `${normalizedBaseUrl}/definitely-not-a-route`,
  normalizedBaseUrl === '/' ? '/password-recovery' : `${normalizedBaseUrl}/password-recovery`,
  normalizedBaseUrl === '/'
    ? `/password-reset?token=${RESET_TOKEN}`
    : `${normalizedBaseUrl}/password-reset?token=${RESET_TOKEN}`,
];

module.exports = {
  baseUrl: normalizedBaseUrl,
  pages,
};
