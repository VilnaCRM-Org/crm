const baseConfig = require('./commitlint.config');

const imageActionsHeader = /^Compressed Images(\r?\n|$)/;

module.exports = {
  ...baseConfig,
  rules: {
    ...baseConfig.rules,
    'check-task-number-rule': [0, 'always'],
  },
  ignores: [(message) => imageActionsHeader.test(message)],
};
