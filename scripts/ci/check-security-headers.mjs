#!/usr/bin/env node
/**
 * Browser security-header gate (issue #113).
 *
 * Fetches representative responses from a running production build and asserts every header of
 * the baseline in config/security-headers.json is present with the exact value the policy
 * declares - the HTML shell at /, a deep route, the manifest and a hashed static asset, so a header
 * that only reaches some responses is caught. The Content-Security-Policy is compared directive
 * by directive: every directive must carry exactly the policy's sources, except connect-src,
 * which must contain the policy's sources plus every origin passed as --expect-connect (the
 * runtime APP_CONFIG_* override the container entrypoint appends) and nothing wildcard. The
 * policy itself is refused by loadPolicy() when it weakens the floors, so a weakened baseline
 * cannot be generated, shipped, or passed here.
 *
 * connect-src is compared as an exact set: the sources the committed serve.json carries (the
 * policy's own plus the build-time API origins the image was generated with) plus every origin
 * passed as --expect-connect, and nothing else — an origin the baseline never authorized is a
 * finding, not a tolerated extra.
 *
 * Usage:
 *   node scripts/ci/check-security-headers.mjs --url http://127.0.0.1:3011 \
 *     [--expect-connect https://api.example] [--policy config/security-headers.json] \
 *     [--serve-config serve.json]
 */

import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const require = createRequire(import.meta.url);
const {
  CACHE_CONTROL,
  CONNECT_SRC,
  CSP_HEADER,
  committedConnectSrc,
  loadPolicy,
  parseCsp,
} = require(resolve(dirname(fileURLToPath(import.meta.url)), '../security-headers.js'));

const HTML_PATHS = ['/', '/sign-in'];
const STATIC_ASSET_PATTERN = /<script[^>]+src="(\/static\/[^"]+)"/;
const DEFAULT_SERVE_CONFIG = resolve(dirname(fileURLToPath(import.meta.url)), '../../serve.json');

export function parseArgs(argv) {
  const args = {
    url: null,
    expectConnect: [],
    policy: undefined,
    serveConfig: DEFAULT_SERVE_CONFIG,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    if (key === '--url') args.url = argv[(i += 1)];
    else if (key === '--expect-connect') args.expectConnect.push(argv[(i += 1)]);
    else if (key === '--policy') args.policy = argv[(i += 1)];
    else if (key === '--serve-config') args.serveConfig = argv[(i += 1)];
  }
  if (!args.url) throw new Error('--url <base-url> is required');
  return args;
}

function sameSet(actual, expected) {
  const a = new Set(actual);
  const b = new Set(expected);
  return a.size === b.size && [...a].every((entry) => b.has(entry));
}

function checkStaticHeaders(policy, response, findings) {
  for (const { key, value } of policy.headers) {
    const actual = response.headers[key.toLowerCase()];
    if (actual === undefined) findings.push(`${response.path}: missing ${key}`);
    else if (actual !== value)
      findings.push(`${response.path}: ${key} is "${actual}", expected "${value}"`);
  }
}

function checkCspDirective(policy, response, directives, directive, findings) {
  const expected = policy.contentSecurityPolicy.directives[directive];
  const actual = directives[directive];
  if (!actual) {
    findings.push(`${response.path}: ${CSP_HEADER} lacks ${directive}`);
    return;
  }
  if (directive === CONNECT_SRC) return;
  if (!sameSet(actual, expected)) {
    findings.push(
      `${response.path}: ${CSP_HEADER} ${directive} is "${actual.join(' ')}", expected "${expected.join(' ')}"`
    );
  }
}

function checkConnectSrc(response, directives, expected, findings) {
  const actual = directives[CONNECT_SRC] || [];
  for (const source of expected) {
    if (!actual.includes(source)) {
      findings.push(`${response.path}: ${CSP_HEADER} ${CONNECT_SRC} lacks ${source}`);
    }
  }
  for (const source of actual) {
    if (!expected.includes(source)) {
      findings.push(
        `${response.path}: ${CSP_HEADER} ${CONNECT_SRC} carries unauthorized source ${source}`
      );
    }
  }
}

function checkCsp(policy, response, expectedConnectSrc, findings) {
  const raw = response.headers[CSP_HEADER.toLowerCase()];
  if (raw === undefined) {
    findings.push(`${response.path}: missing ${CSP_HEADER}`);
    return;
  }
  let directives;
  try {
    directives = parseCsp(raw);
  } catch (error) {
    findings.push(`${response.path}: ${error.message}`);
    return;
  }
  for (const directive of Object.keys(policy.contentSecurityPolicy.directives)) {
    checkCspDirective(policy, response, directives, directive, findings);
  }
  checkConnectSrc(response, directives, expectedConnectSrc, findings);
}

function checkCacheControl(policy, response, findings) {
  const rule = policy.cacheControl.find((entry) => entry.source === response.cacheRule);
  if (!rule) return;
  const actual = response.headers[CACHE_CONTROL.toLowerCase()];
  if (actual !== rule.value) {
    findings.push(`${response.path}: ${CACHE_CONTROL} is "${actual}", expected "${rule.value}"`);
  }
}

/**
 * Evaluates already-fetched responses against the policy and returns every finding.
 * A response is `{ path, status, headers, cacheRule? }` with lowercase header names;
 * `baselineConnectSrc` is the connect-src the committed serve.json carries.
 */
export function evaluate(policy, responses, baselineConnectSrc, expectConnect = []) {
  const findings = [];
  const expectedConnectSrc = [...new Set([...baselineConnectSrc, ...expectConnect])];
  if (responses.length === 0) findings.push('no responses were probed');
  for (const response of responses) {
    if (response.status !== 200) {
      findings.push(`${response.path}: HTTP ${response.status}`);
      continue;
    }
    checkStaticHeaders(policy, response, findings);
    checkCsp(policy, response, expectedConnectSrc, findings);
    checkCacheControl(policy, response, findings);
  }
  return findings;
}

async function probe(baseUrl, path, cacheRule) {
  const response = await fetch(new URL(path, baseUrl), { redirect: 'manual' });
  const headers = Object.fromEntries(response.headers.entries());
  const body = await response.text();
  return { path, status: response.status, headers, body: path === '/' ? body : '', cacheRule };
}

/** Fetches the HTML shell, a deep route, the manifest and one hashed asset. */
export async function probeAll(baseUrl) {
  const responses = [];
  for (const path of HTML_PATHS) {
    responses.push(await probe(baseUrl, path, '/index.html'));
  }
  responses.push(await probe(baseUrl, '/site.webmanifest', '/site.webmanifest'));
  const shell = responses.find((response) => response.path === '/');
  const asset = STATIC_ASSET_PATTERN.exec(shell.body);
  if (!asset) throw new Error('the HTML shell at / references no /static/ script');
  responses.push(await probe(baseUrl, asset[1], '/static/**'));
  return responses;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const policy = loadPolicy(args.policy);
  const baseline = committedConnectSrc(JSON.parse(readFileSync(args.serveConfig, 'utf8')), policy);
  const responses = await probeAll(args.url);
  const findings = evaluate(policy, responses, baseline, args.expectConnect);
  if (findings.length > 0) {
    console.error(`check-security-headers: ${findings.length} finding(s) against ${args.url}`);
    for (const finding of findings) console.error(`  ${finding}`);
    process.exit(1);
  }
  console.log(
    `check-security-headers: ${responses.length} responses from ${args.url} match config/security-headers.json`
  );
  process.exit(0);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`check-security-headers: ${error.message}`);
    process.exit(1);
  });
}
