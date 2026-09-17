#!/usr/bin/env node
/**
 * scripts/generate-serve-config.js - render the `headers` block of serve.json from
 * config/security-headers.json (issue #113).
 *
 * Build-time API origins (the REACT_APP_* URLs RSBuild inlines into the bundle) are read from the
 * tracked .env.example only — never from the untracked local .env (issue #142) — so the
 * committed serve.json is the same on every machine and in CI. Runtime overrides
 * (APP_CONFIG_*) are appended by scripts/render-security-headers.js at container start.
 *
 * Usage:
 *   node scripts/generate-serve-config.js            # rewrite serve.json
 *   node scripts/generate-serve-config.js --check    # exit 1 when serve.json is stale
 */

'use strict';

const fs = require('fs');
const path = require('path');

const dotenv = require('dotenv');
const { expand } = require('dotenv-expand');

const { loadPolicy, renderServeConfig } = require('./security-headers');

const projectRoot = path.resolve(__dirname, '..');
const SERVE_CONFIG_PATH = path.join(projectRoot, 'serve.json');
const DOTENV_PATH = path.join(projectRoot, '.env.example');

function readIfPresent(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

function loadBuildEnv(dotenvPath = DOTENV_PATH) {
  const contents = readIfPresent(dotenvPath);

  if (contents === null) {
    return {};
  }

  return expand({ parsed: dotenv.parse(contents), processEnv: {} }).parsed || {};
}

function readExistingServeConfig(current) {
  return current === null ? {} : JSON.parse(current);
}

function renderServeJson(policy, env, existing) {
  return `${JSON.stringify(renderServeConfig(policy, env, existing), null, 2)}\n`;
}

function main(argv) {
  const check = argv.includes('--check');
  const policy = loadPolicy();
  const env = loadBuildEnv();
  const current = readIfPresent(SERVE_CONFIG_PATH);
  const rendered = renderServeJson(policy, env, readExistingServeConfig(current));

  if (rendered === current) {
    process.stdout.write(
      'generate-serve-config: serve.json matches config/security-headers.json\n'
    );
    return 0;
  }

  if (check) {
    process.stderr.write(
      'generate-serve-config: serve.json is stale relative to config/security-headers.json and ' +
        '.env.example; run `make security-headers-generate` and commit the result.\n'
    );
    return 1;
  }

  fs.writeFileSync(SERVE_CONFIG_PATH, rendered);
  process.stdout.write('generate-serve-config: wrote serve.json\n');
  return 0;
}

module.exports = { loadBuildEnv, renderServeJson };

if (require.main === module) {
  try {
    process.exit(main(process.argv.slice(2)));
  } catch (error) {
    process.stderr.write(`generate-serve-config: ${error.message}\n`);
    process.exit(1);
  }
}
