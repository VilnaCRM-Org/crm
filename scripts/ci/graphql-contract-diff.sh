#!/usr/bin/env sh
# Semantic GraphQL breaking-change gate on schema pin bumps (issues #178 phase 2, #136 E).
#
# The GraphQL twin of scripts/ci/contract-diff.sh. `make codegen-check` proves the pins agree
# and that src/api/generated/** was regenerated, but it cannot see what a schema bump *means*:
# a removed field, a narrowed argument, or a type change regenerates cleanly and merges green
# while this client's operations break against the real backend.
#
# This gate diffs the base and revision SDLs with a digest-pinned graphql-inspector and fails
# on breaking changes. Dangerous and safe changes are reported, never failed. It fast-exits 0
# when GRAPHQL_SCHEMA_VERSION is unchanged, so it runs on every pull request without a
# `paths:` filter -- a path-filtered required check stays pending forever on pull requests
# that do not touch the contract.
#
# Every input is overridable so the Bats suite can drive every path against fixtures:
#   CONTRACT_ENV_FILE                    tracked env file holding the pins (default .env.example)
#   CONTRACT_BASE_FILE                   the same file at the base ref (default CONTRACT_ENV_FILE,
#                                        falling back to .env at a base ref that predates #142)
#   CONTRACT_BASE_REF                    git ref to compare against (default origin/main)
#   CONTRACT_DIFF_DIR                    scratch dir for fetched SDLs (default reports/contract-diff)
#   CONTRACT_SPEC_MAX_BYTES              size cap for each fetched SDL (default 20 MiB)
#   GRAPHQL_CONTRACT_BREAKING_ALLOWLIST  approved breaking-change messages
#   GRAPHQL_INSPECTOR_IMAGE              digest-pinned graphql-inspector image
set -eu

CONTRACT_ENV_FILE="${CONTRACT_ENV_FILE:-.env.example}"
CONTRACT_BASE_REF="${CONTRACT_BASE_REF:-origin/main}"
CONTRACT_DIFF_DIR="${CONTRACT_DIFF_DIR:-reports/contract-diff}"
GRAPHQL_CONTRACT_BREAKING_ALLOWLIST="${GRAPHQL_CONTRACT_BREAKING_ALLOWLIST:-src/api/contracts/graphql-breaking-changes-approved.txt}"
# Digest-pinned like OASDIFF_IMAGE, so the gate's own tooling cannot drift under it. v3.4.0 is
# the newest published image whose CLI starts: the v4.0.0 and master images ship workspace
# links to dist/ folders with no package.json, and every command dies resolving its loaders.
GRAPHQL_INSPECTOR_IMAGE="${GRAPHQL_INSPECTOR_IMAGE:-kamilkisiela/graphql-inspector:v3.4.0@sha256:0d2d6c2a85d3ca963cecfc4ee51106ab7d6397286aabb927bb1db86d9aadfc34}"

PIN_KEY='GRAPHQL_SCHEMA_VERSION'
URL_KEY='GRAPHQL_SCHEMA_URL'

read_pin() {
  grep -E "^$1=" | head -n1 | cut -d= -f2-
}

fail() {
  printf 'ERROR: %s\n' "$1" >&2
  exit 1
}

# The SDLs are mounted into the inspector container, and an allowlist from outside the
# checkout would suppress findings without ever appearing in a pull request diff.
require_inside_checkout() {
  case "$2" in
    /*) fail "$1 must stay inside the checkout, got an absolute path: $2" ;;
    ../*|*/../*|*/..|..) fail "$1 must stay inside the checkout, got a parent-relative path: $2" ;;
    *) ;;
  esac
}

graphql_inspector() {
  docker run --rm -v "$PWD:/mnt" -w /mnt "$GRAPHQL_INSPECTOR_IMAGE" graphql-inspector "$@"
}

require_inside_checkout CONTRACT_DIFF_DIR "$CONTRACT_DIFF_DIR"
require_inside_checkout GRAPHQL_CONTRACT_BREAKING_ALLOWLIST "$GRAPHQL_CONTRACT_BREAKING_ALLOWLIST"

[ -f "$CONTRACT_ENV_FILE" ] || fail "$CONTRACT_ENV_FILE not found"

HEAD_PIN="$(read_pin "$PIN_KEY" < "$CONTRACT_ENV_FILE")"
[ -n "$HEAD_PIN" ] || fail "$PIN_KEY is not set in $CONTRACT_ENV_FILE"

# An unreadable base ref means the gate cannot know whether the pin moved, so it fails rather
# than skipping as a pass. A base ref that predates the .env untracking (issue #142) still
# tracks the pins in .env, which is the one fallback taken first.
CONTRACT_BASE_FILE="${CONTRACT_BASE_FILE:-$CONTRACT_ENV_FILE}"
if ! BASE_ENV="$(git show "$CONTRACT_BASE_REF:$CONTRACT_BASE_FILE" 2>/dev/null)"; then
  [ "$CONTRACT_BASE_FILE" = ".env.example" ] ||
    fail "cannot read $CONTRACT_BASE_FILE at $CONTRACT_BASE_REF (fetch the base branch first)"
  CONTRACT_BASE_FILE=".env"
  BASE_ENV="$(git show "$CONTRACT_BASE_REF:$CONTRACT_BASE_FILE" 2>/dev/null)" ||
    fail "cannot read .env.example or .env at $CONTRACT_BASE_REF (fetch the base branch first)"
fi

BASE_PIN="$(printf '%s\n' "$BASE_ENV" | read_pin "$PIN_KEY")"
[ -n "$BASE_PIN" ] || fail "$PIN_KEY is not set in $CONTRACT_BASE_FILE at $CONTRACT_BASE_REF"

if [ "$BASE_PIN" = "$HEAD_PIN" ]; then
  printf 'no %s bump (%s); nothing to diff\n' "$PIN_KEY" "$HEAD_PIN"
  exit 0
fi

# Each side is fetched with its own URL template, so a bump that also relocates the upstream
# SDL still compares the two real schemas.
BASE_URL_TEMPLATE="$(printf '%s\n' "$BASE_ENV" | read_pin "$URL_KEY")"
HEAD_URL_TEMPLATE="$(read_pin "$URL_KEY" < "$CONTRACT_ENV_FILE")"
[ -n "$BASE_URL_TEMPLATE" ] || fail "$URL_KEY is not set in $CONTRACT_BASE_FILE at $CONTRACT_BASE_REF"
[ -n "$HEAD_URL_TEMPLATE" ] || fail "$URL_KEY is not set in $CONTRACT_ENV_FILE"

# Without the placeholder both sides resolve to the same document: a permanent false green.
for template in "$BASE_URL_TEMPLATE" "$HEAD_URL_TEMPLATE"; do
  case "$template" in
    *"\${$PIN_KEY}"*) ;;
    *) fail "$URL_KEY must contain the \${$PIN_KEY} placeholder, got: $template" ;;
  esac
done

schema_url() {
  printf '%s\n' "$1" | sed "s|\${$PIN_KEY}|$2|g"
}

MAX_SPEC_BYTES="${CONTRACT_SPEC_MAX_BYTES:-20971520}"

mkdir -p "$CONTRACT_DIFF_DIR"
# The .graphql extension is what selects graphql-inspector's SDL file loader.
BASE_SDL="$CONTRACT_DIFF_DIR/base.graphql"
HEAD_SDL="$CONTRACT_DIFF_DIR/head.graphql"
DIFF_OUTPUT="$CONTRACT_DIFF_DIR/graphql-diff.txt"
LIVE_ALLOWLIST="$CONTRACT_DIFF_DIR/graphql-approved.txt"
BREAKING="$CONTRACT_DIFF_DIR/graphql-breaking.txt"
UNAPPROVED="$CONTRACT_DIFF_DIR/graphql-unapproved.txt"

printf 'diffing GraphQL %s -> %s\n' "$BASE_PIN" "$HEAD_PIN"

# Bounded in time and size like the OpenAPI fetches; --max-filesize only binds when the server
# declares a Content-Length, so the size assertion afterwards is what actually holds the line.
fetch_sdl() {
  curl -fsS --connect-timeout 10 --max-time 120 --max-filesize "$MAX_SPEC_BYTES" "$1" -o "$2"
}

sdl_within_cap() {
  [ "$(wc -c < "$1")" -le "$MAX_SPEC_BYTES" ]
}

fetch_sdl "$(schema_url "$BASE_URL_TEMPLATE" "$BASE_PIN")" "$BASE_SDL" \
  || fail "could not fetch the GraphQL schema pinned at $BASE_PIN"
fetch_sdl "$(schema_url "$HEAD_URL_TEMPLATE" "$HEAD_PIN")" "$HEAD_SDL" \
  || fail "could not fetch the GraphQL schema pinned at $HEAD_PIN"

[ -s "$BASE_SDL" ] || fail "the GraphQL schema fetched for $BASE_PIN is empty"
[ -s "$HEAD_SDL" ] || fail "the GraphQL schema fetched for $HEAD_PIN is empty"

sdl_within_cap "$BASE_SDL" \
  || fail "the GraphQL schema fetched for $BASE_PIN exceeds $MAX_SPEC_BYTES bytes"
sdl_within_cap "$HEAD_SDL" \
  || fail "the GraphQL schema fetched for $HEAD_PIN exceeds $MAX_SPEC_BYTES bytes"

[ -f "$GRAPHQL_CONTRACT_BREAKING_ALLOWLIST" ] \
  || fail "the approved-breaking-changes file $GRAPHQL_CONTRACT_BREAKING_ALLOWLIST is missing"

# An entry is one whole breaking-change message, matched exactly. Comment and blank lines are
# dropped first, so documentation in the file can never act as a suppression and a
# comment-only file approves nothing.
sed -e 's/[[:space:]]*$//' -e '/^[[:space:]]*#/d' -e '/^[[:space:]]*$/d' \
  "$GRAPHQL_CONTRACT_BREAKING_ALLOWLIST" > "$LIVE_ALLOWLIST"

status=0
graphql_inspector diff "$BASE_SDL" "$HEAD_SDL" > "$DIFF_OUTPUT" 2>&1 || status=$?

emit_report() {
  printf '## GraphQL contract changes: %s -> %s\n\n' "$BASE_PIN" "$HEAD_PIN"
  printf '```text\n'
  cat "$DIFF_OUTPUT"
  printf '```\n'
}

# Never redirect to /dev/stdout: reopening an already-redirected stdout with >> resets the
# offset and corrupts what the script already wrote.
if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then
  emit_report >> "$GITHUB_STEP_SUMMARY"
fi
emit_report

# graphql-inspector exits 1 both for breaking changes and for its own failures (an unparseable
# SDL, a loader crash). Only a run that printed its "Detected N breaking changes" verdict AND
# listed exactly N breaking lines is read as a diff; anything else is a tool failure.
sed -n 's/^.*✖[[:space:]]*//p' "$DIFF_OUTPUT" | sed 's/[[:space:]]*$//' > "$BREAKING"
breaking_count="$(wc -l < "$BREAKING" | tr -d '[:space:]')"

if [ "$status" -eq 0 ]; then
  [ "$breaking_count" -eq 0 ] \
    || fail "graphql-inspector exited 0 but listed $breaking_count breaking changes"
  printf 'no breaking changes between GraphQL %s and %s\n' "$BASE_PIN" "$HEAD_PIN"
  exit 0
fi

reported_count="$(sed -n 's/^.*Detected \([0-9][0-9]*\) breaking changes*.*$/\1/p' "$DIFF_OUTPUT" | head -n1)"
if [ "$status" -ne 1 ] || [ -z "$reported_count" ] || [ "$reported_count" -ne "$breaking_count" ] \
  || [ "$breaking_count" -eq 0 ]; then
  fail "graphql-inspector failed (exit $status) without a readable verdict; see the output above"
fi

# grep exits 1 when every breaking change is approved; only 2 and above is a real failure.
filter_status=0
grep -Fxv -f "$LIVE_ALLOWLIST" "$BREAKING" > "$UNAPPROVED" || filter_status=$?
[ "$filter_status" -le 1 ] || fail "could not apply $GRAPHQL_CONTRACT_BREAKING_ALLOWLIST"

if [ -s "$UNAPPROVED" ]; then
  printf 'ERROR: GraphQL %s -> %s introduces breaking changes for this client:\n' \
    "$BASE_PIN" "$HEAD_PIN" >&2
  sed 's/^/  /' "$UNAPPROVED" >&2
  printf 'Adapt the client, or record the exact message in %s with the reason it is safe here.\n' \
    "$GRAPHQL_CONTRACT_BREAKING_ALLOWLIST" >&2
  exit 1
fi

printf 'all %s breaking changes between GraphQL %s and %s are approved in %s\n' \
  "$breaking_count" "$BASE_PIN" "$HEAD_PIN" "$GRAPHQL_CONTRACT_BREAKING_ALLOWLIST"
