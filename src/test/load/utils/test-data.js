const TEST_DATA_GENERATORS = {
  generateUser: () => {
    const timestamp = Date.now();
    const uniqueId = `${__VU || 1}_${__ITER || 0}_${timestamp}`;

    return {
      name: `Test User ${uniqueId}`,
      email: `test${uniqueId}@example.com`,
      password: 'TestPassword123!',
    };
  },
  userId: () => (((__VU || 1) * 1000 + (__ITER || 0)) % 1000) + 1,
};
export default TEST_DATA_GENERATORS;
