import { pathToFileURL } from 'node:url';

import { addNumeric, addSet, emptySnapshot, readJson } from './snapshot.mjs';

const SCENARIOS = ['smoke', 'average', 'stress', 'spike'];

// Every `endpoints.<name>.<scenario>.threshold` becomes the k6 assertion
// `http_req_duration{scenario:<scenario>}: p(99)<threshold`, which fails the load-testing
// workflow when breached. Raising the allowed p99 latency therefore weakens a binding budget
// exactly like raising a Lighthouse maxNumericValue.
export function loadConfigThresholds(absolutePath) {
  const endpoints = readJson(absolutePath)?.endpoints ?? {};
  const snapshot = emptySnapshot();
  const keys = [];
  for (const [endpoint, config] of Object.entries(endpoints)) {
    for (const scenario of SCENARIOS) {
      const value = config?.[scenario]?.threshold;
      if (typeof value !== 'number') continue;
      const key = `endpoints.${endpoint}.${scenario}.threshold`;
      keys.push(key);
      addNumeric(snapshot, key, value, 'max');
    }
  }
  addSet(snapshot, 'thresholdKeys', keys, 'no-shrink');
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
