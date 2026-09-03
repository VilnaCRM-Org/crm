#!/usr/bin/env sh
# Upsert the single tracking issue for a scheduled audit (issues #178, #186).
#
# A scheduled check that goes red with no human routing is a dead signal, and a weekly
# "still broken" comment on an issue nobody closed is noise that buries the real one. This
# helper gives both scheduled monitors the same behaviour: exactly one open issue per label,
# a comment only when the situation actually changed, and a marker recorded in the issue body
# so "changed" survives across runs without any external state.
#
# Inputs (env):
#   AUDIT_ISSUE_LABEL        label that keys the tracking issue          (required)
#   AUDIT_ISSUE_TITLE        issue title                                 (required)
#   AUDIT_ISSUE_BODY_FILE    file holding the issue body                 (required)
#   AUDIT_ISSUE_MARKER       text that must appear in the body; a body    (required)
#                            already containing it means "nothing new"
#   AUDIT_ISSUE_COMMENT      comment posted when the marker changed       (required)
#   AUDIT_ISSUE_LABEL_DESC   label description when it must be created
#   AUDIT_ISSUE_LABEL_COLOR  label colour when it must be created         (default D93F0B)
set -eu

fail() {
  printf 'ERROR: %s\n' "$1" >&2
  exit 1
}

require() {
  eval "value=\${$1:-}"
  [ -n "$value" ] || fail "$1 is required"
}

require AUDIT_ISSUE_LABEL
require AUDIT_ISSUE_TITLE
require AUDIT_ISSUE_BODY_FILE
require AUDIT_ISSUE_MARKER
require AUDIT_ISSUE_COMMENT

[ -f "$AUDIT_ISSUE_BODY_FILE" ] || fail "$AUDIT_ISSUE_BODY_FILE not found"
grep -qF "$AUDIT_ISSUE_MARKER" "$AUDIT_ISSUE_BODY_FILE" \
  || fail 'the issue body must embed AUDIT_ISSUE_MARKER, or the next run cannot detect a change'

# gh refuses to create an issue with an unknown label, so guarantee the label first.
gh label create "$AUDIT_ISSUE_LABEL" \
  --description "${AUDIT_ISSUE_LABEL_DESC:-Automated audit tracking}" \
  --color "${AUDIT_ISSUE_LABEL_COLOR:-D93F0B}" --force >/dev/null \
  || fail "could not ensure the $AUDIT_ISSUE_LABEL label exists"

OPEN_ISSUES=''
if ! OPEN_ISSUES="$(gh issue list --label "$AUDIT_ISSUE_LABEL" --state open --json number --jq '.[].number')"; then
  fail "could not list open $AUDIT_ISSUE_LABEL issues"
fi

# One open issue per label is the invariant the whole comment-only-on-change scheme rests on.
# With duplicates, updates would land on an arbitrary one while the others rot in the backlog.
COUNT="$(printf '%s' "$OPEN_ISSUES" | grep -c '[0-9]' || true)"
if [ "$COUNT" -gt 1 ]; then
  fail "found $COUNT open $AUDIT_ISSUE_LABEL issues; close all but one so the monitor has a single tracker"
fi

NUMBER="$(printf '%s' "$OPEN_ISSUES" | head -n1)"

if [ -z "$NUMBER" ]; then
  gh issue create --label "$AUDIT_ISSUE_LABEL" --title "$AUDIT_ISSUE_TITLE" \
    --body-file "$AUDIT_ISSUE_BODY_FILE" \
    || fail "could not open the $AUDIT_ISSUE_LABEL tracking issue"
  printf 'opened a %s tracking issue\n' "$AUDIT_ISSUE_LABEL"
  exit 0
fi

EXISTING_BODY=''
if ! EXISTING_BODY="$(gh issue view "$NUMBER" --json body --jq '.body')"; then
  fail "could not read the body of issue #$NUMBER"
fi

if printf '%s' "$EXISTING_BODY" | grep -qF "$AUDIT_ISSUE_MARKER"; then
  printf 'issue #%s already records this state; staying quiet\n' "$NUMBER"
  exit 0
fi

# The body carries the marker, so it is persisted first: if the comment then fails, the retry
# sees the new marker and stays quiet instead of re-notifying for the same state.
gh issue edit "$NUMBER" --title "$AUDIT_ISSUE_TITLE" --body-file "$AUDIT_ISSUE_BODY_FILE" \
  || fail "could not update issue #$NUMBER"
gh issue comment "$NUMBER" --body "$AUDIT_ISSUE_COMMENT" \
  || fail "could not comment on issue #$NUMBER"
printf 'updated issue #%s\n' "$NUMBER"
