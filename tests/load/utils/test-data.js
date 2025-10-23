import { randomString } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

const generatePassword = () => {
  const randomDigits = randomString(2, '0123456789');
  return `Test${randomString(8)}!${randomDigits}`;
};

const TEST_DATA_GENERATORS = {
  generateUser: () => {
    const timestamp = Date.now();
    const uniqueId = `${__VU || 1}_${__ITER || 0}_${timestamp}_${Math.random().toString(36).substring(2, 7)}`;

    const password = generatePassword();

    return {
      fullName: `Test User ${uniqueId}`,
      email: `test${uniqueId}@example.com`,
      password,
    };
  },

  generateUniqueUserBatch: (count) => {
    if (!count || count < 1) {
      throw new Error('count must be a positive number');
    }

    return Array.from({ length: count }, (_, index) => {
      const timestamp = Date.now();
      const uniqueId = `${__VU || 1}_${__ITER || 0}_${timestamp}_${index}_${Math.random().toString(36).substring(2, 7)}`;

      const password = generatePassword();

      return {
        fullName: `Test User ${uniqueId}`,
        email: `test${uniqueId}@example.com`,
        password,
      };
    });
  },

  userId: () => (((__VU || 1) * 1000 + (__ITER || 0)) % 1000) + 1,
};

export default TEST_DATA_GENERATORS;
