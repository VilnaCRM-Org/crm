import { randomString } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

const TEST_DATA_GENERATORS = {
  generateUser: () => {
    const timestamp = Date.now();
    const uniqueId = `${__VU || 1}_${__ITER || 0}_${timestamp}_${Math.random().toString(36).substring(2, 7)}`;

    const password = `Test${randomString(8)}!${Math.floor(Math.random() * 100)}`;

    return {
      name: `Test User ${uniqueId}`,
      email: `test${uniqueId}@example.com`,
      password,
    };
  },
  userId: () => (((__VU || 1) * 1000 + (__ITER || 0)) % 1000) + 1,
};
export default TEST_DATA_GENERATORS;
