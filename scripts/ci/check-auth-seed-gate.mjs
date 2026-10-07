#!/usr/bin/env node
/**
 * Preloaded-auth-token seed gate (issue #158) and sandbox demo-session gate (issue #309).
 *
 * Scans an emitted bundle and asserts whether the two compile-guarded auth seams survived the
 * build: the test-only auth seed (src/config/env/preloaded-auth-token.ts) and the sandbox demo
 * login (src/config/env/sandbox-demo-session.ts), together with the 404.html deep-link fallback
 * that only the sandbox build emits.
 *
 *   --expect absent                      a deployable build: the window key, both opt-in flag
 *                                        names, the token literal, the demo credentials, the demo
 *                                        token and 404.html must all be gone, dead-code-eliminated
 *                                        by each seam's `NODE_ENV === 'production' && <flag> !==
 *                                        'true'` guard.
 *   --expect present --seam preloaded-auth
 *                                        the ephemeral Playwright/Lighthouse build: the auth seed
 *                                        must still be there and the sandbox seam must not.
 *   --expect present --seam sandbox-demo the sandbox build: the demo login and a 404.html that is
 *                                        a byte copy of index.html must be there, and the auth
 *                                        seed must not.
 *
 * Each `present` run is a positive control: without it the `absent` run proves nothing (it would
 * pass just as well against a bundle that never contained the seam).
 *
 * Usage:
 *   node scripts/ci/check-auth-seed-gate.mjs --dir <dist> --expect absent --token <value>
 *   node scripts/ci/check-auth-seed-gate.mjs --dir <dist> --expect present \
 *     --seam preloaded-auth|sandbox-demo --token <value>
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
const SANDBOX_OPT_IN_FLAG = 'ENABLE_SANDBOX_DEMO';
const SANDBOX_DEMO_LITERALS = ['demo@vilnacrm.com', 'Demo1234', 'sandbox-demo-session-token'];
const SHELL_DOCUMENT = 'index.html';
const FALLBACK_DOCUMENT = '404.html';

const PRELOADED_AUTH = 'preloaded-auth';
const SANDBOX_DEMO = 'sandbox-demo';

const preloadedAuthMarkers = (token) => [WINDOW_KEY, OPT_IN_FLAG, ENV_TOKEN_VAR, token];
const sandboxDemoMarkers = () => [SANDBOX_OPT_IN_FLAG, ...SANDBOX_DEMO_LITERALS];

// `required` must survive the opted-in build; `forbidden` is the other seam, which that build
// never opted into. The opt-in flag names are folded to literals by the define, so they are
// absent from every build and appear only in the forbidden lists.
const SEAMS = {
  [PRELOADED_AUTH]: {
    required: (token) => [WINDOW_KEY, token],
    forbidden: () => sandboxDemoMarkers(),
    fallbackDocument: false,
  },
  [SANDBOX_DEMO]: {
    required: () => SANDBOX_DEMO_LITERALS,
    forbidden: (token) => preloadedAuthMarkers(token),
    fallbackDocument: true,
  },
};

const FLAGS = new Map([
  ['--dir', 'dir'],
  ['--expect', 'expect'],
  ['--token', 'token'],
  ['--seam', 'seam'],
]);
const EXPECTATIONS = ['absent', 'present'];

// Checked in order; the first rule an invocation breaks is the error it reports.
const ARGUMENT_RULES = [
  [(args) => !args.dir, '--dir <distDir> is required'],
  [(args) => !EXPECTATIONS.includes(args.expect), '--expect must be "absent" or "present"'],
  [(args) => !args.token?.trim(), '--token <probeValue> is required'],
  [
    (args) => args.expect === 'present' && !Object.hasOwn(SEAMS, args.seam ?? ''),
    `--expect present needs --seam ${Object.keys(SEAMS).join('|')}`,
  ],
  [
    (args) => args.expect === 'absent' && args.seam !== null,
    '--seam only applies to --expect present',
  ],
];

function readFlags(argv) {
  const args = { dir: null, expect: null, token: null, seam: null };
  for (let i = 0; i < argv.length; i += 1) {
    const field = FLAGS.get(argv[i]);
    if (field !== undefined) args[field] = argv[(i += 1)];
  }
  return args;
}

function parseArgs(argv) {
  const args = readFlags(argv);
  const broken = ARGUMENT_RULES.find(([breaks]) => breaks(args));
  if (broken) throw new Error(`check-auth-seed-gate: ${broken[1]}`);
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

function leakedIdentifiers(files, identifiers) {
  return new Map([...findIdentifiers(files, identifiers)].filter(([, hits]) => hits.length > 0));
}

function reportHits(hits) {
  for (const [identifier, files] of hits) {
    for (const file of files) console.error(`  ${identifier} → ${file}`);
  }
}

function fallbackDocumentPath(dir) {
  return join(dir, FALLBACK_DOCUMENT);
}

// The sandbox fallback has to be the shell itself, byte for byte: anything else (a stale copy,
// an empty file) would answer a deep link with a page the router cannot boot from.
function fallbackDocumentProblem(dir) {
  const shell = join(dir, SHELL_DOCUMENT);
  const fallback = fallbackDocumentPath(dir);
  if (!existsSync(fallback)) return `${FALLBACK_DOCUMENT} is missing`;
  if (!existsSync(shell)) return `${SHELL_DOCUMENT} is missing`;
  if (!readFileSync(fallback).equals(readFileSync(shell))) {
    return `${FALLBACK_DOCUMENT} is not a byte copy of ${SHELL_DOCUMENT}`;
  }
  return null;
}

function assertAbsent(dir, files, token) {
  const leaked = leakedIdentifiers(files, [
    ...preloadedAuthMarkers(token),
    ...sandboxDemoMarkers(),
  ]);
  const fallbackShipped = existsSync(fallbackDocumentPath(dir));

  if (leaked.size > 0 || fallbackShipped) {
    console.error(
      `❌ A compile-guarded auth seam survived a deployable build (${files.length} assets scanned).`
    );
    reportHits(leaked);
    if (fallbackShipped) console.error(`  ${FALLBACK_DOCUMENT} → ${fallbackDocumentPath(dir)}`);
    console.error(
      '\nA deployable bundle must carry neither the preloaded-auth seed nor the sandbox demo\n' +
        'login, and must not emit the sandbox 404.html. Keep each guard and every read inside its\n' +
        'single method in src/config/env/ — a helper method or a cross-module call is not folded\n' +
        'away by the bundler (issues #158, #309).'
    );
    process.exitCode = 1;
    return;
  }

  console.log(
    `✅ No preloaded-auth seed, sandbox demo login or ${FALLBACK_DOCUMENT} in the deployable ` +
      `bundle (${files.length} assets scanned).`
  );
}

function presentProblems(dir, files, token, seam) {
  const missing = [...findIdentifiers(files, seam.required(token))]
    .filter(([, hits]) => hits.length === 0)
    .map(([identifier]) => `missing ${identifier}`);
  const leaked = [...leakedIdentifiers(files, seam.forbidden(token)).keys()].map(
    (identifier) => `unexpected ${identifier}`
  );
  const fallback = seam.fallbackDocument ? fallbackDocumentProblem(dir) : null;
  const strayFallback =
    !seam.fallbackDocument && existsSync(fallbackDocumentPath(dir))
      ? `unexpected ${FALLBACK_DOCUMENT}`
      : null;

  return [...missing, ...leaked, fallback, strayFallback].filter((problem) => problem !== null);
}

function assertPresent(dir, files, token, seamName) {
  const problems = presentProblems(dir, files, token, SEAMS[seamName]);

  if (problems.length > 0) {
    console.error(
      `❌ The ${seamName} build is not the opted-in artifact it should be ` +
        `(${files.length} assets scanned): ${problems.join(', ')}.`
    );
    console.error(
      '\nThis is the positive control. Without it the "absent" scan is vacuous, and the suites or\n' +
        'the sandbox that depend on the opted-in build would silently lose the seam\n' +
        '(issues #158, #309).'
    );
    process.exitCode = 1;
    return;
  }

  console.log(`✅ The ${seamName} build still carries its seam (${files.length} assets scanned).`);
}

const args = parseArgs(process.argv.slice(2));
const assets = collectAssets(args.dir);

if (args.expect === 'absent') assertAbsent(args.dir, assets, args.token);
else assertPresent(args.dir, assets, args.token, args.seam);
