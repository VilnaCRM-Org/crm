#!/usr/bin/env node
/**
 * scripts/render-security-headers.js - extend the Content-Security-Policy connect-src of the
 * served serve.json with the runtime API origins (issue #113).
 *
 * The committed serve.json allows the build-time REACT_APP_* API origins. When a deployment
 * repoints the app through APP_CONFIG_API_BASE_URL / APP_CONFIG_GRAPHQL_URL (issue #145), the
 * browser connects to those origins instead, so the same container start that renders them into
 * the HTML shell also allows them here. The served file is always rendered from the immutable
 * baseline the image ships, never from the previous start's output, so an override that is
 * changed or cleared between restarts leaves no stale origin behind. Everything else in the
 * baseline stays byte-identical.
 *
 * Run by scripts/docker-entrypoint.sh after render-app-config.js; also runnable directly:
 *   node scripts/render-security-headers.js <baseline serve.json> [<served serve.json>]
 */

'use strict';

const fs = require('fs');

const { extendRuntimeConnectSrc, loadPolicy } = require('./security-headers');

function renderSecurityHeaders(serveJson, env, policy) {
  const serveConfig = JSON.parse(serveJson);
  const origins = extendRuntimeConnectSrc(serveConfig, policy, env);

  return { origins, rendered: `${JSON.stringify(serveConfig, null, 2)}\n` };
}

function main(argv, env) {
  const baseline = argv[2];
  const target = argv[3] || baseline;

  if (!baseline) {
    throw new Error(
      'usage: node scripts/render-security-headers.js <baseline serve.json> [<served serve.json>]'
    );
  }

  const policy = loadPolicy(env.SECURITY_HEADERS_POLICY);
  const { origins, rendered } = renderSecurityHeaders(
    fs.readFileSync(baseline, 'utf8'),
    env,
    policy
  );

  fs.writeFileSync(target, rendered);

  return origins;
}

module.exports = { renderSecurityHeaders };

if (require.main === module) {
  try {
    const origins = main(process.argv, process.env);
    const summary = origins.length ? origins.join(' ') : '(no runtime API origins)';

    process.stdout.write(`render-security-headers: connect-src extended with ${summary}\n`);
  } catch (error) {
    process.stderr.write(`render-security-headers: ${error.message}\n`);
    process.exit(1);
  }
}
