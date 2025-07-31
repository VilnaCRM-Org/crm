const TEST_DATA_GENERATORS = {
  generateUser: (password = 'TestPassword123!') => {
    const timestamp = Date.now();
    const uniqueId = `${__VU || 1}_${__ITER || 0}_${timestamp}_${Math.random().toString(36).substr(2, 5)}`;

    return {
      name: `Test User ${uniqueId}`,
      email: `test${uniqueId}@example.com`,
      password,
    };
  },
  userId: () => (((__VU || 1) * 1000 + (__ITER || 0)) % 1000) + 1,
};
export default TEST_DATA_GENERATORS;
