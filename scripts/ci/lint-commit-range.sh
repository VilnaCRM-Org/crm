#!/usr/bin/env sh
# Lint every commit header in a range (issue #184). `git` lives on the host and commitlint
# lives in the dev container, so this reads each message here and pipes it into whichever
# Make target fits its author. The strict contract covers every human commit; only a commit
# whose GitHub author identity is a bot gets the relaxed config, so the exemption cannot be
# spoofed from the message body. An empty range fails: it would otherwise pass vacuously.
set -eu

BOT_AUTHOR_PATTERN='^[0-9]+\+[A-Za-z0-9-]+\[bot\]@users\.noreply\.github\.com$'

usage() {
  printf 'Usage: %s <from-ref> <to-ref>\n' "$0" >&2
  exit 1
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
  author="$(git log -1 --format=%ae "$revision")"
  target=lint-commit-message

  if printf '%s' "$author" | grep -Eq "$BOT_AUTHOR_PATTERN"; then
    target=lint-commit-bot-message
    printf 'lint-commit-range: %s is authored by %s — relaxing the task-number rule\n' \
      "$revision" "$author"
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
