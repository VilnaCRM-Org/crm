#!/usr/bin/env sh
# Lint every commit header in a range (issue #184). `git` lives on the host and commitlint
# lives in the dev container, so this reads each message here and pipes it into whichever
# Make target fits its author. The strict contract covers every human commit.
#
# Bot detection asks GitHub, never the commit object. The commit author email is contributor
# metadata: anyone can set user.email to a `[bot]` noreply address and claim the exemption,
# which also unlocks the bot config's `Compressed Images` ignore and skips commitlint for
# that commit outright. Only GitHub can sign a commit it creates, so the relaxed config is
# reachable only for a commit GitHub reports as BOTH signature-verified and authored by a
# `[bot]` account. With no token there is nothing to verify against, so every commit gets
# the strict contract: the exemption fails closed, never open. An empty range fails too --
# it would otherwise pass vacuously.
set -eu

usage() {
  printf 'Usage: %s <from-ref> <to-ref>\n' "$0" >&2
  exit 1
}

# Prints the bot login for a commit GitHub vouches for, and fails for everything else:
# unsigned commits, signatures GitHub cannot verify, human accounts, and any environment
# without the token needed to ask.
verified_bot_login() {
  if [ -z "${GH_TOKEN:-}" ] || [ -z "${COMMIT_PROVENANCE_REPO:-}" ]; then
    return 1
  fi

  login="$(gh api "repos/${COMMIT_PROVENANCE_REPO}/commits/$1" \
    --jq 'select(.commit.verification.verified == true) | .author.login // ""' 2>/dev/null)" || return 1

  case "$login" in
    *'[bot]') printf '%s' "$login" ;;
    *) return 1 ;;
  esac
}

[ "$#" -eq 2 ] || usage
[ -n "$1" ] && [ -n "$2" ] || usage

from="$1"
to="$2"
make_bin="${MAKE:-make}"
checked=0
failed=0

revisions="$(git rev-list "$from..$to")"

for revision in $revisions; do
  checked=$((checked + 1))
  target=lint-commit-message

  if bot_login="$(verified_bot_login "$revision")"; then
    target=lint-commit-bot-message
    printf 'lint-commit-range: %s is a GitHub-verified commit by %s — relaxing the task-number rule\n' \
      "$revision" "$bot_login"
  fi

  if ! git log -1 --format=%B "$revision" | "$make_bin" "$target"; then
    printf 'lint-commit-range: %s has a non-conventional commit header\n' "$revision" >&2
    failed=$((failed + 1))
  fi
done

if [ "$checked" -eq 0 ]; then
  printf 'lint-commit-range: %s..%s contains no commits — nothing was linted\n' "$from" "$to" >&2
  exit 1
fi

printf 'lint-commit-range: linted %s commit(s) in %s..%s\n' "$checked" "$from" "$to"

[ "$failed" -eq 0 ] || exit 1
