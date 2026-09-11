#!/usr/bin/env sh
set -eu

: "${SBOM_RELEASE_TAG:?SBOM_RELEASE_TAG is required}"
SBOM_FAILURE_LABEL="${SBOM_FAILURE_LABEL:-sbom-missing}"
REPORT_DIR="${SBOM_FAILURE_REPORT_DIR:-reports/sbom}"
BODY_FILE="$REPORT_DIR/issue-body.md"
MARKER="release:$SBOM_RELEASE_TAG"

mkdir -p "$REPORT_DIR"
{
  printf 'Release `%s` was published without its CycloneDX SBOMs: the `sbom` workflow failed\n' "$SBOM_RELEASE_TAG"
  printf 'before the documents could be attached.\n\n'
  printf 'Retry by re-running the workflow against the tag:\n\n'
  printf '```bash\ngh workflow run sbom.yml -f release_tag=%s\n```\n\n' "$SBOM_RELEASE_TAG"
  if [ -n "${SBOM_FAILURE_RUN_URL:-}" ]; then
    printf 'Failed run: %s\n\n' "$SBOM_FAILURE_RUN_URL"
  fi
  printf '<!-- %s -->\n' "$MARKER"
} > "$BODY_FILE"

AUDIT_ISSUE_LABEL="$SBOM_FAILURE_LABEL" \
AUDIT_ISSUE_TITLE="Release $SBOM_RELEASE_TAG is missing its SBOM" \
AUDIT_ISSUE_BODY_FILE="$BODY_FILE" \
AUDIT_ISSUE_MARKER="$MARKER" \
AUDIT_ISSUE_COMMENT="The sbom workflow failed again for $SBOM_RELEASE_TAG; the release still has no SBOM attached." \
AUDIT_ISSUE_LABEL_DESC='A published release has no CycloneDX SBOM attached' \
  sh "$(dirname "$0")/upsert-audit-issue.sh"
