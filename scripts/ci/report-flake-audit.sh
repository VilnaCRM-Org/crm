#!/usr/bin/env sh
# Route the nightly flake-audit result to its tracking issue (issue #186).
#
# A scheduled red run nobody is assigned to is a dead signal, so the audit always files or
# updates one "flaky tests detected" issue naming the offending specs. It stays quiet when
# every suite came back clean, and it treats a missing summary as an offence rather than a
# pass: a suite that crashed before producing a report has not been verified.
#
# Inputs (env):
#   FLAKE_SUMMARY_FILES   space-separated summaries written by scripts/ci/check-flakes.ts
#   FLAKE_AUDIT_LABEL     label keying the tracking issue     (default flaky-tests)
#   FLAKE_AUDIT_RUN_URL   workflow run URL quoted in the body
set -eu

FLAKE_SUMMARY_FILES="${FLAKE_SUMMARY_FILES:-reports/playwright/e2e-flakes.md reports/playwright/visual-flakes.md}"
FLAKE_AUDIT_LABEL="${FLAKE_AUDIT_LABEL:-flaky-tests}"
FLAKE_AUDIT_BODY_FILE="${FLAKE_AUDIT_BODY_FILE:-reports/playwright/audit-issue-body.md}"

mkdir -p "$(dirname "$FLAKE_AUDIT_BODY_FILE")"

offenders=''
missing=''
# The marker is derived from WHICH specs offended, not from which summary files had offenders:
# hashing the file names would leave the tracking issue frozen on the first night's spec list
# while the real offenders changed underneath it.
state=''
: > "$FLAKE_AUDIT_BODY_FILE"

for summary in $FLAKE_SUMMARY_FILES; do
  if [ ! -f "$summary" ]; then
    missing="$missing $summary"
    state="$(printf '%smissing=%s\n' "$state" "$summary")"
    printf '### %s\n\nNo summary produced -- the suite did not finish.\n\n' "$summary" \
      >> "$FLAKE_AUDIT_BODY_FILE"
    continue
  fi
  cat "$summary" >> "$FLAKE_AUDIT_BODY_FILE"
  printf '\n' >> "$FLAKE_AUDIT_BODY_FILE"
  found="$(sed -n 's|^<!-- offenders: \(.*\) -->$|\1|p' "$summary" | head -n1)"
  if [ -n "$found" ] && [ "$found" != 'none' ]; then
    offenders="$offenders $summary"
    state="$(printf '%soffenders=%s=%s\n' "$state" "$summary" "$found")"
  fi
done

if [ -z "$offenders" ] && [ -z "$missing" ]; then
  printf 'flake audit clean; no tracking issue needed\n'
  exit 0
fi

# Newline-framed and label-prefixed so a missing-summary set can never hash equal to an
# offender set, and so spec ids (which contain spaces) cannot regroup into the same digest.
MARKER="audit-state:$(printf '%s' "$state" | cksum | cut -d' ' -f1)"
{
  printf 'Detected by the scheduled flake audit.\n\n'
  [ -z "$missing" ] || printf 'Suites without a summary:%s\n\n' "$missing"
  [ -z "${FLAKE_AUDIT_RUN_URL:-}" ] || printf 'Run: %s\n\n' "$FLAKE_AUDIT_RUN_URL"
  printf 'Fix the nondeterminism at its source. Raising FLAKE_BUDGET, retrying until green,\n'
  printf 'and re-baselining a visual snapshot to force a pass are all out of policy.\n\n'
  printf '<!-- %s -->\n' "$MARKER"
} >> "$FLAKE_AUDIT_BODY_FILE"

AUDIT_ISSUE_LABEL="$FLAKE_AUDIT_LABEL" \
AUDIT_ISSUE_TITLE='Flaky tests detected by the scheduled Playwright audit' \
AUDIT_ISSUE_BODY_FILE="$FLAKE_AUDIT_BODY_FILE" \
AUDIT_ISSUE_MARKER="$MARKER" \
AUDIT_ISSUE_COMMENT="The flake audit found a different set of offending specs.${FLAKE_AUDIT_RUN_URL:+ Run: $FLAKE_AUDIT_RUN_URL}" \
AUDIT_ISSUE_LABEL_DESC='Playwright specs that failed and passed on retry in the scheduled audit' \
  sh "$(dirname "$0")/upsert-audit-issue.sh"
