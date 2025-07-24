require('dotenv').config();

const baseUrl =
  process.env.LHCI_TARGET_URL || process.env.REACT_APP_PROD_HOST_API_URL || 'http://localhost:3001';

module.exports = {
  baseUrl,
};
