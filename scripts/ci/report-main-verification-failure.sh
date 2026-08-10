#!/usr/bin/env sh
# Open or update a single pinned issue when post-merge verification of `main` fails
# (issue #185). Consecutive red pushes update one issue instead of opening a new one.
set -eu

LABEL='main-is-red'
TITLE='main is red: post-merge verification failed'

: "${FAILED_SHA:?FAILED_SHA is required}"
: "${RUN_URL:?RUN_URL is required}"

gh label create "$LABEL" \
  --color 'B60205' \
  --description 'Post-merge verification of main failed' \
  --force >/dev/null

body="$(
  printf 'Post-merge verification failed on `%s`.\n\n' "$FAILED_SHA"
  printf 'Failing run: %s\n\n' "$RUN_URL"
  printf 'Fix `main` before merging further pull requests: their checks run against a\n'
  printf 'base that is already broken, so unrelated authors will see misattributed failures.\n'
)"

existing="$(gh issue list --label "$LABEL" --state open --limit 1 --json number --jq '.[0].number')"

if [ -n "$existing" ]; then
  gh issue comment "$existing" --body "$body"
  printf 'Updated existing main-is-red issue #%s\n' "$existing"
else
  gh issue create --title "$TITLE" --label "$LABEL" --body "$body"
fi
