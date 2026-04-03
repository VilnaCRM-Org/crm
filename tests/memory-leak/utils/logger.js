const DISALLOWED_MSG =
  'Use of console.log/warn/error is disallowed; use approved logging or throw instead';

const logger = {
  info: () => {
    throw new Error(DISALLOWED_MSG);
  },
  error: () => {
    throw new Error(DISALLOWED_MSG);
  },
  warn: () => {
    throw new Error(DISALLOWED_MSG);
  },
  debug: () => {
    if (process.env.MEMLAB_DEBUG === 'true') {
      throw new Error(DISALLOWED_MSG);
    }
  },
};

module.exports = logger;
