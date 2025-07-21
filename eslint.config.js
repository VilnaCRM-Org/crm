const { defineConfig, globalIgnores } = require('eslint/config');

module.exports = defineConfig([
  globalIgnores(['.config/*', 'scripts/**', 'checkNodeVersion.js', 'coverage/**']),
]);
