#!/usr/bin/env sh
set -eu

: "${GITLEAKS_IMAGE:?GITLEAKS_IMAGE is required (run through make scan-secrets)}"
GITLEAKS_CONFIG="${GITLEAKS_CONFIG:-.gitleaks.toml}"

PROBE_DIR="$PWD/.secret-scan-control"
trap 'rm -rf "$PROBE_DIR"' EXIT INT TERM
rm -rf "$PROBE_DIR"
mkdir -p "$PROBE_DIR"

SUFFIX='Q7Z3M2X4K6W5P3Y2'
printf 'aws_access_key_id = AKIA%s\n' "$SUFFIX" > "$PROBE_DIR/leak.txt"

set +e
docker run --rm \
  -v "$PROBE_DIR:/probe" \
  -v "$PWD/$GITLEAKS_CONFIG:/gitleaks.toml:ro" \
  "$GITLEAKS_IMAGE" dir --no-banner --exit-code 1 --config /gitleaks.toml \
  --report-format json --report-path /probe/report.json /probe > "$PROBE_DIR/stderr.txt" 2>&1
STATUS=$?
set -e

if [ "$STATUS" -ne 1 ]; then
  printf 'ERROR: the secret scanner exited %s on a seeded credential instead of reporting it\n' "$STATUS" >&2
  cat "$PROBE_DIR/stderr.txt" >&2
  exit 1
fi

if ! grep -q '"RuleID"[[:space:]]*:[[:space:]]*"aws-access-token"' "$PROBE_DIR/report.json" 2>/dev/null; then
  printf 'ERROR: the secret scanner objected but did not attribute it to the seeded aws-access-token\n' >&2
  cat "$PROBE_DIR/stderr.txt" >&2
  exit 1
fi

printf 'secret scan positive control: seeded credential detected\n'
