#!/usr/bin/env sh
# Release tip guard (issue #185): the release job runs inside the main verification run of one
# commit, so it may only release while that commit is still the tip of the release branch. When
# main has moved on, releasing would either be refused as a non-fast-forward push or cut a
# release from a tree this run never verified; the newer push gets its own verification and
# release, so this run skips instead of failing. A GitHub API failure fails closed.
#
# Inputs (env):
#   GH_REPO          owner/name                              (required)
#   VERIFIED_SHA     the commit main verification checked    (required)
#   RELEASE_BRANCH   branch the release commit lands on      (default main)
#   GITHUB_OUTPUT    receives current=true|false             (optional)
set -eu

: "${GH_REPO:?GH_REPO is required}"
: "${VERIFIED_SHA:?VERIFIED_SHA is required}"
RELEASE_BRANCH="${RELEASE_BRANCH:-main}"
FULL_SHA='^[0-9a-f]{40}$'

fail() {
  printf '::error::release-tip: %s\n' "$1" >&2
  exit 1
}

decide() {
  if [ -n "${GITHUB_OUTPUT:-}" ]; then
    printf 'current=%s\n' "$1" >> "$GITHUB_OUTPUT"
  fi
}

printf '%s\n' "$VERIFIED_SHA" | grep -Eq "$FULL_SHA" \
  || fail "VERIFIED_SHA '$VERIFIED_SHA' is not a full commit SHA"

TIP="$(gh api "repos/$GH_REPO/git/ref/heads/$RELEASE_BRANCH" --jq '.object.sha')" \
  || fail "could not read the tip of $RELEASE_BRANCH in $GH_REPO"

printf '%s\n' "$TIP" | grep -Eq "$FULL_SHA" \
  || fail "the tip of $RELEASE_BRANCH resolved to '$TIP', not a full commit SHA"

if [ "$TIP" != "$VERIFIED_SHA" ]; then
  printf '::notice::release-tip: %s moved from the verified %s to %s; skipping this release, the newer push is verified and released by its own run\n' \
    "$RELEASE_BRANCH" "$VERIFIED_SHA" "$TIP"
  decide false
  exit 0
fi

printf 'release-tip: %s is still at the verified %s; releasing\n' "$RELEASE_BRANCH" "$VERIFIED_SHA"
decide true
