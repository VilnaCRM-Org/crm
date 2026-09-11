#!/usr/bin/env sh
set -eu

: "${SBOM_RELEASE_TAG:?SBOM_RELEASE_TAG is required}"
SBOM_FAILURE_LABEL="${SBOM_FAILURE_LABEL:-sbom-missing}"
REPORT_DIR="${SBOM_FAILURE_REPORT_DIR:-reports/sbom}"
BODY_FILE="$REPORT_DIR/issue-body.md"
MARKER="release:$SBOM_RELEASE_TAG"
RUN_LINE=''
if [ -n "${SBOM_FAILURE_RUN_URL:-}" ]; then
  RUN_LINE="Failed run: $SBOM_FAILURE_RUN_URL"
fi

mkdir -p "$REPORT_DIR"
cat > "$BODY_FILE" <<EOF
Release \`$SBOM_RELEASE_TAG\` was published without its CycloneDX SBOMs: the \`sbom\` workflow
failed before the documents could be attached.

Retry by re-running the workflow against the tag:

\`\`\`bash
gh workflow run sbom.yml -f release_tag=$SBOM_RELEASE_TAG
\`\`\`

$RUN_LINE

<!-- $MARKER -->
EOF

AUDIT_ISSUE_LABEL="$SBOM_FAILURE_LABEL" \
AUDIT_ISSUE_TITLE="Release $SBOM_RELEASE_TAG is missing its SBOM" \
AUDIT_ISSUE_BODY_FILE="$BODY_FILE" \
AUDIT_ISSUE_MARKER="$MARKER" \
AUDIT_ISSUE_COMMENT="The sbom workflow failed again for $SBOM_RELEASE_TAG; the release still has no SBOM attached." \
AUDIT_ISSUE_LABEL_DESC='A published release has no CycloneDX SBOM attached' \
  sh "$(dirname "$0")/upsert-audit-issue.sh"
