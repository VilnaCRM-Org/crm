/**
 * Response evaluation for the browser security-header gate (issue #113): pure functions over
 * already-fetched responses, kept apart from the probing CLI in check-security-headers.mjs so
 * each half stays small enough to read in one sitting.
 */

import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const require = createRequire(import.meta.url);
const { CACHE_CONTROL, CONNECT_SRC, CSP_HEADER, parseCsp } = require(
  resolve(dirname(fileURLToPath(import.meta.url)), '../security-headers.js')
);

function sameSet(actual, expected) {
  const a = new Set(actual);
  const b = new Set(expected);
  return a.size === b.size && [...a].every((entry) => b.has(entry));
}

function checkStaticHeaders(headers, response, findings) {
  for (const { key, value } of headers) {
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
  for (const directive of Object.keys(directives)) {
    if (!(directive in policy.contentSecurityPolicy.directives)) {
      findings.push(`${response.path}: ${CSP_HEADER} carries undeclared directive ${directive}`);
    }
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
 * A response is `{ path, status, headers, document, cacheRule? }` with lowercase header names
 * and `document: true` for the HTML shell; `baselineConnectSrc` is the connect-src the
 * committed serve.json carries.
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
    checkStaticHeaders(policy.response.headers, response, findings);
    if (response.document) {
      checkStaticHeaders(policy.document.headers, response, findings);
      checkCsp(policy, response, expectedConnectSrc, findings);
    }
    checkCacheControl(policy, response, findings);
  }
  return findings;
}
