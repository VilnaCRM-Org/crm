import { mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { cruise } from 'dependency-cruiser';

import { FIXTURES } from './depcruise-rule-fixtures.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const require = createRequire(path.join(repoRoot, 'package.json'));
const config = require(path.join(repoRoot, '.dependency-cruiser.js'));

const materialize = (root, name, files) => {
  for (const [relativePath, content] of Object.entries(files)) {
    const absolute = path.join(root, name, relativePath);
    mkdirSync(path.dirname(absolute), { recursive: true });
    writeFileSync(absolute, content);
  }
};

const entryDirectories = (baseDir) =>
  readdirSync(baseDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== 'node_modules')
    .map((entry) => entry.name)
    .sort();

// `tsConfig` names a cwd-relative `tsconfig.json` whose `baseUrl`/`paths` let a fixture's aliased
// import resolve out of the sandbox and into the real `src/` (verified: the cruise then dies with
// "Unusual baseDir passed to package reading function"). It must be dropped from the ruleSet too —
// dependency-cruiser merges `ruleSet.options` back into the cruise options, so stripping it from
// only the outer spread leaves it active. Fixtures import relatively; an alias must stay
// unresolvable so it trips `not-to-unresolvable` instead of escaping.
const { tsConfig, ...cruiseOptions } = config.options;
const fixtureRuleSet = { ...config, options: cruiseOptions };

const firedRules = async (baseDir, entries) => {
  const result = await cruise(entries, {
    ...cruiseOptions,
    baseDir,
    validate: true,
    ruleSet: fixtureRuleSet,
    outputType: 'json',
  });
  const output = typeof result.output === 'string' ? JSON.parse(result.output) : result.output;
  return [
    ...new Set(output.summary.violations.map((v) => `${v.rule.severity}:${v.rule.name}`)),
  ].sort();
};

const root = mkdtempSync(path.join(os.tmpdir(), 'depcruise-rule-fixtures-'));
const report = { rules: {}, fired: {} };
try {
  for (const [name, fixture] of Object.entries(FIXTURES)) {
    materialize(root, name, fixture.files);
  }
  for (const [name, fixture] of Object.entries(FIXTURES)) {
    const baseDir = path.join(root, name);
    report.fired[name] = await firedRules(baseDir, fixture.entries ?? entryDirectories(baseDir));
  }
} finally {
  rmSync(root, { recursive: true, force: true });
}
const severityOf = new Map(config.forbidden.map((rule) => [rule.name, rule.severity]));
const qualify = (name) => `${severityOf.get(name) ?? 'unknown'}:${name}`;
report.rules = config.forbidden.map((rule) => ({ name: rule.name, severity: rule.severity }));
report.expected = Object.fromEntries(
  Object.entries(FIXTURES).map(([name, fixture]) => [
    name,
    [qualify(name), ...(fixture.alsoFires ?? []).map(qualify)].sort(),
  ])
);
report.alsoFires = Object.fromEntries(
  Object.entries(FIXTURES)
    .filter(([, fixture]) => (fixture.alsoFires ?? []).length > 0)
    .map(([name, fixture]) => [name, fixture.alsoFires])
);
process.stdout.write(JSON.stringify(report));
