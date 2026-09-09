// tests/unit/scripts/check-licenses.test.ts
//
// Must-fail / must-pass coverage for the SPDX-aware dependency license gate (issue #191). The
// gate replaced a literal `--onlyAllow` allowlist — which let `(GPL-3.0 AND MIT)` through
// because MIT is an allowed operand — with semantic `spdx-satisfies` evaluation. This suite
// pins that behaviour by feeding synthetic license maps to `scripts/ci/check-licenses.mjs`
// via its `--stdin` mode and asserting the exit code, so a regression to loose operand matching
// (or an accidental fail-open on unknown licenses) fails the build.
//
// The gate script is ESM and shells out, so it runs in a child `node` process rather than being
// imported into jest's CJS vm.
import { spawnSync } from 'node:child_process';

const ALLOWED = 'MIT;Apache-2.0;ISC;BSD-2-Clause;BSD-3-Clause;0BSD;CC-BY-4.0';

function runGate(licenseMap: Record<string, { licenses: string | string[] }>): number {
  const result = spawnSync('node', ['scripts/ci/check-licenses.mjs', '--stdin'], {
    input: JSON.stringify(licenseMap),
    env: { ...process.env, ALLOWED_LICENSES: ALLOWED },
    encoding: 'utf8',
  });
  return result.status ?? 1;
}

describe('SPDX-aware dependency license gate (issue #191)', () => {
  it.each([
    ['plain allowed license (MIT)', { 'mit@1.0.0': { licenses: 'MIT' } }],
    ['allowed OR compound', { 'a@1.0.0': { licenses: '(MIT OR Apache-2.0)' } }],
    [
      'allowed AND compound (both operands allowed)',
      { 'b@1.0.0': { licenses: '(MIT AND BSD-3-Clause)' } },
    ],
    ['OR compound with one allowed operand', { 'c@1.0.0': { licenses: '(GPL-3.0-only OR MIT)' } }],
    ['array of allowed licenses', { 'd@1.0.0': { licenses: ['MIT', 'ISC'] } }],
  ])('passes: %s', (_label, map) => {
    expect(runGate(map)).toBe(0);
  });

  it.each([
    // The regression the gate exists to catch: an AND compound binds you to every operand, so a
    // disallowed copyleft operand must fail even though MIT is allowed.
    [
      'AND compound with a disallowed operand',
      { 'gpl-and@1.0.0': { licenses: '(GPL-3.0-only AND MIT)' } },
    ],
    ['plain disallowed copyleft (GPL)', { 'gpl@1.0.0': { licenses: 'GPL-3.0-only' } }],
    ['plain disallowed copyleft (AGPL)', { 'agpl@1.0.0': { licenses: 'AGPL-3.0-only' } }],
    [
      'OR compound with no allowed operand',
      { 'o@1.0.0': { licenses: '(GPL-3.0-only OR AGPL-3.0-only)' } },
    ],
    ['unknown / undetected license', { 'u@1.0.0': { licenses: 'UNKNOWN' } }],
    ['non-SPDX custom string', { 's@1.0.0': { licenses: 'SEE LICENSE IN LICENSE.txt' } }],
    ['guessed (starred) license', { 'g@1.0.0': { licenses: 'MIT*' } }],
    ['array with one disallowed member', { 'arr@1.0.0': { licenses: ['MIT', 'GPL-3.0-only'] } }],
  ])('rejects: %s', (_label, map) => {
    expect(runGate(map)).not.toBe(0);
  });
});
