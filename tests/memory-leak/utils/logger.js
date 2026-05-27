const util = require('node:util');

function writeLine(stream, args) {
  stream.write(`${util.format(...args)}\n`);
}

const logger = {
  info: (...args) => {
    writeLine(process.stdout, args);
  },
  error: (...args) => {
    writeLine(process.stderr, args);
  },
  warn: (...args) => {
    writeLine(process.stderr, args);
  },
  debug: (...args) => {
    if (process.env.MEMLAB_DEBUG === 'true') {
      writeLine(process.stdout, ['[DEBUG]', ...args]);
    }
  },
};

module.exports = logger;
