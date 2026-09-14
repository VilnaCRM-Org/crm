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

const isObject = (value) => Boolean(value) && typeof value === 'object';

const isHeaderRule = (rule) =>
  isObject(rule) && typeof rule.source === 'string' && Array.isArray(rule.headers);

const SHAPE_CHECKS = [
  (policy) => isHeaderRule(policy.document),
  (policy) => isHeaderRule(policy.response),
  (policy) => Array.isArray(policy.cacheControl),
  (policy) => isObject(policy.contentSecurityPolicy),
  (policy) => isObject(policy.contentSecurityPolicy.directives),
  (policy) => Array.isArray(policy.contentSecurityPolicy.directives[CONNECT_SRC]),
  (policy) => isObject(policy.contentSecurityPolicy.connectSrcFromEnv),
  (policy) => Array.isArray(policy.contentSecurityPolicy.connectSrcFromEnv.build),
  (policy) => Array.isArray(policy.contentSecurityPolicy.connectSrcFromEnv.runtime),
];

function assertPolicyShape(policy) {
  const valid = isObject(policy) && SHAPE_CHECKS.every((check) => check(policy));

  if (!valid) {
    throw new Error(
      'config/security-headers.json is malformed: expected document.{source,headers[]}, ' +
        'response.{source,headers[]}, contentSecurityPolicy.directives (with connect-src), ' +
        'connectSrcFromEnv.{build,runtime} and cacheControl[].'
    );
  }

  return policy;
}

const HSTS_MIN_MAX_AGE = 15552000;
const LOCKED_DIRECTIVES = {
  'default-src': ["'self'"],
  'frame-ancestors': ["'none'"],
  'form-action': ["'self'"],
  'base-uri': ["'self'"],
  'object-src': ["'none'"],
};
const SCRIPT_SRC_FORBIDDEN = ["'unsafe-inline'", "'unsafe-eval'", '*', 'http:', 'https:', 'data:'];

function hstsDirectives(value) {
  return value
    .split(';')
    .map((directive) => directive.trim().toLowerCase())
    .filter(Boolean);
}

function acceptsHsts(value) {
  const directives = hstsDirectives(value);
  const maxAge = directives.find((directive) => /^max-age=\d+$/.test(directive));

  return (
    maxAge !== undefined &&
    Number(maxAge.slice('max-age='.length)) >= HSTS_MIN_MAX_AGE &&
    directives.includes('includesubdomains')
  );
}

const REQUIRED_HEADERS = {
  'Strict-Transport-Security': acceptsHsts,
  'X-Frame-Options': (value) => value === 'DENY' || value === 'SAMEORIGIN',
  'X-Content-Type-Options': (value) => value === 'nosniff',
  'Referrer-Policy': (value) => value.length > 0 && value !== 'unsafe-url',
  'Permissions-Policy': (value) => value.length > 0,
};

function allHeaders(policy) {
  return [...policy.response.headers, ...policy.document.headers];
}

function headerValue(policy, key) {
  const header = allHeaders(policy).find((entry) => entry.key === key);

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
    const details = failures.join('\n  ');

    throw new Error(
      `config/security-headers.json weakens the browser security baseline:\n  ${details}`
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
    const [rawDirective, ...sources] = clause.trim().split(/\s+/);
    const directive = rawDirective.toLowerCase();

    if (!directive) {
      continue;
    }

    if (Object.prototype.hasOwnProperty.call(directives, directive)) {
      throw new Error(
        `${CSP_HEADER} repeats the ${directive} directive; browsers enforce only the first one.`
      );
    }

    directives[directive] = sources;
  }

  return directives;
}

function buildCsp(policy, extraConnectSrc = []) {
  const { directives } = policy.contentSecurityPolicy;
  const connectSrc = mergeSources(directives[CONNECT_SRC], extraConnectSrc);

  return serializeCsp({ ...directives, [CONNECT_SRC]: connectSrc });
}

function documentHeaders(policy, extraConnectSrc = []) {
  return [
    { key: CSP_HEADER, value: buildCsp(policy, extraConnectSrc) },
    ...policy.document.headers.map(({ key, value }) => ({ key, value })),
  ];
}

function responseHeaders(policy) {
  return policy.response.headers.map(({ key, value }) => ({ key, value }));
}

function cacheControlRules(policy) {
  return policy.cacheControl.map(({ source, value }) => ({
    source,
    headers: [{ key: CACHE_CONTROL, value }],
  }));
}

function renderHeadersBlock(policy, extraConnectSrc = []) {
  return [
    { source: policy.response.source, headers: responseHeaders(policy) },
    { source: policy.document.source, headers: documentHeaders(policy, extraConnectSrc) },
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

function committedConnectSrc(serveConfig, policy) {
  return parseCsp(findCspHeader(serveConfig, policy.document.source).value)[CONNECT_SRC] || [];
}

function extendRuntimeConnectSrc(serveConfig, policy, env) {
  const runtimeOrigins = originsFromEnv(
    policy.contentSecurityPolicy.connectSrcFromEnv.runtime,
    env
  );
  const header = findCspHeader(serveConfig, policy.document.source);
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
  committedConnectSrc,
  documentHeaders,
  extendRuntimeConnectSrc,
  loadPolicy,
  originOf,
  originsFromEnv,
  parseCsp,
  renderHeadersBlock,
  renderServeConfig,
  responseHeaders,
  serializeCsp,
};
