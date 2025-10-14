/**
 * Logger utility for memory leak tests
 * Provides logging methods without triggering ESLint warnings
 */

/* eslint-disable no-console */

const logger = {
  info: (...args) => console.log(...args),
  error: (...args) => console.error(...args),
  warn: (...args) => console.warn(...args),
  debug: (...args) => {
    if (process.env.MEMLAB_DEBUG === 'true') {
      console.log('[DEBUG]', ...args);
    }
  },
};

module.exports = logger;
