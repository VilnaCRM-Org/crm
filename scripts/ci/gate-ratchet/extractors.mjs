import Module, { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

import { loadConfigThresholds, loadThresholdFallbacks } from './load-extractors.mjs';
import { addNumeric, addSet, canonicalJson, emptySnapshot, readJson } from './snapshot.mjs';

const SEVERITY_RANK = { off: 0, warn: 1, error: 2 };

const ENV_ONLY_STUBS = new Map([
  ['dotenv', { config: () => ({ parsed: {} }) }],
  ['dotenv-expand', { expand: (config) => config }],
]);

export function installEnvOnlyStubs() {
  const originalLoad = Module._load;
  Module._load = function gateRatchetLoad(request, parent, isMain) {
    if (ENV_ONLY_STUBS.has(request)) return ENV_ONLY_STUBS.get(request);
    return originalLoad.call(this, request, parent, isMain);
  };
}

function lhciAssertions(absolutePath) {
  const require = createRequire(pathToFileURL(absolutePath));
  const assertions = require(absolutePath)?.ci?.assert?.assertions ?? {};
  const snapshot = emptySnapshot();
  for (const [name, spec] of Object.entries(assertions)) {
    const [level, options] = Array.isArray(spec) ? spec : [spec, {}];
    if (typeof level === 'string' && level in SEVERITY_RANK) {
      addNumeric(snapshot, `${name}.level`, SEVERITY_RANK[level], 'min');
    }
    if (options && typeof options === 'object') {
      addNumeric(snapshot, `${name}.minScore`, options.minScore, 'min');
      addNumeric(snapshot, `${name}.maxNumericValue`, options.maxNumericValue, 'max');
    }
  }
  addSet(snapshot, 'assertions', Object.keys(assertions), 'no-shrink');
  return snapshot;
}

async function strykerThresholds(absolutePath) {
  const module = await import(pathToFileURL(absolutePath).href);
  const thresholds = (module.default ?? module)?.thresholds ?? {};
  const snapshot = emptySnapshot();
  for (const key of ['break', 'low', 'high']) {
    addNumeric(snapshot, `thresholds.${key}`, thresholds[key], 'min');
  }
  addSet(snapshot, 'thresholds.keys', Object.keys(thresholds), 'no-shrink');
  return snapshot;
}

async function jestCoverage(absolutePath) {
  const module = await import(pathToFileURL(absolutePath).href);
  const config = module.default ?? module;
  const scope = process.env.TEST_ENV || 'default';
  const snapshot = emptySnapshot();
  const global = config?.coverageThreshold?.global ?? {};
  for (const metric of ['branches', 'functions', 'lines', 'statements']) {
    addNumeric(snapshot, `coverageThreshold.global.${metric}[${scope}]`, global[metric], 'min');
  }
  const patterns = Array.isArray(config?.collectCoverageFrom) ? config.collectCoverageFrom : [];
  const isExclusion = (pattern) => pattern.startsWith('!');
  addSet(
    snapshot,
    `collectCoverageFrom.exclusions[${scope}]`,
    patterns.filter(isExclusion),
    'no-grow'
  );
  addSet(
    snapshot,
    `collectCoverageFrom.inclusions[${scope}]`,
    patterns.filter((pattern) => !isExclusion(pattern)),
    'no-shrink'
  );
  // Two sibling keys drop files out of the global threshold just as effectively as a `!` entry
  // above: `coveragePathIgnorePatterns` removes them from the instrumented set, and a path-specific
  // `coverageThreshold` override both exempts those files and takes them out of the global figure.
  addSet(
    snapshot,
    `coveragePathIgnorePatterns[${scope}]`,
    Array.isArray(config?.coveragePathIgnorePatterns) ? config.coveragePathIgnorePatterns : [],
    'no-grow'
  );
  addSet(
    snapshot,
    `coverageThreshold.pathOverrides[${scope}]`,
    Object.keys(config?.coverageThreshold ?? {}).filter((key) => key !== 'global'),
    'no-grow'
  );
  return snapshot;
}

function metricsPolicyHard(absolutePath) {
  const hard = readJson(absolutePath)?.hard ?? {};
  const snapshot = emptySnapshot();
  for (const [key, value] of Object.entries(hard)) {
    addNumeric(snapshot, `hard.${key}`, value, key.endsWith('_min') ? 'min' : 'max');
  }
  addSet(snapshot, 'hard.keys', Object.keys(hard), 'no-shrink');
  return snapshot;
}

function jscpd(absolutePath) {
  const config = readJson(absolutePath);
  const snapshot = emptySnapshot();
  for (const key of ['threshold', 'minTokens', 'minLines']) {
    addNumeric(snapshot, key, config[key], 'max');
  }
  addSet(snapshot, 'ignore', config.ignore ?? [], 'no-grow');
  addSet(snapshot, 'path', config.path ?? [], 'no-shrink');
  addSet(snapshot, 'format', config.format ?? [], 'no-shrink');
  return snapshot;
}

function jsonBudgetMax(absolutePath) {
  const config = readJson(absolutePath);
  const snapshot = emptySnapshot();
  const keys = [];
  for (const group of ['raw', 'gzip', 'lighthouse']) {
    for (const [key, value] of Object.entries(config[group] ?? {})) {
      keys.push(`${group}.${key}`);
      addNumeric(snapshot, `${group}.${key}`, value, 'max');
    }
  }
  addSet(snapshot, 'budgetKeys', keys, 'no-shrink');
  return snapshot;
}

// Only compiler options whose `true` value makes the type checker STRICTER. Disabling one is a
// weakening; options like `skipLibCheck` or `allowJs` are excluded because `true` loosens them.
const TSCONFIG_STRICT_FLAGS = [
  'strict',
  'noImplicitAny',
  'strictNullChecks',
  'strictFunctionTypes',
  'strictBindCallApply',
  'strictPropertyInitialization',
  'useUnknownInCatchVariables',
  'alwaysStrict',
  'noUncheckedIndexedAccess',
  'noImplicitOverride',
  'noUnusedLocals',
  'noUnusedParameters',
  'noFallthroughCasesInSwitch',
  'noImplicitReturns',
  'noPropertyAccessFromIndexSignature',
  'exactOptionalPropertyTypes',
  'forceConsistentCasingInFileNames',
];

function tsconfigStrictFlags(absolutePath) {
  const options = readJson(absolutePath)?.compilerOptions ?? {};
  const snapshot = emptySnapshot();
  addSet(
    snapshot,
    'compilerOptions.enabledStrictFlags',
    TSCONFIG_STRICT_FLAGS.filter((flag) => options[flag] === true),
    'no-shrink'
  );
  return snapshot;
}

function manifestSelf(absolutePath) {
  const manifest = readJson(absolutePath);
  const files = Array.isArray(manifest.files) ? manifest.files : [];
  const snapshot = emptySnapshot();
  addSet(
    snapshot,
    'guardedFiles',
    files.map((entry) => `${entry.path}::${entry.extract}`),
    'no-shrink'
  );
  // `dependsOn` decides which edits wake the check, `envs` decides which scopes are compared, and
  // `waiverLabel` decides what waives a finding. Dropping any of them weakens the gate while
  // leaving `guardedFiles` untouched, so each is guarded in its own right.
  addSet(
    snapshot,
    'guardedDependsOn',
    files.flatMap((entry) => (entry.dependsOn ?? []).map((dep) => `${entry.path}::${dep}`)),
    'no-shrink'
  );
  // `?? [{}]` mirrors the runtime default in ../check-gate-ratchet.mjs (one directory up,
  // where the scope loop lives). Snapshotting omitted `envs` as an empty contribution would
  // make `envs: []` — which compares ZERO scopes, i.e. disables the entry entirely —
  // indistinguishable from omitting the key, and the guard would fail open.
  // Keys are sorted so a pure reordering is not reported as a removed scope.
  addSet(
    snapshot,
    'guardedEnvs',
    files.flatMap((entry) =>
      (entry.envs ?? [{}]).map((env) => `${entry.path}::${canonicalJson(env)}`)
    ),
    'no-shrink'
  );
  addSet(snapshot, 'waiverLabel', [String(manifest.waiverLabel ?? '')], 'no-shrink');
  return snapshot;
}

export const EXTRACTORS = {
  'lhci-assertions': lhciAssertions,
  'stryker-thresholds': strykerThresholds,
  'jest-coverage': jestCoverage,
  'metrics-policy-hard': metricsPolicyHard,
  jscpd,
  'json-budget-max': jsonBudgetMax,
  'tsconfig-strict-flags': tsconfigStrictFlags,
  'manifest-self': manifestSelf,
  'load-config-thresholds': loadConfigThresholds,
  'load-threshold-fallbacks': loadThresholdFallbacks,
};
