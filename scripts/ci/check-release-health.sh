#!/usr/bin/env sh
# Scheduled release-train health monitor (issues #138, #185): the release jobs of the newest main
# verification run must not have failed, and the newest v* tag must carry a GitHub release with
# its dist tarball and a matching GHCR image. The release is a reusable workflow called by main
# verification, so its jobs run inside that run as "<caller job> / <job>"; a run whose lint or
# unit job failed skips them, and that red main is main-is-red's to report. An offence files or
# updates one tracking issue and exits 1; a healthy train closes that issue. A run still in
# flight defers the check; a GitHub API failure exits 1 without filing anything.
#
# Inputs (env):
#   GH_REPO                       owner/name                        (required)
#   RELEASE_HEALTH_LABEL          label keying the tracking issue   (default release-broken)
#   RELEASE_WORKFLOW              workflow that runs the release    (default main-verification.yml)
#   RELEASE_JOB                   name of the calling release job   (default release)
#   RELEASE_ASSET_PREFIX          tarball name prefix               (default crm-dist-)
#   RELEASE_IMAGE_NAME            GHCR container package name       (default crm)
#   RELEASE_HEALTH_BODY_FILE      issue body path                   (default reports/release-health/issue-body.md)
#   RUN_URL                       link recorded in the issue        (optional)
set -eu

: "${GH_REPO:?GH_REPO is required}"
RELEASE_HEALTH_LABEL="${RELEASE_HEALTH_LABEL:-release-broken}"
RELEASE_WORKFLOW="${RELEASE_WORKFLOW:-main-verification.yml}"
RELEASE_JOB="${RELEASE_JOB:-release}"
RELEASE_ASSET_PREFIX="${RELEASE_ASSET_PREFIX:-crm-dist-}"
RELEASE_IMAGE_NAME="${RELEASE_IMAGE_NAME:-crm}"
BODY_FILE="${RELEASE_HEALTH_BODY_FILE:-reports/release-health/issue-body.md}"
ORG="${GH_REPO%%/*}"
SEMVER_TAG='^v(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$'

fail() {
  printf 'ERROR: release-health: %s\n' "$1" >&2
  exit 1
}

OFFENCES=''
offend() {
  OFFENCES="${OFFENCES}- $1
"
}

RUN_JSON="$(gh run list --workflow "$RELEASE_WORKFLOW" --branch main --event push --limit 1 \
  --json databaseId,status,url,headSha \
  --jq '.[0] | select(. != null) | "\(.databaseId) \(.status) \(.headSha) \(.url)"')" \
  || fail "could not list the runs of $RELEASE_WORKFLOW"

RUN_SHA=''
if [ -n "$RUN_JSON" ]; then
  RUN_ID="${RUN_JSON%% *}"
  rest="${RUN_JSON#* }"
  RUN_STATUS="${rest%% *}"
  rest="${rest#* }"
  RUN_SHA="${rest%% *}"
  RUN_URL_LATEST="${rest#* }"
  if [ "$RUN_STATUS" != 'completed' ]; then
    printf 'release-health: deferred, the newest %s run at %s is still %s: %s\n' \
      "$RELEASE_WORKFLOW" "$RUN_SHA" "$RUN_STATUS" "$RUN_URL_LATEST"
    exit 0
  fi
  JOBS="$(gh run view "$RUN_ID" --json jobs --jq '.jobs[] | "\(.conclusion)\t\(.name)"')" \
    || fail "could not list the jobs of $RELEASE_WORKFLOW run $RUN_ID"
  RELEASE_JOBS="$(printf '%s\n' "$JOBS" | awk -F'\t' -v job="$RELEASE_JOB" \
    '$2 == job || index($2, job " / ") == 1')"
  if [ -z "$RELEASE_JOBS" ]; then
    offend "the newest \`$RELEASE_WORKFLOW\` run on \`main\` at \`$RUN_SHA\` has no \`$RELEASE_JOB\` job: $RUN_URL_LATEST"
  fi
  FAILED_JOBS="$(printf '%s\n' "$RELEASE_JOBS" \
    | awk -F'\t' 'NF && $1 != "success" && $1 != "skipped" { printf "%s%s (%s)", sep, $2, $1; sep = ", " }')"
  if [ -n "$FAILED_JOBS" ]; then
    offend "the release in the newest \`$RELEASE_WORKFLOW\` run on \`main\` did not succeed at \`$RUN_SHA\`: $FAILED_JOBS: $RUN_URL_LATEST"
  fi
else
  printf 'release-health: no %s run on main yet\n' "$RELEASE_WORKFLOW"
fi

TAGS="$(gh api --paginate "repos/$GH_REPO/tags" --jq '.[].name')" \
  || fail "could not list the tags of $GH_REPO"

TAG="$(
  printf '%s\n' "$TAGS" \
    | grep -E "$SEMVER_TAG" \
    | awk -F'[v.]' '{
        key = sprintf("%05d%05d%05d", $2, $3, $4)
        if (key > max) { max = key; best = $0 }
      }
      END { if (best != "") print best }'
)"

if [ -z "$TAG" ]; then
  printf 'release-health: no v* release tag yet\n'
else
  VERSION="${TAG#v}"
  ASSET="${RELEASE_ASSET_PREFIX}${VERSION}.tar.gz"
  release_error="$(mktemp)"
  if ASSETS="$(gh api "repos/$GH_REPO/releases/tags/$TAG" --jq '.assets[].name' 2>"$release_error")"; then
    if ! printf '%s\n' "$ASSETS" | grep -qxF "$ASSET"; then
      offend "release \`$TAG\` does not carry \`$ASSET\`; the \`make release-tarball\` step did not attach it"
    fi
  elif grep -q 'HTTP 404' "$release_error"; then
    offend "tag \`$TAG\` has no GitHub release; the Create Release step never ran for it"
  else
    cat "$release_error" >&2
    rm -f "$release_error"
    fail "could not read the release for $TAG"
  fi
  rm -f "$release_error"

  image_error="$(mktemp)"
  if IMAGE_TAGS="$(gh api --paginate "orgs/$ORG/packages/container/$RELEASE_IMAGE_NAME/versions" \
    --jq '.[].metadata.container.tags[]' 2>"$image_error")"; then
    if ! printf '%s\n' "$IMAGE_TAGS" | grep -qxF "$VERSION"; then
      offend "GHCR package \`$RELEASE_IMAGE_NAME\` has no image tagged \`$VERSION\`; the \`make publish-image\` step did not push it"
    fi
  elif grep -q 'HTTP 404' "$image_error"; then
    offend "GHCR has no \`$RELEASE_IMAGE_NAME\` container package; no release image has ever been published"
  else
    cat "$image_error" >&2
    rm -f "$image_error"
    fail "could not list the versions of the $RELEASE_IMAGE_NAME container package"
  fi
  rm -f "$image_error"
fi

EXISTING="$(gh issue list --label "$RELEASE_HEALTH_LABEL" --state open --limit 1 --json number --jq '.[0].number // empty')" \
  || fail "could not list open $RELEASE_HEALTH_LABEL issues"

if [ -z "$OFFENCES" ]; then
  printf 'release-health: OK (tag %s, run %s)\n' "${TAG:-none}" "${RUN_SHA:-none}"
  if [ -n "$EXISTING" ]; then
    gh issue close "$EXISTING" --comment "The release train is healthy again${RUN_URL:+: $RUN_URL}." \
      || fail "could not close issue #$EXISTING"
    printf 'release-health: closed %s issue #%s\n' "$RELEASE_HEALTH_LABEL" "$EXISTING"
  fi
  exit 0
fi

MARKER="release-health: tag=${TAG:-none} run=${RUN_SHA:-none} offences=$(printf '%s' "$OFFENCES" | cksum | cut -d' ' -f1)"
mkdir -p "$(dirname "$BODY_FILE")"
{
  printf 'The release train is not producing consumable releases:\n\n'
  printf '%s\n' "$OFFENCES"
  printf 'Recovery steps: CONTRIBUTING.md, "Releases and the changelog".\n\n'
  [ -z "${RUN_URL:-}" ] || printf 'Monitor run: %s\n\n' "$RUN_URL"
  printf '<!-- %s -->\n' "$MARKER"
} > "$BODY_FILE"

AUDIT_ISSUE_LABEL="$RELEASE_HEALTH_LABEL" \
AUDIT_ISSUE_TITLE="Release train is broken: newest tag ${TAG:-none}, newest run ${RUN_SHA:-none}" \
AUDIT_ISSUE_BODY_FILE="$BODY_FILE" \
AUDIT_ISSUE_MARKER="$MARKER" \
AUDIT_ISSUE_COMMENT="The release-train offences changed; see the updated issue body." \
AUDIT_ISSUE_LABEL_DESC='The automated release pipeline is not producing consumable releases' \
AUDIT_ISSUE_LABEL_COLOR='B60205' \
  sh "$(dirname "$0")/upsert-audit-issue.sh"

printf '%s' "$OFFENCES" >&2
exit 1
