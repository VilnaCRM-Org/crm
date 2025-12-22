#!/usr/bin/env node
const { execSync } = require('child_process');
const semver = require('semver');
const { engines } = require('./package.json');

const checkRuntime = (name, currentVersion, requiredRange) => {
  const normalized = semver.coerce(currentVersion)?.version;

  if (!normalized || !semver.satisfies(normalized, requiredRange)) {
    console.error(`Required ${name} version ${requiredRange} not satisfied. Current version: ${currentVersion}`);
    process.exit(1);
  }

  console.log(`${name} version ${currentVersion} satisfies requirement ${requiredRange}`);
};

checkRuntime('Node', process.version, engines.node);

if (engines.bun) {
  let bunVersion = process.versions?.bun;

  if (!bunVersion) {
    try {
      bunVersion = execSync('bun --version', { encoding: 'utf-8' }).trim();
    } catch (error) {
      console.error('Bun is required but not installed or not available in PATH.');
      process.exit(1);
    }
  }

  checkRuntime('Bun', bunVersion, engines.bun);
}
