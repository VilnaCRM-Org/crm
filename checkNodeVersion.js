const { engines } = require('./package.json');

const current = process.versions.node.split('.').map(Number);
const required = engines.node.match(/\d+/g).map(Number);

if (current[0] < required[0]) {
  console.error(
    `Required Node version ${engines.node} not satisfied. Current version: ${process.version}`
  );
  process.exit(1);
}

console.log(`Node version ${process.version} satisfies requirement ${engines.node}`);
