// scripts/ci/check-licenses.mjs
//
// SPDX-aware dependency license gate (issue #191). Enumerates the production dependency tree
// with license-checker-rseidelsohn (--json) and validates every declared license against the
// SPDX allowlist in ALLOWED_LICENSES using `spdx-satisfies`, which evaluates compound
// expressions SEMANTICALLY:
//   - `(A OR B)`  passes iff at least one operand is allowed (you may take that option);
//   - `(A AND B)` passes iff EVERY operand is allowed (you are bound by all of them);
//   - a non-SPDX / unknown string ("UNKNOWN", "SEE LICENSE IN …", "Custom", guessed "MIT*")
//     throws in the parser and is treated as DISALLOWED (fail-closed).
//
// A literal `--onlyAllow` allowlist (the prior implementation) is NOT sufficient: license-
// checker's operand matching lets `(GPL-3.0-only AND MIT)` pass merely because MIT is allowed,
// even though the AND expression binds you to GPL. This gate closes that hole.
//
// Runs in a plain `node` process from the Makefile (`make lint-licenses`). `--stdin` reads a
// license map from stdin instead of shelling out, so the gate's own logic is unit-tested
// (tests/unit/scripts/check-licenses.test.ts) without fixture node_modules trees.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import process from 'node:process';
import spdxSatisfies from 'spdx-satisfies';

/**
 * Parse the semicolon-separated SPDX operand allowlist (e.g. "MIT;Apache-2.0;ISC").
 * @param {string} raw value of ALLOWED_LICENSES
 * @returns {string[]} trimmed, non-empty SPDX operand ids
 */
function parseAllowed(raw) {
  return (raw || '')
    .split(';')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

/**
 * Normalize license-checker's `licenses` field (string | string[]) to one SPDX expression.
 * An array means several licenses were detected for one package; join with AND so the pool must
 * satisfy every one (fail-closed).
 * @param {string|string[]} licenses
 * @returns {string} an SPDX expression (empty string when no license was detected)
 */
function toExpression(licenses) {
  if (Array.isArray(licenses)) return licenses.map((license) => `(${license})`).join(' AND ');
  return String(licenses ?? '');
}

/**
 * @param {string} expression an SPDX license expression
 * @param {string[]} allowed the permitted operand pool
 * @returns {boolean} true iff `expression` is satisfied by `allowed`; unparseable/unknown
 *   strings throw in the parser and are rejected (fail-closed).
 */
function isAllowed(expression, allowed) {
  if (!expression) return false;
  try {
    return spdxSatisfies(expression, allowed);
  } catch {
    return false;
  }
}

/**
 * @param {Record<string, {licenses?: string|string[]}>} licenseMap license-checker JSON output
 * @param {string[]} allowed the permitted operand pool
 * @returns {{pkg: string, license: string}[]} packages whose license is not satisfied by `allowed`
 */
function findOffenders(licenseMap, allowed) {
  const offenders = [];
  for (const [pkg, info] of Object.entries(licenseMap)) {
    const expression = toExpression(info?.licenses);
    if (!isAllowed(expression, allowed)) {
      offenders.push({ pkg, license: expression || '(none)' });
    }
  }
  return offenders;
}

/**
 * Obtain the production dependency license map — from stdin in `--stdin` (test) mode, otherwise
 * by shelling out to license-checker-rseidelsohn over the production tree.
 * @returns {Record<string, {licenses?: string|string[]}>}
 */
function readLicenseMap() {
  if (process.argv.includes('--stdin')) {
    return JSON.parse(readFileSync(0, 'utf8'));
  }
  const json = execFileSync(
    'node_modules/.bin/license-checker-rseidelsohn',
    ['--production', '--excludePrivatePackages', '--json'],
    { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }
  );
  return JSON.parse(json);
}

const allowed = parseAllowed(process.env.ALLOWED_LICENSES);
if (allowed.length === 0) {
  process.stderr.write('check-licenses: ALLOWED_LICENSES is empty — refusing to run.\n');
  process.exit(2);
}

const licenseMap = readLicenseMap();
const offenders = findOffenders(licenseMap, allowed);

if (offenders.length > 0) {
  process.stderr.write(
    'Dependency license gate failed — licenses not satisfied by the SPDX allowlist:\n'
  );
  for (const offender of offenders) {
    process.stderr.write(`  ${offender.pkg}: ${offender.license}\n`);
  }
  process.stderr.write(`Allowed operands: ${allowed.join(', ')}\n`);
  process.stderr.write(
    'Remediation (issue #191): replace the dependency, or add its SPDX id to ALLOWED_LICENSES ' +
      'in the Makefile as a reviewed one-line diff. Never bypass the checker.\n'
  );
  process.exit(1);
}

process.stdout.write(
  `license gate: ${Object.keys(licenseMap).length} production dependencies satisfy the SPDX allowlist.\n`
);
