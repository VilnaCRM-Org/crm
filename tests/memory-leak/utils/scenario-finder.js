const fs = require('node:fs');
const path = require('node:path');

const SCENARIO_EXTENSIONS = ['.js', '.mjs', '.cjs'];

class ScenarioFinder {
  find(testsDir) {
    return this.walk(path.resolve(testsDir)).sort();
  }

  walk(directory) {
    return fs
      .readdirSync(directory, { withFileTypes: true })
      .flatMap((entry) => this.collect(directory, entry));
  }

  collect(directory, entry) {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      return this.walk(entryPath);
    }

    return SCENARIO_EXTENSIONS.includes(path.extname(entry.name)) ? [entryPath] : [];
  }
}

module.exports = ScenarioFinder;
