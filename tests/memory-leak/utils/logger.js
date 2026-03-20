/* eslint-disable no-console */

function formatError(error) {
  if (error instanceof Error) {
    return error.stack || error.message;
  }

  return String(error);
}

module.exports = {
  info: (...args) => console.log(...args),
  warn: (...args) => console.warn(...args),
  debug: (...args) => {
    if (process.env.MEMLAB_DEBUG === 'true') {
      console.log('[DEBUG]', ...args);
    }
  },
  error: (...args) => {
    if (args.length > 1) {
      const output = [args[0], formatError(args[1]), ...args.slice(2)];

      console.error(...output);
      return;
    }

    console.error(...args);
  },
};
