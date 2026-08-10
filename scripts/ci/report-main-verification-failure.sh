#!/usr/bin/env sh
# Open, update, or close the single tracking issue for a red `main` (issue #185). Consecutive
# red pushes update one issue instead of opening a new one, and a green run closes it so the
# stop-the-line signal never outlives the breakage. Pass `--resolve` for the green path.
set -eu

LABEL='main-is-red'
TITLE='main is red: post-merge verification failed'

: "${RUN_URL:?RUN_URL is required}"

resolve=false
if [ "${1:-}" = '--resolve' ]; then
  resolve=true
fi

gh label create "$LABEL" \
  --color 'B60205' \
  --description 'Post-merge verification of main failed' \
  --force >/dev/null

existing="$(gh issue list --label "$LABEL" --state open --limit 1 --json number --jq '.[0].number // empty')"

if [ "$resolve" = true ]; then
  if [ -z "$existing" ]; then
    printf 'main-verification: main is green and no main-is-red issue is open\n'
    exit 0
  fi

  gh issue close "$existing" --comment "$(
    cat <<EOF
Post-merge verification is green again.

Passing run: $RUN_URL
EOF
  )"
  printf 'main-verification: closed main-is-red issue #%s\n' "$existing"
  exit 0
fi

: "${FAILED_SHA:?FAILED_SHA is required}"

body="$(
  cat <<EOF
Post-merge verification failed on \`$FAILED_SHA\`.

Failing run: $RUN_URL

Fix \`main\` before merging further pull requests: their checks run against a
base that is already broken, so unrelated authors will see misattributed failures.
EOF
)"

if [ -n "$existing" ]; then
  gh issue comment "$existing" --body "$body"
  printf 'main-verification: updated existing main-is-red issue #%s\n' "$existing"
else
  gh issue create --title "$TITLE" --label "$LABEL" --body "$body"
fi
