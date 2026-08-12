#!/usr/bin/env sh
# Semantic OpenAPI breaking-change gate on contract pin bumps (issue #177).
#
# scripts/check-contract-versions.sh and `make codegen-check` are *syntactic*: they assert the
# pins agree and that src/api/generated/** was regenerated. Neither can see the *meaning* of
# the delta between two upstream spec versions, so a pin bump that makes a request field
# required, narrows an enum, changes a branched-on status code, or removes an error response
# regenerates cleanly and merges green while breaking the client against the real backend.
#
# This gate diffs the base and revision specs semantically with oasdiff and fails on
# ERR-level breaking changes. It fast-exits 0 when the pin is unchanged, so it is safe to run
# on every pull request without a `paths:` filter -- a path-filtered required check would stay
# pending forever on pull requests that do not touch the contract.
#
# Every input is overridable so the Bats suite can drive all three paths against fixtures:
#   CONTRACT_ENV_FILE            env file holding the pins        (default .env)
#   CONTRACT_BASE_REF            git ref to compare against       (default origin/main)
#   CONTRACT_DIFF_DIR            scratch dir for fetched specs    (default reports/contract-diff)
#   CONTRACT_BREAKING_ALLOWLIST  oasdiff --err-ignore file
#   OASDIFF_IMAGE                digest-pinned oasdiff image
set -eu

CONTRACT_ENV_FILE="${CONTRACT_ENV_FILE:-.env}"
CONTRACT_BASE_REF="${CONTRACT_BASE_REF:-origin/main}"
CONTRACT_DIFF_DIR="${CONTRACT_DIFF_DIR:-reports/contract-diff}"
CONTRACT_BREAKING_ALLOWLIST="${CONTRACT_BREAKING_ALLOWLIST:-src/api/contracts/breaking-changes-approved.txt}"
# Digest-pinned like SHELLCHECK_IMAGE and ACTIONLINT_IMAGE in the Makefile, so the gate's own
# tooling cannot drift under it. Bump the tag and the digest together, never the tag alone.
OASDIFF_IMAGE="${OASDIFF_IMAGE:-tufin/oasdiff:v1.28.0@sha256:86830f988eaafcf589acb2794ee5ab78e3300ded071d6517bf085469300cbf36}"

PIN_KEY='OPENAPI_SPEC_VERSION'
URL_KEY='OPENAPI_SPEC_URL'

# Read KEY=value from an env file streamed on stdin. Same shape as read_env() in
# scripts/check-contract-versions.sh, but stream-based so one reader serves both the
# working-tree file and `git show <ref>:<file>` output.
read_pin() {
  grep -E "^$1=" | head -n1 | cut -d= -f2-
}

fail() {
  printf 'ERROR: %s\n' "$1" >&2
  exit 1
}

# oasdiff runs in a container whose only mount is the checkout, so every path handed to it
# must be repo-relative. An absolute override would fetch fine on the host and then fail to
# open inside the container, which is a confusing way to learn about the contract.
require_relative() {
  case "$2" in
    /*) fail "$1 must be a repo-relative path (the oasdiff container only mounts the checkout)" ;;
    *) ;;
  esac
}

oasdiff() {
  docker run --rm -v "$PWD:/mnt" -w /mnt "$OASDIFF_IMAGE" "$@"
}

require_relative CONTRACT_DIFF_DIR "$CONTRACT_DIFF_DIR"
require_relative CONTRACT_BREAKING_ALLOWLIST "$CONTRACT_BREAKING_ALLOWLIST"

[ -f "$CONTRACT_ENV_FILE" ] || fail "$CONTRACT_ENV_FILE not found"

HEAD_PIN="$(read_pin "$PIN_KEY" < "$CONTRACT_ENV_FILE")"
[ -n "$HEAD_PIN" ] || fail "$PIN_KEY is not set in $CONTRACT_ENV_FILE"

# A missing base ref means the gate cannot know whether the pin moved. Fail loudly rather
# than skipping as a pass, matching check-contract-versions.sh's unparseable-pin branch.
if ! BASE_ENV="$(git show "$CONTRACT_BASE_REF:$CONTRACT_ENV_FILE" 2>/dev/null)"; then
  fail "cannot read $CONTRACT_ENV_FILE at $CONTRACT_BASE_REF (fetch the base branch first)"
fi

BASE_PIN="$(printf '%s\n' "$BASE_ENV" | read_pin "$PIN_KEY")"
[ -n "$BASE_PIN" ] || fail "$PIN_KEY is not set in $CONTRACT_ENV_FILE at $CONTRACT_BASE_REF"

if [ "$BASE_PIN" = "$HEAD_PIN" ]; then
  printf 'no %s bump (%s); nothing to diff\n' "$PIN_KEY" "$HEAD_PIN"
  exit 0
fi

# The upstream URL template is read from the env file rather than hardcoded here, so the
# contract location keeps exactly one source of truth. ${OPENAPI_SPEC_VERSION} is the
# literal placeholder in that value. Each side is fetched with ITS OWN template, so a bump
# that also moves the upstream repository or spec path still compares like with like.
BASE_URL_TEMPLATE="$(printf '%s\n' "$BASE_ENV" | read_pin "$URL_KEY")"
HEAD_URL_TEMPLATE="$(read_pin "$URL_KEY" < "$CONTRACT_ENV_FILE")"
[ -n "$BASE_URL_TEMPLATE" ] || fail "$URL_KEY is not set in $CONTRACT_ENV_FILE at $CONTRACT_BASE_REF"
[ -n "$HEAD_URL_TEMPLATE" ] || fail "$URL_KEY is not set in $CONTRACT_ENV_FILE"

# Without the placeholder both sides would resolve to the same document and every bump would
# report "no breaking changes" — a false green the gate must never produce.
for template in "$BASE_URL_TEMPLATE" "$HEAD_URL_TEMPLATE"; do
  case "$template" in
    *"\${$PIN_KEY}"*) ;;
    *) fail "$URL_KEY must contain the \${$PIN_KEY} placeholder, got: $template" ;;
  esac
done

spec_url() {
  printf '%s\n' "$1" | sed "s|\${$PIN_KEY}|$2|g"
}

mkdir -p "$CONTRACT_DIFF_DIR"
BASE_SPEC="$CONTRACT_DIFF_DIR/base.yaml"
HEAD_SPEC="$CONTRACT_DIFF_DIR/head.yaml"

printf 'diffing OpenAPI %s -> %s\n' "$BASE_PIN" "$HEAD_PIN"

# -fsS: any fetch failure fails the job loudly. A spec that silently 404s into an empty file
# would leave oasdiff reporting "no breaking changes" about a contract it never read.
curl -fsS "$(spec_url "$BASE_URL_TEMPLATE" "$BASE_PIN")" -o "$BASE_SPEC" \
  || fail "could not fetch the OpenAPI spec pinned at $BASE_PIN"
curl -fsS "$(spec_url "$HEAD_URL_TEMPLATE" "$HEAD_PIN")" -o "$HEAD_SPEC" \
  || fail "could not fetch the OpenAPI spec pinned at $HEAD_PIN"

[ -s "$BASE_SPEC" ] || fail "the OpenAPI spec fetched for $BASE_PIN is empty"
[ -s "$HEAD_SPEC" ] || fail "the OpenAPI spec fetched for $HEAD_PIN is empty"

[ -f "$CONTRACT_BREAKING_ALLOWLIST" ] \
  || fail "the approved-breaking-changes file $CONTRACT_BREAKING_ALLOWLIST is missing"

# oasdiff's --err-ignore file has NO comment syntax: it treats every line as a rule and
# suppresses a finding whose flattened text is contained in that line. A prose line naming a
# real method, path and message is therefore a live suppression. Strip the '#' comments here
# so the human-readable allowlist can document its own format without silencing anything.
# sed always exits 0, so an allowlist with no live entries yields a harmless empty file.
ERR_IGNORE="$CONTRACT_DIFF_DIR/err-ignore.txt"
sed '/^[[:space:]]*#/d' "$CONTRACT_BREAKING_ALLOWLIST" > "$ERR_IGNORE"

# WARN-level findings stay out of the failure condition on purpose: they surface in the
# changelog below for reviewers, and holding the bar at ERR keeps the false-positive rate low
# enough that the gate never gets routed around.
status=0
oasdiff breaking "$BASE_SPEC" "$HEAD_SPEC" \
  --fail-on ERR --err-ignore "$ERR_IGNORE" || status=$?

emit_changelog() {
  printf '## OpenAPI contract changelog: %s -> %s\n\n' "$BASE_PIN" "$HEAD_PIN"
  printf '```text\n'
  oasdiff changelog "$BASE_SPEC" "$HEAD_SPEC" || printf 'changelog unavailable\n'
  printf '```\n'
}

# Never redirect to /dev/stdout: when the caller has already redirected stdout to a file,
# reopening it with >> resets the offset and corrupts the output the script already wrote.
if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then
  emit_changelog >> "$GITHUB_STEP_SUMMARY"
else
  emit_changelog
fi

if [ "$status" -ne 0 ]; then
  printf 'ERROR: %s -> %s introduces ERR-level breaking changes for this client.\n' \
    "$BASE_PIN" "$HEAD_PIN" >&2
  printf 'Adapt the client, or record the change in %s with the reason it is safe here.\n' \
    "$CONTRACT_BREAKING_ALLOWLIST" >&2
  exit "$status"
fi

printf 'no ERR-level breaking changes between OpenAPI %s and %s\n' "$BASE_PIN" "$HEAD_PIN"
