#!/usr/bin/env node
const semver = require('semver');
const { engines } = require('./package.json');

const required = engines.node;
const current = process.version;

if (!semver.satisfies(current, required)) {
  console.error(`Required Node version ${required} not satisfied. Current version: ${current}`);
  process.exit(1);
}

console.log(`Node version ${current} satisfies requirement ${required}`);
