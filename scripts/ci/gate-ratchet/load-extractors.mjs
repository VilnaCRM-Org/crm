import { pathToFileURL } from 'node:url';

import { addNumeric, addSet, emptySnapshot, readJson } from './snapshot.mjs';

const SCENARIOS = ['smoke', 'average', 'stress', 'spike'];

// Three binding k6 budgets live in this file, all of them assertions the load-testing workflow
// fails on:
//   - `endpoints.<name>.<scenario>.threshold` → `http_req_duration: p(99)<threshold` (a ceiling);
//   - `endpoints.<name>.thresholds.errorRate.<scenario>` → `http_req_failed: rate<=x` (a ceiling);
//   - `endpoints.<name>.thresholds.checkPassRate.<scenario>` → `checks: rate>=x` (a floor).
// The last two are per-endpoint OVERRIDES that `ScenarioUtils` feeds to `ThresholdsBuilder`
// (`new ThresholdsBuilder(this.endpointConfig.thresholds)`), so where they exist they — not the
// builder's fallback tables — are what k6 enforces. `overrideKeys` is `no-shrink` because deleting
// an override silently swaps in the builder default, which may be looser.
const OVERRIDES = [
  { group: 'errorRate', direction: 'max' },
  { group: 'checkPassRate', direction: 'min' },
];

function endpointRateOverrides(snapshot, endpoint, config, keys) {
  for (const { group, direction } of OVERRIDES) {
    for (const scenario of SCENARIOS) {
      const value = config?.thresholds?.[group]?.[scenario];
      if (typeof value !== 'number') continue;
      const key = `endpoints.${endpoint}.thresholds.${group}.${scenario}`;
      keys.push(key);
      addNumeric(snapshot, key, value, direction);
    }
  }
}

export function loadConfigThresholds(absolutePath) {
  const endpoints = readJson(absolutePath)?.endpoints ?? {};
  const snapshot = emptySnapshot();
  const latencyKeys = [];
  const overrideKeys = [];
  for (const [endpoint, config] of Object.entries(endpoints)) {
    for (const scenario of SCENARIOS) {
      const value = config?.[scenario]?.threshold;
      if (typeof value !== 'number') continue;
      const key = `endpoints.${endpoint}.${scenario}.threshold`;
      latencyKeys.push(key);
      addNumeric(snapshot, key, value, 'max');
    }
    endpointRateOverrides(snapshot, endpoint, config, overrideKeys);
  }
  addSet(snapshot, 'thresholdKeys', latencyKeys, 'no-shrink');
  addSet(snapshot, 'overrideKeys', overrideKeys, 'no-shrink');
  return snapshot;
}

const RATE_PATTERN = /^rate(>=|<=)([0-9.]+)$/;

function rateFrom(expressions) {
  const match = RATE_PATTERN.exec(String(expressions?.[0] ?? ''));
  return match ? Number(match[2]) : undefined;
}

// The builder's fallback error-rate and check-pass-rate tables are the effective k6 budget for
// every endpoint that does not override them, so they are just as binding as the values in the
// config file. Reading them through the public API rather than the source text keeps the guard
// working if the private tables are refactored.
export async function loadThresholdFallbacks(absolutePath) {
  const { default: ThresholdsBuilder } = await import(pathToFileURL(absolutePath).href);
  const snapshot = emptySnapshot();
  const keys = [];
  for (const scenario of SCENARIOS) {
    const built = new ThresholdsBuilder().addThreshold(scenario, { threshold: 1 }).build();
    const checkPassRate = rateFrom(built[`checks{scenario:${scenario}}`]);
    const errorRate = rateFrom(built[`http_req_failed{scenario:${scenario}}`]);
    keys.push(`${scenario}.checkPassRate`, `${scenario}.errorRate`);
    addNumeric(snapshot, `${scenario}.checkPassRate`, checkPassRate, 'min');
    addNumeric(snapshot, `${scenario}.errorRate`, errorRate, 'max');
  }
  addSet(snapshot, 'fallbackKeys', keys, 'no-shrink');
  return snapshot;
}
