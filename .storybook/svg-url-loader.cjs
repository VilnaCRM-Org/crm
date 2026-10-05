const { createHash } = require('node:crypto');
const path = require('node:path');

module.exports = function svgUrlLoader(content) {
  const hash = createHash('sha256').update(content).digest('hex').slice(0, 8);
  const fileName = `static/media/${path.basename(this.resourcePath, '.svg')}.${hash}.svg`;

  this.emitFile(fileName, content);

  return `export default __webpack_public_path__ + ${JSON.stringify(fileName)};`;
};

module.exports.raw = true;
