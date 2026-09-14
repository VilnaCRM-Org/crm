#!/usr/bin/env node
/**
 * scripts/security-headers.js - the browser security-header baseline (issue #113).
 *
 * Reads config/security-headers.json, the single source of truth, and renders it into the
 * `headers` block of serve.json. Shared by scripts/generate-serve-config.js (build time),
 * scripts/render-security-headers.js (container start) and scripts/ci/check-security-headers.mjs
 * (the CI gate), so the three can never disagree about what the baseline is.
 *
 * Plain CommonJS with no dependencies on purpose: the production image runs it with the bare
 * node binary and no node_modules.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const CSP_HEADER = 'Content-Security-Policy';
const CONNECT_SRC = 'connect-src';
const CACHE_CONTROL = 'Cache-Control';
const POLICY_PATH = path.resolve(__dirname, '../config/security-headers.json');

function assertPolicyShape(policy) {
  const csp = policy && policy.contentSecurityPolicy;
  const valid =
    policy &&
    typeof policy.source === 'string' &&
    Array.isArray(policy.headers) &&
    csp &&
    csp.directives &&
    typeof csp.directives === 'object' &&
    Array.isArray(csp.directives[CONNECT_SRC]) &&
    csp.connectSrcFromEnv &&
    Array.isArray(csp.connectSrcFromEnv.build) &&
    Array.isArray(csp.connectSrcFromEnv.runtime) &&
    Array.isArray(policy.cacheControl);

  if (!valid) {
    throw new Error(
      'config/security-headers.json is malformed: expected source, headers[], ' +
        'contentSecurityPolicy.directives (with connect-src), connectSrcFromEnv.{build,runtime} ' +
        'and cacheControl[].'
    );
  }

  return policy;
}

const HSTS_MIN_MAX_AGE = 15552000;
const LOCKED_DIRECTIVES = {
  'default-src': ["'self'"],
  'frame-ancestors': ["'none'"],
  'base-uri': ["'self'"],
  'object-src': ["'none'"],
};
const SCRIPT_SRC_FORBIDDEN = ["'unsafe-inline'", "'unsafe-eval'", '*', 'http:', 'https:', 'data:'];
const REQUIRED_HEADERS = {
  'Strict-Transport-Security': (value) => {
    const maxAge = /max-age=(\d+)/.exec(value);
    return (
      Boolean(maxAge) && Number(maxAge[1]) >= HSTS_MIN_MAX_AGE && /includeSubDomains/.test(value)
    );
  },
  'X-Frame-Options': (value) => value === 'DENY' || value === 'SAMEORIGIN',
  'X-Content-Type-Options': (value) => value === 'nosniff',
  'Referrer-Policy': (value) => value.length > 0 && value !== 'unsafe-url',
  'Permissions-Policy': (value) => value.length > 0,
};

function headerValue(policy, key) {
  const header = policy.headers.find((entry) => entry.key === key);

  return header ? header.value : undefined;
}

function assertHeaderFloors(policy, failures) {
  for (const [key, accepts] of Object.entries(REQUIRED_HEADERS)) {
    const value = headerValue(policy, key);

    if (value === undefined) {
      failures.push(`${key} is missing`);
    } else if (!accepts(value)) {
      failures.push(`${key} "${value}" is weaker than the baseline floor`);
    }
  }
}

function assertCspFloors(directives, failures) {
  for (const [directive, locked] of Object.entries(LOCKED_DIRECTIVES)) {
    const sources = directives[directive];

    if (!sources || sources.length !== locked.length || !locked.every((s) => sources.includes(s))) {
      failures.push(`${directive} must be exactly ${locked.join(' ')}`);
    }
  }

  for (const source of directives['script-src'] || []) {
    if (SCRIPT_SRC_FORBIDDEN.includes(source)) {
      failures.push(`script-src must not carry ${source}`);
    }
  }

  for (const [directive, sources] of Object.entries(directives)) {
    if (sources.includes('*')) {
      failures.push(`${directive} must not carry the * wildcard`);
    }
  }
}

function assertBaselineFloors(policy) {
  const failures = [];

  assertHeaderFloors(policy, failures);
  assertCspFloors(policy.contentSecurityPolicy.directives, failures);

  if (failures.length > 0) {
    throw new Error(
      `config/security-headers.json weakens the browser security baseline:\n  ${failures.join('\n  ')}`
    );
  }

  return policy;
}

function loadPolicy(policyPath = POLICY_PATH) {
  return assertBaselineFloors(assertPolicyShape(JSON.parse(fs.readFileSync(policyPath, 'utf8'))));
}

function originOf(raw) {
  if (typeof raw !== 'string' || !raw.trim()) {
    return null;
  }

  let parsed;

  try {
    parsed = new URL(raw.trim());
  } catch {
    return null;
  }

  return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.origin : null;
}

function originsFromEnv(variables, env) {
  const origins = [];

  for (const variable of variables) {
    const raw = env[variable];
    const origin = originOf(raw);

    if (!origin && typeof raw === 'string' && raw.trim()) {
      throw new Error(`${variable} must be an absolute http or https URL, got "${raw}".`);
    }

    if (origin && !origins.includes(origin)) {
      origins.push(origin);
    }
  }

  return origins;
}

function mergeSources(base, extra) {
  const merged = [...base];

  for (const source of extra) {
    if (!merged.includes(source)) {
      merged.push(source);
    }
  }

  return merged;
}

function serializeCsp(directives) {
  return Object.entries(directives)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ');
}

function parseCsp(value) {
  const directives = {};

  for (const clause of value.split(';')) {
    const [directive, ...sources] = clause.trim().split(/\s+/);

    if (directive) {
      directives[directive] = sources;
    }
  }

  return directives;
}

function buildCsp(policy, extraConnectSrc = []) {
  const { directives } = policy.contentSecurityPolicy;
  const connectSrc = mergeSources(directives[CONNECT_SRC], extraConnectSrc);

  return serializeCsp({ ...directives, [CONNECT_SRC]: connectSrc });
}

function securityHeaders(policy, extraConnectSrc = []) {
  return [
    { key: CSP_HEADER, value: buildCsp(policy, extraConnectSrc) },
    ...policy.headers.map(({ key, value }) => ({ key, value })),
  ];
}

function cacheControlRules(policy) {
  return policy.cacheControl.map(({ source, value }) => ({
    source,
    headers: [{ key: CACHE_CONTROL, value }],
  }));
}

function renderHeadersBlock(policy, extraConnectSrc = []) {
  return [
    { source: policy.source, headers: securityHeaders(policy, extraConnectSrc) },
    ...cacheControlRules(policy),
  ];
}

function renderServeConfig(policy, env, existing = {}) {
  const buildOrigins = originsFromEnv(policy.contentSecurityPolicy.connectSrcFromEnv.build, env);

  return { ...existing, headers: renderHeadersBlock(policy, buildOrigins) };
}

function findCspHeader(serveConfig, source) {
  const rule = (serveConfig.headers || []).find((entry) => entry.source === source);
  const header = rule && rule.headers.find((entry) => entry.key === CSP_HEADER);

  if (!header) {
    throw new Error(`serve.json carries no ${CSP_HEADER} header for source "${source}".`);
  }

  return header;
}

function extendRuntimeConnectSrc(serveConfig, policy, env) {
  const runtimeOrigins = originsFromEnv(
    policy.contentSecurityPolicy.connectSrcFromEnv.runtime,
    env
  );
  const header = findCspHeader(serveConfig, policy.source);
  const directives = parseCsp(header.value);

  directives[CONNECT_SRC] = mergeSources(directives[CONNECT_SRC] || [], runtimeOrigins);
  header.value = serializeCsp(directives);

  return runtimeOrigins;
}

module.exports = {
  CACHE_CONTROL,
  CONNECT_SRC,
  CSP_HEADER,
  POLICY_PATH,
  assertBaselineFloors,
  buildCsp,
  cacheControlRules,
  extendRuntimeConnectSrc,
  loadPolicy,
  originOf,
  originsFromEnv,
  parseCsp,
  renderHeadersBlock,
  renderServeConfig,
  securityHeaders,
  serializeCsp,
};
