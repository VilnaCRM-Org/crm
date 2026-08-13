import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  checkQueries,
  checkReadme,
  checkResolution,
  parsePolicy,
  resolveFamilies,
} from './browser-support';
import { reportViolations } from './violation-table';

const GATE = 'browser-support';

/** Fixed repository paths; never taken from argv so the gate stays path-injection safe. */
const ROOT = process.cwd();
const POLICY_PATH = resolve(ROOT, 'config', 'browser-support.json');
const PACKAGE_PATH = resolve(ROOT, 'package.json');
const README_PATH = resolve(ROOT, 'README.md');

const readJson = (path: string): unknown => {
  const raw = readFileSync(path, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`${path} is not valid JSON: ${String(error)}`);
  }
};

const readDeclaredQueries = (path: string): string[] => {
  const manifest = readJson(path) as { browserslist?: { production?: unknown } };
  const declared = manifest.browserslist?.production;

  // Every entry must already be a string: `String(["chrome >= 111"])` would coerce a nested
  // array into a query that compares equal to the policy while meaning something else.
  if (!Array.isArray(declared) || !declared.every((query) => typeof query === 'string')) {
    throw new Error(
      `${path}: "browserslist.production" must be an array of strings. ` +
        'Refusing to run with an undeclared browser matrix.'
    );
  }

  return declared;
};

const policy = parsePolicy(readJson(POLICY_PATH), POLICY_PATH);
const violations = [
  ...checkQueries(policy, readDeclaredQueries(PACKAGE_PATH)),
  ...checkResolution(policy, resolveFamilies(policy.queries)),
  ...checkReadme(policy, readFileSync(README_PATH, 'utf8')),
];

const familyCount = Object.keys(policy.families).length;
process.exitCode = reportViolations(
  GATE,
  violations,
  `${GATE}: ${familyCount} browser families match ${policy.baseline} ` +
    `with output.polyfill "${policy.polyfill}".`
);
