import { randomString } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

const LETTERS = 'abcdefghijklmnopqrstuvwxyz';
const DIGITS = '0123456789';

const generatePassword = () => `Test${randomString(8, LETTERS)}!${randomString(2, DIGITS)}`;

const createUniqueId = (suffix = '') =>
  `${__VU || 1}_${__ITER || 0}_${Date.now()}${suffix}_${randomString(5, LETTERS)}`;

const buildUser = (suffix = '', password = generatePassword()) => {
  const uniqueId = createUniqueId(suffix);
  const firstName = `Test${randomString(5, LETTERS)}`;
  const lastName = `User${randomString(5, LETTERS)}`;
  const fullName = `${firstName} ${lastName}`;

  return {
    name: fullName,
    fullName,
    email: `test.${uniqueId}@example.com`.toLowerCase(),
    password,
  };
};

const TEST_DATA_GENERATORS = {
  generateUser: (password) => buildUser('', password),

  generateUniqueUserBatch: (count) => {
    if (!Number.isInteger(count) || count < 1) {
      throw new Error('count must be a positive integer');
    }

    return Array.from({ length: count }, (_, index) => buildUser(`_${index}`));
  },

  userId: () => (((__VU || 1) * 1000 + (__ITER || 0)) % 1000) + 1,
};

export default TEST_DATA_GENERATORS;
