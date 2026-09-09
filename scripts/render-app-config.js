#!/usr/bin/env node
/**
 * scripts/render-app-config.js - render the runtime configuration block of the built HTML shell
 * from APP_CONFIG_* environment variables (issue #145).
 *
 * WHY: every REACT_APP_* value is inlined into the JS bundle at build time by RSBuild, so without
 * this step each environment would need its own build and the same tested artifact could not be
 * promoted from staging to production. This script rewrites the inline
 * `<script id="app-runtime-config" type="application/json">` block that the app reads
 * synchronously at boot, so one image serves any environment.
 *
 * WHY AN INLINE BLOCK AND NOT A FETCHED FILE: the auth pages are gated by a Lighthouse mobile
 * performance floor with no headroom. A separate config request would serialize a round trip onto
 * first paint; an inline JSON block costs zero requests and zero added latency.
 *
 * The committed block in public/index.html is the single source of truth for which flags exist:
 * a flag environment variable naming a key that is not already present is rejected, so a typo
 * fails container start instead of silently doing nothing.
 *
 * Run by scripts/docker-entrypoint.sh; also runnable directly:
 *   node scripts/render-app-config.js dist/index.html
 */

'use strict';

const fs = require('fs');

const CONFIG_ELEMENT_ID = 'app-runtime-config';
const FLAG_ENV_PREFIX = 'APP_CONFIG_FLAG_';

// Tolerant of attribute order and of any extra attributes an HTML minifier may leave behind.
const BLOCK_PATTERN = new RegExp(
  `(<script[^>]*\\bid="${CONFIG_ELEMENT_ID}"[^>]*>)([\\s\\S]*?)(</script>)`
);

const URL_SETTINGS = [
  { envVar: 'APP_CONFIG_API_BASE_URL', key: 'apiBaseUrl' },
  { envVar: 'APP_CONFIG_GRAPHQL_URL', key: 'graphqlUrl' },
];

function toCamelCase(upperSnakeCase) {
  return upperSnakeCase.toLowerCase().replace(/_([a-z0-9])/g, (_match, char) => char.toUpperCase());
}

function assertHttpUrl(envVar, raw) {
  let parsed;

  try {
    parsed = new URL(raw);
  } catch {
    throw new Error(`${envVar} must be an absolute URL, got "${raw}".`);
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`${envVar} must use http or https, got "${raw}".`);
  }
}

function parseBoolean(envVar, raw) {
  if (raw === 'true') {
    return true;
  }

  if (raw === 'false') {
    return false;
  }

  throw new Error(`${envVar} must be exactly "true" or "false", got "${raw}".`);
}

function readSetting(env, envVar) {
  const raw = env[envVar];

  return typeof raw === 'string' && raw.trim() ? raw.trim() : undefined;
}

function applyUrlSettings(config, env) {
  for (const { envVar, key } of URL_SETTINGS) {
    const value = readSetting(env, envVar);

    if (value !== undefined) {
      assertHttpUrl(envVar, value);
      config[key] = value;
    }
  }
}

function assertKnownFlag(flags, envVar, flag) {
  if (Object.prototype.hasOwnProperty.call(flags, flag)) {
    return;
  }

  const known = Object.keys(flags).sort().join(', ') || '(none)';

  throw new Error(`${envVar} names unknown feature flag "${flag}". Known flags: ${known}.`);
}

function applyFlagSettings(config, env) {
  const flags = config.flags && typeof config.flags === 'object' ? config.flags : {};
  const flagVars = Object.keys(env).filter((name) => name.startsWith(FLAG_ENV_PREFIX));

  for (const envVar of flagVars) {
    const value = readSetting(env, envVar);

    if (value !== undefined) {
      const flag = toCamelCase(envVar.slice(FLAG_ENV_PREFIX.length));

      assertKnownFlag(flags, envVar, flag);
      flags[flag] = parseBoolean(envVar, value);
    }
  }

  config.flags = flags;
}

function parseExistingConfig(json) {
  let parsed;

  try {
    parsed = JSON.parse(json);
  } catch (error) {
    throw new Error(
      `the #${CONFIG_ELEMENT_ID} block does not contain valid JSON: ${error.message}`
    );
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error(`the #${CONFIG_ELEMENT_ID} block must contain a JSON object.`);
  }

  return parsed;
}

function renderAppConfig(html, env) {
  const match = BLOCK_PATTERN.exec(html);

  if (!match) {
    throw new Error(`no <script id="${CONFIG_ELEMENT_ID}"> block found in the HTML shell.`);
  }

  const config = parseExistingConfig(match[2]);

  applyUrlSettings(config, env);
  applyFlagSettings(config, env);

  // Escaping `<` keeps a value containing `</script` from terminating the block early.
  const rendered = JSON.stringify(config).replace(/</g, '\\u003c');

  return html.replace(BLOCK_PATTERN, (_full, open, _body, close) => `${open}${rendered}${close}`);
}

function main(argv, env) {
  const target = argv[2];

  if (!target) {
    throw new Error('usage: node scripts/render-app-config.js <html-file>');
  }

  const html = fs.readFileSync(target, 'utf8');
  const rendered = renderAppConfig(html, env);

  if (rendered !== html) {
    fs.writeFileSync(target, rendered);
  }

  return target;
}

module.exports = { CONFIG_ELEMENT_ID, FLAG_ENV_PREFIX, renderAppConfig, toCamelCase };

if (require.main === module) {
  try {
    process.stdout.write(
      `render-app-config: rendered runtime configuration into ${main(process.argv, process.env)}\n`
    );
  } catch (error) {
    process.stderr.write(`render-app-config: ${error.message}\n`);
    process.exit(1);
  }
}
