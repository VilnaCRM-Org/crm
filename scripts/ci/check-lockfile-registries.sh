#!/usr/bin/env sh
# Zero-tolerance bun.lock resolution-provenance gate (issue #176).
#
# `bun install --frozen-lockfile` only verifies lockfile/manifest *consistency*; it
# says nothing about *provenance*. This gate fails the build if any package in the
# lockfile resolves from somewhere other than the npm registry allowlist, closing the
# "swap a resolution URL + matching integrity hash for an attacker tarball" hole that a
# multi-thousand-line lockfile diff hides from human review.
#
# Usage: check-lockfile-registries.sh [LOCKFILE]   (defaults to bun.lock in CWD)
set -eu

LOCK="${1:-bun.lock}"
[ -f "$LOCK" ] || {
  echo "FATAL: $LOCK missing"
  exit 2
}

# The greps below assume bun.lock v1's plain-text JSONC layout. A format bump forces a
# deliberate re-review of this gate instead of silently degrading it.
grep -qE '"lockfileVersion": 1,' "$LOCK" || {
  echo "FATAL: $LOCK lockfileVersion != 1 -- re-review this gate against the new format"
  exit 2
}

status=0

# (a) URL resolutions: allowlist anchored so lookalike hosts
#     (registry.npmjs.org.evil.com) fail.
ALLOWED='^https://registry\.npmjs\.org(/|$)'
rogue_urls=$(grep -oE 'https?://[^" ]+' "$LOCK" | grep -vE "$ALLOWED" || true)
if [ -n "$rogue_urls" ]; then
  echo "Disallowed resolution URLs in $LOCK:"
  echo "$rogue_urls"
  status=1
fi

# (b) Non-URL bypass: bun.lock records git/GitHub/file resolutions as
#     pkg@github:owner/repo#hash, git+ssh://..., file:..., link:...
rogue_specs=$(grep -oE '"[^"]+@(github|gitlab|bitbucket|git\+[a-z]+|file|link):[^"]*"' "$LOCK" || true)
if [ -n "$rogue_specs" ]; then
  echo "Disallowed non-registry resolution specifiers in $LOCK:"
  echo "$rogue_specs"
  status=1
fi

if [ "$status" -eq 0 ]; then
  echo "$LOCK: all resolutions on allowed registries"
fi

exit "$status"
