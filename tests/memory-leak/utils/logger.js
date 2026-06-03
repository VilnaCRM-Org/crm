const util = require('node:util');

function serializeArgs(args) {
  return args.map((arg) => (arg instanceof Error ? util.format(arg) : arg));
}

function emit(method, args) {
  const target = globalThis.console;
  if (target && typeof target[method] === 'function') {
    target[method](...serializeArgs(args));
  }
}

const logger = {
  info: (...args) => {
    emit('log', args);
  },
  error: (...args) => {
    emit('error', args);
  },
  warn: (...args) => {
    emit('warn', args);
  },
  debug: (...args) => {
    if (process.env.MEMLAB_DEBUG === 'true') {
      emit('debug', ['[DEBUG]', ...args]);
    }
  },
};

module.exports = logger;
