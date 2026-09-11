#!/usr/bin/env sh
set -eu

: "${TRIVY_RUN:?TRIVY_RUN is required (run through make report-dependency-audit)}"
: "${TRIVY_IMAGE:?TRIVY_IMAGE is required (run through make report-dependency-audit)}"
: "${TRIVY_ARGS:?TRIVY_ARGS is required (run through make report-dependency-audit)}"

DEPENDENCY_AUDIT_LABEL="${DEPENDENCY_AUDIT_LABEL:-dependency-audit}"
REPORT_DIR="${DEPENDENCY_AUDIT_REPORT_DIR:-reports/dependency-audit}"
JSON_FILE="$REPORT_DIR/trivy.json"
BODY_FILE="$REPORT_DIR/issue-body.md"
REPORT_SCRIPT="$(dirname "$0")/dependency-audit-report.mjs"

mkdir -p "$REPORT_DIR"

if ! sh -c "$TRIVY_RUN $TRIVY_IMAGE fs $TRIVY_ARGS --include-dev-deps --exit-code 0 --format json bun.lock" \
  > "$JSON_FILE"; then
  printf 'ERROR: the dependency scan failed; refusing to report a clean audit\n' >&2
  exit 1
fi

MARKER="$(node "$REPORT_SCRIPT" --input "$JSON_FILE" --body "$BODY_FILE" \
  --run-url "${DEPENDENCY_AUDIT_RUN_URL:-}")"

if [ "$MARKER" = 'clean' ]; then
  printf 'dependency audit clean; no tracking issue needed\n'
  exit 0
fi

if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then
  cat "$BODY_FILE" >> "$GITHUB_STEP_SUMMARY"
fi

TOTAL="$(sed -n 's/^Total: \([0-9]*\)$/\1/p' "$BODY_FILE" | head -n1)"

AUDIT_ISSUE_LABEL="$DEPENDENCY_AUDIT_LABEL" \
AUDIT_ISSUE_TITLE="Dependency audit: $TOTAL fixable HIGH/CRITICAL advisories in the full lockfile" \
AUDIT_ISSUE_BODY_FILE="$BODY_FILE" \
AUDIT_ISSUE_MARKER="$MARKER" \
AUDIT_ISSUE_COMMENT="The advisory set changed: $TOTAL fixable HIGH/CRITICAL findings across the full lockfile. See the updated body." \
AUDIT_ISSUE_LABEL_DESC='Fixable HIGH/CRITICAL advisories in the full dependency tree, dev tooling included' \
  sh "$(dirname "$0")/upsert-audit-issue.sh"
