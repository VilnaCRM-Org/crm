#!/usr/bin/env sh
# Push the release image under every given reference and record the manifest digest the
# registry now serves for them (issue #136), so the provenance attestation names the exact
# artifact that was pushed rather than a tag that can move. Every reference must resolve to
# the same digest; a push that reports none fails.
#
# Usage: push-release-image.sh <image:tag>...
# Inputs (env):
#   RELEASE_DIGEST_FILE   file receiving the digest     (default release/image-digest)
#   GITHUB_OUTPUT         receives digest=sha256:...    (optional)
set -eu

DIGEST_FILE="${RELEASE_DIGEST_FILE:-release/image-digest}"

fail() {
  printf '::error::push-release-image: %s\n' "$1" >&2
  exit 1
}

[ "$#" -gt 0 ] || fail 'no image reference given'

DIGEST=''
for ref in "$@"; do
  log="$(mktemp)"
  if ! docker push "$ref" > "$log" 2>&1; then
    cat "$log" >&2
    rm -f "$log"
    fail "docker push $ref failed"
  fi
  cat "$log"
  pushed="$(sed -n 's/^.*digest: \(sha256:[0-9a-f]\{64\}\) size: [0-9][0-9]*$/\1/p' "$log" | tail -n 1)"
  rm -f "$log"
  [ -n "$pushed" ] || fail "docker push $ref reported no sha256 manifest digest"
  if [ -n "$DIGEST" ] && [ "$pushed" != "$DIGEST" ]; then
    fail "$ref was pushed as $pushed, but an earlier reference was pushed as $DIGEST"
  fi
  DIGEST="$pushed"
done

mkdir -p "$(dirname "$DIGEST_FILE")"
printf '%s\n' "$DIGEST" > "$DIGEST_FILE"
if [ -n "${GITHUB_OUTPUT:-}" ]; then
  printf 'digest=%s\n' "$DIGEST" >> "$GITHUB_OUTPUT"
fi
printf 'push-release-image: pushed %s\n' "$DIGEST"
