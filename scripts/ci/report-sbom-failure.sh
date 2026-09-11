#!/usr/bin/env sh
set -eu

: "${SBOM_RELEASE_TAG:?SBOM_RELEASE_TAG is required}"
SBOM_FAILURE_LABEL="${SBOM_FAILURE_LABEL:-sbom-missing}"
REPORT_DIR="${SBOM_FAILURE_REPORT_DIR:-reports/sbom}"
BODY_FILE="$REPORT_DIR/issue-body.md"
TITLE="Release $SBOM_RELEASE_TAG is missing its SBOM"
RUN_LINE=''
if [ -n "${SBOM_FAILURE_RUN_URL:-}" ]; then
  RUN_LINE="Failed run: $SBOM_FAILURE_RUN_URL"
fi

fail() {
  printf 'ERROR: %s\n' "$1" >&2
  exit 1
}

mkdir -p "$REPORT_DIR"
cat > "$BODY_FILE" <<BODY
Release \`$SBOM_RELEASE_TAG\` was published without its CycloneDX SBOMs: the \`sbom\` workflow
failed before the documents could be attached.

Retry by re-running the workflow against the tag:

\`\`\`bash
gh workflow run sbom.yml -f release_tag=$SBOM_RELEASE_TAG
\`\`\`

$RUN_LINE

<!-- release:$SBOM_RELEASE_TAG -->
BODY

gh label create "$SBOM_FAILURE_LABEL" \
  --description 'A published release has no CycloneDX SBOM attached' \
  --color D93F0B --force >/dev/null \
  || fail "could not ensure the $SBOM_FAILURE_LABEL label exists"

export TITLE
if ! NUMBER="$(gh issue list --label "$SBOM_FAILURE_LABEL" --state open --json number,title \
  --jq '.[] | select(.title == env.TITLE) | .number' | head -n1)"; then
  fail "could not list open $SBOM_FAILURE_LABEL issues"
fi

if [ -z "$NUMBER" ]; then
  gh issue create --label "$SBOM_FAILURE_LABEL" --title "$TITLE" --body-file "$BODY_FILE" \
    || fail "could not open the tracking issue for $SBOM_RELEASE_TAG"
  printf 'opened a %s tracking issue for %s\n' "$SBOM_FAILURE_LABEL" "$SBOM_RELEASE_TAG"
  exit 0
fi

gh issue comment "$NUMBER" \
  --body "The sbom workflow failed again for $SBOM_RELEASE_TAG; the release still has no SBOM attached. $RUN_LINE" \
  || fail "could not comment on issue #$NUMBER"
printf 'updated tracking issue #%s for %s\n' "$NUMBER" "$SBOM_RELEASE_TAG"
