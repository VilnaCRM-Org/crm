const { resolve } = require('path');
const dotenv = require('dotenv');
const dotenvExpand = require('dotenv-expand');

dotenvExpand.expand(dotenv.config({ path: resolve(__dirname, '../.env') }));

const baseUrl =
  process.env.LHCI_TARGET_URL ||
  process.env.REACT_APP_PROD_CONTAINER_API_URL ||
  process.env.REACT_APP_PROD_HOST_API_URL ||
  'http://localhost:3001';

const pages = [`${baseUrl}/authentication`];

module.exports = {
  pages,
};
