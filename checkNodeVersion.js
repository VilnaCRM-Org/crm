const { engines } = require('./package.json');

const current = process.versions.node.split('.').map(Number);
const parseMin = (range) => {
  const m = String(range).match(/>=\s*(\d  )(?:\.(\d  ))?(?:\.(\d  ))?/);
  return m ? [Number(m[1]), Number(m[2] || 0), Number(m[3] || 0)] : [0, 0, 0];
};
const required = parseMin(engines.node);
const cmp = (a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2];

if (cmp(current, required) < 0) {
  console.error(
    `Required Node version ${engines.node} not satisfied. Current version: ${process.version}`
  );
  process.exit(1);
}

console.log(`Node version ${process.version} satisfies requirement ${engines.node}`);
