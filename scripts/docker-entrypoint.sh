#!/usr/bin/env sh
# scripts/docker-entrypoint.sh - render the runtime configuration and the runtime CSP origins,
# then hand off to the server.
#
# WHY: RSBuild inlines every REACT_APP_* value at build time, so without a container-start
# rendering step each environment would need its own build and the artifact that was tested in
# staging could not be promoted to production unchanged (issue #145). Rendering here means the
# same image serves any environment: set APP_CONFIG_* variables and restart, no rebuild.
#
# Fails fast: an invalid APP_CONFIG_* value aborts the entrypoint with a non-zero status, so a
# misconfigured deployment never starts serving rather than degrading silently in the browser.
# The same start-up renders the served serve.json from the immutable baseline the image ships,
# extending the Content-Security-Policy connect-src with the APP_CONFIG_* API origins (issue
# #113), so a repointed API is reachable under the enforced CSP and a cleared override leaves
# no stale origin behind on restart.
#
# POSIX sh on purpose - the production image is plain alpine with the node binary: no bash,
# no jq and no envsubst.

set -eu

APP_ROOT="${APP_ROOT:-/app}"
APP_CONFIG_HTML="${APP_CONFIG_HTML:-${APP_ROOT}/dist/index.html}"
APP_CONFIG_RENDERER="${APP_CONFIG_RENDERER:-${APP_ROOT}/scripts/render-app-config.js}"
SERVE_CONFIG_BASELINE="${SERVE_CONFIG_BASELINE:-${APP_ROOT}/config/serve.json}"
SERVE_CONFIG="${SERVE_CONFIG:-${APP_ROOT}/serve.json}"
SECURITY_HEADERS_RENDERER="${SECURITY_HEADERS_RENDERER:-${APP_ROOT}/scripts/render-security-headers.js}"

if [ ! -f "$APP_CONFIG_HTML" ]; then
  printf 'docker-entrypoint: HTML shell not found at %s\n' "$APP_CONFIG_HTML" >&2
  exit 1
fi

if [ ! -f "$APP_CONFIG_RENDERER" ]; then
  printf 'docker-entrypoint: renderer not found at %s\n' "$APP_CONFIG_RENDERER" >&2
  exit 1
fi

if [ ! -f "$SERVE_CONFIG_BASELINE" ]; then
  printf 'docker-entrypoint: serve config baseline not found at %s\n' "$SERVE_CONFIG_BASELINE" >&2
  exit 1
fi

if [ ! -f "$SECURITY_HEADERS_RENDERER" ]; then
  printf 'docker-entrypoint: security-headers renderer not found at %s\n' "$SECURITY_HEADERS_RENDERER" >&2
  exit 1
fi

node "$APP_CONFIG_RENDERER" "$APP_CONFIG_HTML"
node "$SECURITY_HEADERS_RENDERER" "$SERVE_CONFIG_BASELINE" "$SERVE_CONFIG"

exec "$@"
