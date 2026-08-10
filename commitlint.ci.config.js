const baseConfig = require('./commitlint.config');

const dependabotSignOff = /^Signed-off-by: dependabot\[bot\]/m;
const imageActionsHeader = /^Compressed Images(\r?\n|$)/;

module.exports = {
  ...baseConfig,
  ignores: [
    (message) => dependabotSignOff.test(message),
    (message) => imageActionsHeader.test(message),
  ],
};
