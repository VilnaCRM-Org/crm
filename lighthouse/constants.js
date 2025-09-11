import { resolve } from 'path';

require('dotenv').config({ path: resolve(__dirname, '../.env') });

const baseUrl = process.env.REACT_APP_PROD_HOST_API_URL || 'http://localhost:3001';

export default {
  baseUrl,
};
