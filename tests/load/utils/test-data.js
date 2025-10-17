import { randomString } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

const TEST_DATA_GENERATORS = {
  /**
   * Generate a single unique user with email, name, and password
   */
  generateUser: () => {
    const timestamp = Date.now();
    const uniqueId = `${__VU || 1}_${__ITER || 0}_${timestamp}_${Math.random().toString(36).substring(2, 7)}`;

    const randomDigits = randomString(2, '0123456789');
    const password = `Test${randomString(8)}!${randomDigits}`;

    return {
      fullName: `Test User ${uniqueId}`,
      email: `test${uniqueId}@example.com`,
      password,
    };
  },

  /**
   * Generate a batch of unique users for better test data isolation
   * Useful for scenarios that need multiple distinct users in a single iteration
   * @param {number} count - Number of users to generate
   * @returns {Array} Array of user objects
   */
  generateUniqueUserBatch: (count) => {
    if (!count || count < 1) {
      throw new Error('count must be a positive number');
    }

    return Array.from({ length: count }, (_, index) => {
      const timestamp = Date.now();
      const uniqueId = `${__VU || 1}_${__ITER || 0}_${timestamp}_${index}_${Math.random().toString(36).substring(2, 7)}`;

      const randomDigits = randomString(2, '0123456789');
      const password = `Test${randomString(8)}!${randomDigits}`;

      return {
        fullName: `Test User ${uniqueId}`,
        email: `test${uniqueId}@example.com`,
        password,
      };
    });
  },

  /**
   * Generate a user ID based on VU and iteration
   * Useful for consistent user selection in load tests
   */
  userId: () => (((__VU || 1) * 1000 + (__ITER || 0)) % 1000) + 1,
};

export default TEST_DATA_GENERATORS;
