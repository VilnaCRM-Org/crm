#!/usr/bin/env sh
# scripts/ci/check-security-headers.sh - boot the built production image and assert the
# browser security-header baseline on its responses (issue #113).
#
# Two container starts, both against the deployable `production` image the Makefile just built:
#   1. the committed baseline, exactly as serve.json ships it;
#   2. the same image with APP_CONFIG_* API overrides, which must surface in connect-src — the
#      positive control proving the entrypoint really extends the CSP at start-up.
# The container is always removed, whichever step fails.

set -eu

IMAGE="${SECURITY_HEADERS_PROBE_IMAGE:?SECURITY_HEADERS_PROBE_IMAGE is required}"
PORT="${SECURITY_HEADERS_PROBE_PORT:-3011}"
GATE="${SECURITY_HEADERS_GATE_SCRIPT:-scripts/ci/check-security-headers.mjs}"
API_ORIGIN="${SECURITY_HEADERS_PROBE_API_ORIGIN:-https://api.security-headers-probe.example}"
GRAPHQL_ORIGIN="${SECURITY_HEADERS_PROBE_GRAPHQL_ORIGIN:-https://graphql.security-headers-probe.example}"
READY_ATTEMPTS="${SECURITY_HEADERS_READY_ATTEMPTS:-30}"
CONTAINER="${SECURITY_HEADERS_PROBE_CONTAINER:-crm-security-headers-probe}"
BASE_URL="http://127.0.0.1:${PORT}"

cleanup() {
  docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
}

trap cleanup EXIT INT TERM

wait_until_ready() {
  attempt=1
  while [ "$attempt" -le "$READY_ATTEMPTS" ]; do
    if curl -fsS "${BASE_URL}/" >/dev/null 2>&1; then
      return 0
    fi
    attempt=$((attempt + 1))
    sleep 1
  done
  printf 'check-security-headers: %s did not answer on %s\n' "$CONTAINER" "$BASE_URL" >&2
  docker logs "$CONTAINER" >&2 || true
  return 1
}

start_probe() {
  cleanup
  docker run -d --name "$CONTAINER" -p "127.0.0.1:${PORT}:3001" "$@" "$IMAGE" >/dev/null
  wait_until_ready
}

printf '🔒 [1/2] committed baseline: every response of the production image\n'
start_probe
node "$GATE" --url "$BASE_URL"

printf '🔒 [2/2] runtime API overrides must extend connect-src at container start\n'
start_probe \
  -e "APP_CONFIG_API_BASE_URL=${API_ORIGIN}/api" \
  -e "APP_CONFIG_GRAPHQL_URL=${GRAPHQL_ORIGIN}/graphql"
node "$GATE" --url "$BASE_URL" --expect-connect "$API_ORIGIN" --expect-connect "$GRAPHQL_ORIGIN"
