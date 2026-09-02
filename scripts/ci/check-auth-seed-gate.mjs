#!/usr/bin/env node
/**
 * Preloaded-auth-token seed gate (issue #158).
 *
 * Scans an emitted bundle and asserts whether the test-only auth seed seam
 * (src/config/env/preloaded-auth-token.ts) survived the build:
 *
 *   --expect absent   a deployable build: the window key, the opt-in flag name and the
 *                     token literal must all be gone, dead-code-eliminated by the
 *                     `NODE_ENV === 'production' && ENABLE_PRELOADED_AUTH_TOKEN_SEED !== 'true'`
 *                     guard.
 *   --expect present  the ephemeral Playwright/Lighthouse build: the seam must still be
 *                     there, otherwise the `absent` run proves nothing (it would pass just
 *                     as well against a bundle that never contained the seam).
 *
 * Usage:
 *   node scripts/ci/check-auth-seed-gate.mjs --dir <dist> --expect absent|present --token <value>
 *
 * Source maps are skipped on purpose: they embed the original TypeScript, so the
 * identifiers appear there whatever the guard does. The deployable image ships no maps
 * (Dockerfile deletes them from dist-production) and `serve` never exposes them.
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';

// Everything except source maps: an allowlist of script extensions would miss a leak that
// landed in an unexpected asset type, and reading a font or image as utf8 simply never matches.
const SKIPPED_EXTENSION = '.map';
const WINDOW_KEY = '__PRELOADED_AUTH_TOKEN__';
const OPT_IN_FLAG = 'ENABLE_PRELOADED_AUTH_TOKEN_SEED';
const ENV_TOKEN_VAR = 'REACT_APP_LHCI_PRELOADED_AUTH_TOKEN';

function parseArgs(argv) {
  const args = { dir: null, expect: null, token: null };
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    if (key === '--dir') args.dir = argv[(i += 1)];
    else if (key === '--expect') args.expect = argv[(i += 1)];
    else if (key === '--token') args.token = argv[(i += 1)];
  }
  if (!args.dir) throw new Error('check-auth-seed-gate: --dir <distDir> is required');
  if (args.expect !== 'absent' && args.expect !== 'present') {
    throw new Error('check-auth-seed-gate: --expect must be "absent" or "present"');
  }
  if (!args.token || !args.token.trim()) {
    throw new Error('check-auth-seed-gate: --token <probeValue> is required');
  }
  return args;
}

function walk(dir, acc = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, acc);
    else if (extname(entry) !== SKIPPED_EXTENSION) acc.push(full);
  }
  return acc;
}

// Fail closed. A missing directory, or one holding no scannable asset, would otherwise
// report "no identifiers found" and turn the gate green while checking nothing.
function collectAssets(dir) {
  if (!existsSync(dir)) {
    throw new Error(
      `check-auth-seed-gate: "${dir}" does not exist. Build the bundle before scanning it.`
    );
  }
  const files = walk(dir);
  if (files.length === 0) {
    throw new Error(
      `check-auth-seed-gate: "${dir}" holds no non-sourcemap asset. ` +
        'Refusing to pass a scan that inspected nothing.'
    );
  }
  return files;
}

function findIdentifiers(files, identifiers) {
  const hits = new Map(identifiers.map((identifier) => [identifier, []]));
  for (const file of files) {
    const content = readFileSync(file, 'utf8');
    for (const identifier of identifiers) {
      if (content.includes(identifier)) hits.get(identifier).push(file);
    }
  }
  return hits;
}

function reportHits(hits) {
  for (const [identifier, files] of hits) {
    for (const file of files) console.error(`  ${identifier} → ${file}`);
  }
}

function assertAbsent(files, token) {
  const forbidden = [WINDOW_KEY, OPT_IN_FLAG, ENV_TOKEN_VAR, token];
  const hits = findIdentifiers(files, forbidden);
  const leaked = [...hits].filter(([, matches]) => matches.length > 0);

  if (leaked.length > 0) {
    console.error(
      `❌ The preloaded-auth-token seed survived a deployable build (${files.length} assets scanned).`
    );
    reportHits(new Map(leaked));
    console.error(
      '\nA deployable bundle must not carry the seed seam or its token. Keep the guard and every\n' +
        'seed read inside the single method in src/config/env/preloaded-auth-token.ts — a helper\n' +
        'method or a cross-module call is not folded away by the bundler (issue #158).'
    );
    process.exitCode = 1;
    return;
  }

  console.log(
    `✅ No preloaded-auth-token seed in the deployable bundle (${files.length} assets scanned).`
  );
}

function assertPresent(files, token) {
  const required = [WINDOW_KEY, token];
  const hits = findIdentifiers(files, required);
  const missing = [...hits].filter(([, matches]) => matches.length === 0);

  if (missing.length > 0) {
    console.error(
      `❌ The opted-in build is missing the seed seam (${files.length} assets scanned): ` +
        `${missing.map(([identifier]) => identifier).join(', ')}.`
    );
    console.error(
      '\nThis is the positive control. Without it the "absent" scan is vacuous, and the\n' +
        'Playwright, visual and Lighthouse suites that seed an authenticated session against\n' +
        'the production build would silently lose it (issue #158).'
    );
    process.exitCode = 1;
    return;
  }

  console.log(
    `✅ The opted-in build still carries the seed seam (${files.length} assets scanned).`
  );
}

const args = parseArgs(process.argv.slice(2));
const assets = collectAssets(args.dir);

if (args.expect === 'absent') assertAbsent(assets, args.token);
else assertPresent(assets, args.token);
