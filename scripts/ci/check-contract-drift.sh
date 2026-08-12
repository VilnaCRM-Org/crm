#!/usr/bin/env sh
# Scheduled upstream contract drift monitor (issue #178).
#
# Every existing contract gate answers "does the app match the pin?" -- codegen-check, the
# Mockoon-backed E2E suite, the k6 signup journey and the Apollo mock tests all validate
# against the same frozen upstream version. Nothing asks "does the pin still match reality?",
# and because no repository event fires when user-service publishes a release, the detection
# surface for "my dependency moved under me" is exactly zero. This monitor is that surface.
#
# Policy, deliberately asymmetric:
#   * a bare version gap NEVER fails the run -- red-run spam while intentionally behind
#     trains watchers to ignore the signal; the gap is routed to a tracking issue instead;
#   * an upstream lookup failure ALWAYS fails the run -- a dead monitor is worse than none.
#
# Inputs (all overridable so the Bats suite can drive every path against fixtures):
#   CONTRACT_ENV_FILE       env file holding the pins           (default .env)
#   CONTRACT_UPSTREAM_REPO  owner/name of the upstream repo     (default: read from the pins)
#   CONTRACT_DRIFT_LABEL    label keying the tracking issue     (default contract-drift)
set -eu

CONTRACT_ENV_FILE="${CONTRACT_ENV_FILE:-.env}"
CONTRACT_DRIFT_LABEL="${CONTRACT_DRIFT_LABEL:-contract-drift}"

OPENAPI_KEY='OPENAPI_SPEC_VERSION'
GRAPHQL_KEY='GRAPHQL_SCHEMA_VERSION'
SEMVER_TAG='^v[0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*$'

read_pin() {
  grep -E "^$1=" "$CONTRACT_ENV_FILE" | head -n1 | cut -d= -f2-
}

fail() {
  printf 'ERROR: %s\n' "$1" >&2
  exit 1
}

# Zero-padded sort key so version ordering never depends on `sort -V`, which busybox coreutils
# in the Alpine-based containers does not reliably provide.
semver_key() {
  printf '%s' "${1#v}" | awk -F. '{ printf "%05d%05d%05d", $1, $2, $3 }'
}

higher_version() {
  if [ -z "$1" ]; then
    printf '%s' "$2"
  elif [ -z "$2" ]; then
    printf '%s' "$1"
  elif [ "$(semver_key "$1")" -ge "$(semver_key "$2")" ]; then
    printf '%s' "$1"
  else
    printf '%s' "$2"
  fi
}

[ -f "$CONTRACT_ENV_FILE" ] || fail "$CONTRACT_ENV_FILE not found"

OPENAPI_PIN="$(read_pin "$OPENAPI_KEY")"
GRAPHQL_PIN="$(read_pin "$GRAPHQL_KEY")"
[ -n "$OPENAPI_PIN" ] || fail "$OPENAPI_KEY is not set in $CONTRACT_ENV_FILE"
[ -n "$GRAPHQL_PIN" ] || fail "$GRAPHQL_KEY is not set in $CONTRACT_ENV_FILE"

# The upstream repository is derived from the pinned spec URL so the contract source keeps a
# single source of truth, the same one scripts/ci/contract-diff.sh reads.
if [ -z "${CONTRACT_UPSTREAM_REPO:-}" ]; then
  CONTRACT_UPSTREAM_REPO="$(
    grep -E '^OPENAPI_SPEC_URL=' "$CONTRACT_ENV_FILE" \
      | head -n1 \
      | sed -n 's|.*raw\.githubusercontent\.com/\([^/]*/[^/]*\)/.*|\1|p'
  )"
fi
[ -n "$CONTRACT_UPSTREAM_REPO" ] || fail "could not resolve the upstream repository from $CONTRACT_ENV_FILE"

# `releases/latest` is the most recently *published* release, which is not necessarily the
# highest version -- a backport release on an old branch makes it point backwards. Take the
# maximum of it and the highest semver tag so the monitor cannot silently under-report.
#
# Each lookup's exit status is honoured separately. Folding a failed call into an empty result
# and only failing when *both* come back empty would let a rate-limited or broken tag lookup
# report "no drift" off a stale releases/latest -- the silent-monitor failure this gate exists
# to prevent. The one legitimate empty is a 404 on releases/latest, which just means upstream
# publishes tags without GitHub releases.
LOOKUP_ERR="$(mktemp)"
trap 'rm -f "$LOOKUP_ERR"' EXIT INT TERM

RELEASE_TAG=''
if ! RELEASE_TAG="$(gh api "repos/$CONTRACT_UPSTREAM_REPO/releases/latest" --jq '.tag_name' 2> "$LOOKUP_ERR")"; then
  if grep -q '404' "$LOOKUP_ERR"; then
    RELEASE_TAG=''
  else
    fail "the releases/latest lookup for $CONTRACT_UPSTREAM_REPO failed: $(cat "$LOOKUP_ERR")"
  fi
fi
case "$RELEASE_TAG" in
  v[0-9]*) ;;
  *) RELEASE_TAG='' ;;
esac

if ! TAGS="$(gh api "repos/$CONTRACT_UPSTREAM_REPO/tags?per_page=100" --paginate --jq '.[].name' 2> "$LOOKUP_ERR")"; then
  fail "the tag lookup for $CONTRACT_UPSTREAM_REPO failed; refusing to report drift from releases/latest alone: $(cat "$LOOKUP_ERR")"
fi

# Selected with awk rather than a shell loop so an upstream tag containing a glob character
# cannot expand against the working tree, and so ordering never depends on `sort -V`.
HIGHEST_TAG="$(
  printf '%s\n' "$TAGS" \
    | grep -E "$SEMVER_TAG" \
    | awk -F'[v.]' '{
        key = sprintf("%05d%05d%05d", $2, $3, $4)
        if (key > max) { max = key; best = $0 }
      }
      END { if (best != "") print best }'
)"

LATEST="$(higher_version "$RELEASE_TAG" "$HIGHEST_TAG")"
[ -n "$LATEST" ] || fail "cannot resolve the latest upstream version of $CONTRACT_UPSTREAM_REPO"

printf 'pins: OpenAPI=%s GraphQL=%s; upstream %s latest=%s\n' \
  "$OPENAPI_PIN" "$GRAPHQL_PIN" "$CONTRACT_UPSTREAM_REPO" "$LATEST"

if [ "$OPENAPI_PIN" = "$LATEST" ] && [ "$GRAPHQL_PIN" = "$LATEST" ]; then
  printf 'contract pins are current; no drift\n'
  exit 0
fi

# A pin ahead of everything upstream can resolve is a broken lookup or a typo, not drift.
# Both pins are checked: check-contract-versions.sh keeps them equal, but a monitor that
# trusted that invariant would report a misleading gap the moment it was broken.
ahead_of_upstream() {
  if [ "$(higher_version "$2" "$LATEST")" = "$2" ] && [ "$2" != "$LATEST" ]; then
    fail "pinned $1=$2 is ahead of the resolved upstream latest $LATEST"
  fi
}
ahead_of_upstream "$OPENAPI_KEY" "$OPENAPI_PIN"
ahead_of_upstream "$GRAPHQL_KEY" "$GRAPHQL_PIN"

MARKER="last-seen: $LATEST"
BODY_FILE="${CONTRACT_DRIFT_BODY_FILE:-reports/contract-drift/issue-body.md}"
mkdir -p "$(dirname "$BODY_FILE")"
{
  printf 'Pinned OpenAPI: %s\n\n' "$OPENAPI_PIN"
  printf 'Pinned GraphQL: %s\n\n' "$GRAPHQL_PIN"
  printf 'Upstream latest (%s): %s\n\n' "$CONTRACT_UPSTREAM_REPO" "$LATEST"
  printf 'Bumping the pins in %s runs the semantic breaking-change gate in\n' "$CONTRACT_ENV_FILE"
  printf 'scripts/ci/contract-diff.sh, which classifies the delta before it can merge.\n\n'
  printf '<!-- %s -->\n' "$MARKER"
} > "$BODY_FILE"

# Routing, comment-only-on-change, and the one-open-issue invariant are shared with the
# nightly flake audit (#186) so both scheduled monitors behave identically.
AUDIT_ISSUE_LABEL="$CONTRACT_DRIFT_LABEL" \
AUDIT_ISSUE_TITLE="user-service contract drift: $OPENAPI_PIN -> $LATEST" \
AUDIT_ISSUE_BODY_FILE="$BODY_FILE" \
AUDIT_ISSUE_MARKER="$MARKER" \
AUDIT_ISSUE_COMMENT="Upstream moved: latest is now $LATEST (pins: OpenAPI $OPENAPI_PIN, GraphQL $GRAPHQL_PIN)." \
AUDIT_ISSUE_LABEL_DESC='Pinned upstream contract version is behind the latest release' \
  sh "$(dirname "$0")/upsert-audit-issue.sh"
