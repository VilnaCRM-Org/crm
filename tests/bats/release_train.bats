#!/usr/bin/env bats

# Coverage for the release train (issues #138, #185, #136): the version preflight
# (scripts/ci/check-release-version.sh), the scheduled health monitor
# (scripts/ci/check-release-health.sh), the verified-tip guard
# (scripts/ci/check-release-tip.sh), the digest-recording image push
# (scripts/ci/push-release-image.sh), the shape of autorelease.yml and of the
# main verification job that calls it, and the make targets that wire them
# (check-release-version, check-release-health, release-tarball, publish-image).

load './test_helper.bash'

VERSION_SCRIPT='scripts/ci/check-release-version.sh'
HEALTH_SCRIPT='scripts/ci/check-release-health.sh'
TIP_SCRIPT='scripts/ci/check-release-tip.sh'
PUSH_SCRIPT='scripts/ci/push-release-image.sh'
VERIFIED_SHA='0123456789abcdef0123456789abcdef01234567'
MOVED_SHA='fedcba9876543210fedcba9876543210fedcba98'

WORKFLOW() {
  printf '%s' "$PROJECT_ROOT/.github/workflows/autorelease.yml"
}

CALLER() {
  printf '%s' "$PROJECT_ROOT/.github/workflows/main-verification.yml"
}

workflow_code() {
  grep -n '' "$(WORKFLOW)" | grep -vE '^[0-9]+:[[:space:]]*#'
}

caller_job_code() {
  grep -n '' "$(CALLER)" | grep -vE '^[0-9]+:[[:space:]]*#' | awk -v job="$1" '
    $0 ~ ("^[0-9]+:  " job ":$") { inside = 1; print; next }
    inside && /^[0-9]+:  [a-z-]+:$/ { exit }
    inside { print }
  '
}

workflow_job_code() {
  workflow_code | awk -v job="$1" '
    $0 ~ ("^[0-9]+:  " job ":$") { inside = 1; print; next }
    inside && /^[0-9]+:  [a-z-]+:$/ { exit }
    inside { print }
  '
}

code_line() {
  workflow_code | grep -E -- "$1" | head -n 1 | cut -d: -f1
}

step_code() {
  workflow_code | awk -v name="$1" '
    $0 ~ ("^[0-9]+: +- name: " name "$") { inside = 1; print; next }
    inside && /^[0-9]+: +- name: / { exit }
    inside { print }
  '
}

create_release_git_stub() {
  cat > "$STUB_BIN_DIR/git" <<'EOF'
#!/usr/bin/env bash
printf 'git %s\n' "$*" >> "${COMMAND_LOG:?}"

if [ "${FAKE_GIT_TAG_LIST_FAILS:-0}" = "1" ]; then
  echo 'fatal: not a git repository' >&2
  exit 128
fi

if [ "$1" = "-C" ] && [ "$3" = "tag" ] && [ "$4" = "--list" ]; then
  [ -z "${FAKE_GIT_TAGS:-}" ] || printf '%s\n' "$FAKE_GIT_TAGS"
  exit 0
fi

echo "unexpected git invocation: $*" >&2
exit 1
EOF
  chmod +x "$STUB_BIN_DIR/git"
}

create_release_gh_stub() {
  cat > "$STUB_BIN_DIR/gh" <<'EOF'
#!/usr/bin/env bash
printf 'gh %s\n' "$*" >> "${COMMAND_LOG:?}"

if [ "$1" = "run" ] && [ "$2" = "list" ]; then
  if [ -n "${FAKE_GH_RUN_FAIL:-}" ]; then
    printf '%s\n' "$FAKE_GH_RUN_FAIL" >&2
    exit 1
  fi
  [ -z "${FAKE_GH_RUN:-}" ] || printf '%s\n' "$FAKE_GH_RUN"
  exit 0
fi

if [ "$1" = "run" ] && [ "$2" = "view" ]; then
  if [ -n "${FAKE_GH_JOBS_FAIL:-}" ]; then
    printf '%s\n' "$FAKE_GH_JOBS_FAIL" >&2
    exit 1
  fi
  [ -z "${FAKE_GH_JOBS:-}" ] || printf '%b\n' "$FAKE_GH_JOBS"
  exit 0
fi

if [ "$1" = "api" ]; then
  case "$*" in
    *git/ref/heads/*)
      if [ -n "${FAKE_GH_TIP_FAIL:-}" ]; then
        printf '%s\n' "$FAKE_GH_TIP_FAIL" >&2
        exit 1
      fi
      printf '%s\n' "${FAKE_GH_TIP:-}"
      exit 0
      ;;
    *releases/tags/*)
      if [ -n "${FAKE_GH_RELEASE_ERROR:-}" ]; then
        printf '%s\n' "$FAKE_GH_RELEASE_ERROR" >&2
        exit 1
      fi
      [ -z "${FAKE_GH_RELEASE_ASSETS:-}" ] || printf '%s\n' "$FAKE_GH_RELEASE_ASSETS"
      exit 0
      ;;
    *repos/*/tags*)
      if [ -n "${FAKE_GH_TAGS_FAIL:-}" ]; then
        printf '%s\n' "$FAKE_GH_TAGS_FAIL" >&2
        exit 1
      fi
      [ -z "${FAKE_GH_TAGS:-}" ] || printf '%s\n' "$FAKE_GH_TAGS"
      exit 0
      ;;
    *packages/container/*)
      if [ -n "${FAKE_GH_IMAGE_ERROR:-}" ]; then
        printf '%s\n' "$FAKE_GH_IMAGE_ERROR" >&2
        exit 1
      fi
      [ -z "${FAKE_GH_IMAGE_TAGS:-}" ] || printf '%s\n' "$FAKE_GH_IMAGE_TAGS"
      exit 0
      ;;
  esac
  exit 0
fi

if [ "$1" = "issue" ] && [ "$2" = "list" ]; then
  [ -z "${FAKE_GH_ISSUE_NUMBER:-}" ] || printf '%s\n' "$FAKE_GH_ISSUE_NUMBER"
  exit 0
fi

if [ "$1" = "issue" ] && [ "$2" = "view" ]; then
  printf '%s\n' "${FAKE_GH_ISSUE_BODY:-}"
  exit 0
fi

exit 0
EOF
  chmod +x "$STUB_BIN_DIR/gh"
}

create_release_docker_stub() {
  cat > "$STUB_BIN_DIR/docker" <<'EOF'
#!/usr/bin/env bash
printf 'docker %s\n' "$*" >> "${COMMAND_LOG:?}"

if [ "$1" = "push" ]; then
  if [ "${FAKE_DOCKER_PUSH_FAILS:-}" = "$2" ]; then
    echo 'denied: permission_denied: write_package' >&2
    exit 1
  fi
  digest="${FAKE_DOCKER_PUSH_DIGEST:-}"
  if [ -n "${FAKE_DOCKER_SECOND_DIGEST:-}" ] && grep -q '^docker push' "${COMMAND_LOG:?}" \
    && [ "$(grep -c '^docker push' "$COMMAND_LOG")" -gt 1 ]; then
    digest="$FAKE_DOCKER_SECOND_DIGEST"
  fi
  printf 'The push refers to repository [%s]\n' "${2%:*}"
  printf '5f70bf18a086: Pushed\n'
  [ -z "$digest" ] || printf '%s: digest: %s size: 1573\n' "${2##*:}" "$digest"
  exit 0
fi

echo "unexpected docker invocation: $*" >&2
exit 1
EOF
  chmod +x "$STUB_BIN_DIR/docker"
}

setup() {
  setup_stub_dir
  create_release_git_stub
  create_release_gh_stub

  SANDBOX="$BATS_TEST_TMPDIR/sandbox"
  mkdir -p "$SANDBOX/scripts/ci"
  cp "$PROJECT_ROOT/$VERSION_SCRIPT" "$SANDBOX/scripts/ci/"
  cp "$PROJECT_ROOT/$HEALTH_SCRIPT" "$SANDBOX/scripts/ci/"
  cp "$PROJECT_ROOT/$TIP_SCRIPT" "$SANDBOX/scripts/ci/"
  cp "$PROJECT_ROOT/$PUSH_SCRIPT" "$SANDBOX/scripts/ci/"
  cp "$PROJECT_ROOT/scripts/ci/upsert-audit-issue.sh" "$SANDBOX/scripts/ci/"

  export FAKE_GIT_TAGS=''
  export FAKE_GIT_TAG_LIST_FAILS=0
  export FAKE_GH_RUN='4242 completed 0123456789ab https://github.com/o/r/actions/runs/1'
  export FAKE_GH_JOBS='success\tverify lint and contracts\nsuccess\tverify unit tests\nsuccess\trelease / verify main tip\nsuccess\trelease / build\nskipped\treport a red main'
  export FAKE_GH_TIP="$VERIFIED_SHA"
  export FAKE_GH_TAGS='v0.3.0'
  export FAKE_GH_RELEASE_ASSETS='crm-dist-0.3.0.tar.gz'
  export FAKE_GH_IMAGE_TAGS="0.3.0
sha-0123456789ab"
  export FAKE_GH_ISSUE_NUMBER=''
  export FAKE_GH_ISSUE_BODY=''
  export FAKE_GH_RUN_FAIL='' FAKE_GH_TAGS_FAIL='' FAKE_GH_RELEASE_ERROR='' FAKE_GH_IMAGE_ERROR=''
  export FAKE_GH_JOBS_FAIL='' FAKE_GH_TIP_FAIL=''
}

seed_version() {
  local version="$1"
  shift
  printf '{\n  "name": "crm",\n  "version": "%s"\n}\n' "$version" > "$SANDBOX/package.json"
  FAKE_GIT_TAGS="$(printf '%s\n' "$@")"
  export FAKE_GIT_TAGS
}

run_version_guard() {
  run bash "$SANDBOX/$VERSION_SCRIPT" "$SANDBOX"
}

run_health() {
  run env GH_REPO='VilnaCRM-Org/crm' RELEASE_HEALTH_BODY_FILE="$SANDBOX/body.md" RUN_URL='https://example.test/run' \
    sh "$SANDBOX/$HEALTH_SCRIPT"
}

run_tip() {
  : > "$SANDBOX/github-output"
  run env GH_REPO='VilnaCRM-Org/crm' VERIFIED_SHA="$1" GITHUB_OUTPUT="$SANDBOX/github-output" \
    sh "$SANDBOX/$TIP_SCRIPT"
}

run_push() {
  create_release_docker_stub
  : > "$SANDBOX/github-output"
  run env RELEASE_DIGEST_FILE="$SANDBOX/release/image-digest" GITHUB_OUTPUT="$SANDBOX/github-output" \
    sh "$SANDBOX/$PUSH_SCRIPT" "$@"
}

# --- check-release-version: positive ------------------------------------------

@test "version guard passes when package.json matches the highest tag" {
  seed_version '0.3.0' v0.3.0
  run_version_guard
  [ "$status" -eq 0 ]
  assert_output_contains '0.3.0 >= highest tag v0.3.0'
}

@test "version guard passes when package.json is ahead of every tag" {
  seed_version '0.4.0' v0.3.0
  run_version_guard
  [ "$status" -eq 0 ]
  assert_output_contains 'release-version: OK'
}

@test "version guard compares numerically, not lexicographically" {
  seed_version '1.10.0' v1.9.0
  run_version_guard
  [ "$status" -eq 0 ]
  assert_output_contains 'highest tag v1.9.0'
}

@test "version guard ignores tags that are not plain semver" {
  seed_version '0.3.0' v0.3.0 v1.0.0-rc.1 archive/old nightly v01.9.0
  run_version_guard
  [ "$status" -eq 0 ]
  assert_output_contains 'highest tag v0.3.0'
}

@test "version guard passes on an untagged repository" {
  seed_version '0.1.0'
  run_version_guard
  [ "$status" -eq 0 ]
  assert_output_contains 'no release tags yet'
}

# --- check-release-version: negative --------------------------------------------

@test "version guard reproduces the deadlock: 0.2.0 against the existing v0.3.0 tag" {
  seed_version '0.2.0' v0.3.0
  run_version_guard
  [ "$status" -eq 1 ]
  assert_output_contains '::error::release-version:'
  assert_output_contains 'package.json is at 0.2.0 but tag v0.3.0 already exists'
  assert_output_contains 'set package.json'
}

@test "version guard fails one patch below the highest tag and passes one above" {
  seed_version '1.6.0' v1.6.1
  run_version_guard
  [ "$status" -eq 1 ]
  seed_version '1.6.2' v1.6.1
  run_version_guard
  [ "$status" -eq 0 ]
}

@test "version guard fails when package.json is missing, unparseable, or versionless" {
  run_version_guard
  [ "$status" -eq 1 ]
  assert_output_contains 'missing'
  printf '{ not json' > "$SANDBOX/package.json"
  run_version_guard
  [ "$status" -eq 1 ]
  assert_output_contains 'could not parse'
  printf '{\n  "name": "crm"\n}\n' > "$SANDBOX/package.json"
  run_version_guard
  [ "$status" -eq 1 ]
  assert_output_contains 'no "version" field'
}

@test "version guard rejects a version that is not MAJOR.MINOR.PATCH" {
  for bad in '1.6' '1.6.0-rc.1' '1.2.3.4' '01.2.3' '1.6.0+build.5'; do
    seed_version "$bad" v1.5.0
    run_version_guard
    [ "$status" -eq 1 ]
    assert_output_contains 'not a MAJOR.MINOR.PATCH semver'
  done
}

@test "version guard fails closed when the tags cannot be listed" {
  seed_version '0.3.0' v0.3.0
  export FAKE_GIT_TAG_LIST_FAILS=1
  run_version_guard
  [ "$status" -eq 1 ]
  assert_output_contains 'could not list git tags'
}

@test "version guard asks git only for the tag list, scoped to the directory it was given" {
  seed_version '0.3.0' v0.3.0
  run_version_guard
  [ "$status" -eq 0 ]
  assert_log_contains "git -C $SANDBOX tag --list"
  [ "$(wc -l < "$COMMAND_LOG")" -eq 1 ]
}

# --- check-release-health -------------------------------------------------------

@test "health monitor is quiet when the run is green and the newest tag ships its tarball and image" {
  run_health
  [ "$status" -eq 0 ]
  assert_output_contains 'release-health: OK (tag v0.3.0, run 0123456789ab)'
  run grep -E 'gh issue (create|comment|edit)' "$COMMAND_LOG"
  [ "$status" -ne 0 ]
}

@test "health monitor closes the tracking issue once the train recovers" {
  export FAKE_GH_ISSUE_NUMBER=42
  run_health
  [ "$status" -eq 0 ]
  assert_log_contains 'gh issue close 42 --comment The release train is healthy again: https://example.test/run.'
}

@test "health monitor reads the release jobs of the newest main verification push run" {
  run_health
  [ "$status" -eq 0 ]
  assert_log_contains 'gh run list --workflow main-verification.yml --branch main --event push --limit 1'
  assert_log_contains 'gh run view 4242 --json jobs'
}

@test "health monitor files an issue and exits 1 when the release job of the newest run failed" {
  export FAKE_GH_RUN='9 completed feedfacecafe https://github.com/o/r/actions/runs/9'
  export FAKE_GH_JOBS='success\tverify lint and contracts\nsuccess\tverify unit tests\nsuccess\trelease / verify main tip\nfailure\trelease / build'
  run_health
  [ "$status" -eq 1 ]
  assert_log_contains 'gh issue create --label release-broken --title Release train is broken: newest tag v0.3.0, newest run feedfacecafe'
  grep -F 'did not succeed at `feedfacecafe`: release / build (failure)' "$SANDBOX/body.md"
  grep -F '<!-- release-health: tag=v0.3.0 run=feedfacecafe offences=' "$SANDBOX/body.md"
}

@test "health monitor reports a release call that failed before any of its jobs started" {
  export FAKE_GH_JOBS='success\tverify lint and contracts\nsuccess\tverify unit tests\nfailure\trelease'
  run_health
  [ "$status" -eq 1 ]
  grep -F ': release (failure):' "$SANDBOX/body.md"
}

@test "health monitor leaves a red lint or unit job to main-is-red when the release was skipped" {
  export FAKE_GH_JOBS='failure\tverify lint and contracts\nsuccess\tverify unit tests\nskipped\trelease\nsuccess\treport a red main'
  run_health
  [ "$status" -eq 0 ]
  assert_output_contains 'release-health: OK'
}

@test "health monitor accepts a release the tip guard skipped because main moved on" {
  export FAKE_GH_JOBS='success\tverify lint and contracts\nsuccess\tverify unit tests\nsuccess\trelease / verify main tip\nskipped\trelease / build'
  run_health
  [ "$status" -eq 0 ]
}

@test "health monitor reports a main verification run that carries no release job" {
  export FAKE_GH_JOBS='success\tverify lint and contracts\nsuccess\tverify unit tests\nsuccess\treleasenotes / build'
  run_health
  [ "$status" -eq 1 ]
  grep -F 'has no `release` job' "$SANDBOX/body.md"
}

@test "health monitor fails closed when the jobs of the newest run cannot be listed" {
  export FAKE_GH_JOBS_FAIL='gh: HTTP 502'
  run_health
  [ "$status" -eq 1 ]
  assert_output_contains 'could not list the jobs of main-verification.yml run 4242'
  run grep -F 'gh issue' "$COMMAND_LOG"
  [ "$status" -ne 0 ]
}

@test "health monitor reports a tag with no release" {
  export FAKE_GH_RELEASE_ERROR='gh: Not Found (HTTP 404)'
  run_health
  [ "$status" -eq 1 ]
  grep -F 'tag `v0.3.0` has no GitHub release' "$SANDBOX/body.md"
}

@test "health monitor reports a release without its tarball" {
  export FAKE_GH_RELEASE_ASSETS='crm-image.cdx.json'
  run_health
  [ "$status" -eq 1 ]
  grep -F 'does not carry `crm-dist-0.3.0.tar.gz`' "$SANDBOX/body.md"
}

@test "health monitor reports a release whose image was never pushed" {
  export FAKE_GH_IMAGE_TAGS='0.2.0'
  run_health
  [ "$status" -eq 1 ]
  grep -F 'no image tagged `0.3.0`' "$SANDBOX/body.md"
  export FAKE_GH_IMAGE_ERROR='gh: Package not found (HTTP 404)'
  run_health
  [ "$status" -eq 1 ]
  grep -F 'GHCR has no `crm` container package' "$SANDBOX/body.md"
}

@test "health monitor stays quiet when the offences are already recorded" {
  export FAKE_GH_JOBS='failure\trelease / build'
  export FAKE_GH_ISSUE_NUMBER=42
  run_health
  [ "$status" -eq 1 ]
  marker="$(grep -oE 'release-health: tag=[^ ]+ run=[^ ]+ offences=[0-9]+' "$SANDBOX/body.md")"
  export FAKE_GH_ISSUE_BODY="<!-- $marker -->"
  reset_command_log
  run_health
  [ "$status" -eq 1 ]
  assert_output_contains 'already records this state'
  run grep -E 'gh issue (comment|edit|create)' "$COMMAND_LOG"
  [ "$status" -ne 0 ]
}

@test "health monitor defers instead of filing while the newest release run is still in flight" {
  export FAKE_GH_RUN='9 in_progress feedfacecafe https://github.com/o/r/actions/runs/9'
  export FAKE_GH_RELEASE_ERROR='gh: Not Found (HTTP 404)'
  run_health
  [ "$status" -eq 0 ]
  assert_output_contains 'deferred, the newest main-verification.yml run at feedfacecafe is still in_progress'
  run grep -E 'gh (api|issue|run view)' "$COMMAND_LOG"
  [ "$status" -ne 0 ]
}

@test "health monitor passes on a repository with no release tag yet" {
  export FAKE_GH_TAGS='archive/old'
  run_health
  [ "$status" -eq 0 ]
  assert_output_contains 'no v* release tag yet'
}

@test "health monitor fails closed on an API error without filing anything" {
  export FAKE_GH_TAGS_FAIL='gh: HTTP 500'
  run_health
  [ "$status" -eq 1 ]
  assert_output_contains 'could not list the tags'
  run grep -F 'gh issue' "$COMMAND_LOG"
  [ "$status" -ne 0 ]
  export FAKE_GH_TAGS_FAIL=''
  export FAKE_GH_RELEASE_ERROR='gh: HTTP 502'
  run_health
  [ "$status" -eq 1 ]
  assert_output_contains 'could not read the release'
}

# --- check-release-tip ------------------------------------------------------------

@test "tip guard releases while main is still at the verified commit" {
  run_tip "$VERIFIED_SHA"
  [ "$status" -eq 0 ]
  assert_output_contains "main is still at the verified $VERIFIED_SHA; releasing"
  [ "$(cat "$SANDBOX/github-output")" = 'current=true' ]
  assert_log_contains 'gh api repos/VilnaCRM-Org/crm/git/ref/heads/main --jq .object.sha'
}

@test "tip guard skips with a notice, not a failure, when main has moved past the verified commit" {
  export FAKE_GH_TIP="$MOVED_SHA"
  run_tip "$VERIFIED_SHA"
  [ "$status" -eq 0 ]
  assert_output_contains "::notice::release-tip: main moved from the verified $VERIFIED_SHA to $MOVED_SHA"
  [ "$(cat "$SANDBOX/github-output")" = 'current=false' ]
}

@test "tip guard honours RELEASE_BRANCH" {
  : > "$SANDBOX/github-output"
  run env GH_REPO='o/r' VERIFIED_SHA="$VERIFIED_SHA" RELEASE_BRANCH='release' \
    GITHUB_OUTPUT="$SANDBOX/github-output" sh "$SANDBOX/$TIP_SCRIPT"
  [ "$status" -eq 0 ]
  assert_log_contains 'gh api repos/o/r/git/ref/heads/release --jq .object.sha'
}

@test "tip guard fails closed, deciding nothing, when the tip cannot be read" {
  export FAKE_GH_TIP_FAIL='gh: HTTP 502'
  run_tip "$VERIFIED_SHA"
  [ "$status" -eq 1 ]
  assert_output_contains '::error::release-tip: could not read the tip of main'
  [ ! -s "$SANDBOX/github-output" ]
}

@test "tip guard rejects an abbreviated or empty SHA on either side" {
  run_tip '0123456789ab'
  [ "$status" -eq 1 ]
  assert_output_contains 'is not a full commit SHA'
  [ ! -s "$SANDBOX/github-output" ]
  export FAKE_GH_TIP=''
  run_tip "$VERIFIED_SHA"
  [ "$status" -eq 1 ]
  assert_output_contains 'not a full commit SHA'
  run env GH_REPO='o/r' sh "$SANDBOX/$TIP_SCRIPT"
  [ "$status" -ne 0 ]
  assert_output_contains 'VERIFIED_SHA is required'
}

# --- push-release-image ------------------------------------------------------------

@test "image push records the digest both tags resolved to, in the file and the step output" {
  export FAKE_DOCKER_PUSH_DIGEST="sha256:$(printf 'a%.0s' $(seq 64))"
  run_push ghcr.io/vilnacrm-org/crm:1.2.3 ghcr.io/vilnacrm-org/crm:sha-abcdef123456
  [ "$status" -eq 0 ]
  assert_log_contains 'docker push ghcr.io/vilnacrm-org/crm:1.2.3'
  assert_log_contains 'docker push ghcr.io/vilnacrm-org/crm:sha-abcdef123456'
  [ "$(cat "$SANDBOX/release/image-digest")" = "$FAKE_DOCKER_PUSH_DIGEST" ]
  [ "$(cat "$SANDBOX/github-output")" = "digest=$FAKE_DOCKER_PUSH_DIGEST" ]
}

@test "image push fails when the registry reports no digest" {
  export FAKE_DOCKER_PUSH_DIGEST=''
  run_push ghcr.io/vilnacrm-org/crm:1.2.3
  [ "$status" -eq 1 ]
  assert_output_contains 'reported no sha256 manifest digest'
  [ ! -s "$SANDBOX/github-output" ]
  export FAKE_DOCKER_PUSH_DIGEST='sha256:short'
  run_push ghcr.io/vilnacrm-org/crm:1.2.3
  [ "$status" -eq 1 ]
}

@test "image push fails when two tags resolve to different digests" {
  export FAKE_DOCKER_PUSH_DIGEST="sha256:$(printf 'a%.0s' $(seq 64))"
  export FAKE_DOCKER_SECOND_DIGEST="sha256:$(printf 'b%.0s' $(seq 64))"
  run_push ghcr.io/vilnacrm-org/crm:1.2.3 ghcr.io/vilnacrm-org/crm:sha-abcdef123456
  [ "$status" -eq 1 ]
  assert_output_contains 'but an earlier reference was pushed as'
  [ ! -e "$SANDBOX/release/image-digest" ]
}

@test "image push stops at a rejected push and surfaces the registry error" {
  export FAKE_DOCKER_PUSH_DIGEST="sha256:$(printf 'a%.0s' $(seq 64))"
  export FAKE_DOCKER_PUSH_FAILS='ghcr.io/vilnacrm-org/crm:1.2.3'
  run_push ghcr.io/vilnacrm-org/crm:1.2.3 ghcr.io/vilnacrm-org/crm:sha-abcdef123456
  [ "$status" -eq 1 ]
  assert_output_contains 'denied: permission_denied'
  assert_output_contains 'docker push ghcr.io/vilnacrm-org/crm:1.2.3 failed'
  run grep -F 'sha-abcdef123456' "$COMMAND_LOG"
  [ "$status" -ne 0 ]
}

@test "image push refuses to run without a reference" {
  run_push
  [ "$status" -eq 1 ]
  assert_output_contains 'no image reference given'
}

# --- autorelease.yml shape ------------------------------------------------------

@test "autorelease is a reusable workflow only, requiring exactly the two App secrets" {
  [ -n "$(code_line '^[0-9]+:  workflow_call:$')" ]
  [ -z "$(code_line '^[0-9]+:  push:$')" ]
  [ -z "$(code_line 'paths-ignore')" ]
  [ -n "$(code_line '^[0-9]+:      VILNACRM_APP_ID:$')" ]
  [ -n "$(code_line '^[0-9]+:      VILNACRM_APP_PRIVATE_KEY:$')" ]
  [ "$(workflow_code | grep -cE '^[0-9]+: +required: true$')" -eq 2 ]
}

@test "autorelease releases only when the tip guard says main is still at the verified commit" {
  local tip build
  tip="$(workflow_job_code tip)"
  build="$(workflow_job_code build)"
  printf '%s\n' "$tip" | grep -qE '^[0-9]+: +run: sh scripts/ci/check-release-tip.sh$'
  printf '%s\n' "$tip" | grep -qF 'VERIFIED_SHA: ${{ github.sha }}'
  printf '%s\n' "$tip" | grep -qF 'current: ${{ steps.tip.outputs.current }}'
  printf '%s\n' "$tip" | grep -qE '^[0-9]+: +timeout-minutes: [0-9]+$'
  printf '%s\n' "$build" | grep -qE '^[0-9]+:    needs: tip$'
  printf '%s\n' "$build" | grep -qF "if: \${{ needs.tip.outputs.current == 'true' }}"
}

@test "autorelease attests the tarball and the pushed image digest with a SHA-pinned provenance action" {
  local step
  step="$(step_code 'Attest the release tarball')"
  printf '%s\n' "$step" | grep -qE '^[0-9]+: +uses: actions/attest-build-provenance@[0-9a-f]{40} # v[0-9]+\.[0-9]+\.[0-9]+$'
  printf '%s\n' "$step" | grep -qF "subject-path: 'release/crm-dist-*.tar.gz'"
  step="$(step_code 'Attest the production image')"
  printf '%s\n' "$step" | grep -qE '^[0-9]+: +uses: actions/attest-build-provenance@[0-9a-f]{40} # v[0-9]+\.[0-9]+\.[0-9]+$'
  printf '%s\n' "$step" | grep -qE '^[0-9]+: +subject-name: ghcr\.io/vilnacrm-org/crm$'
  printf '%s\n' "$step" | grep -qF 'subject-digest: ${{ steps.publish_image.outputs.digest }}'
  printf '%s\n' "$step" | grep -qE '^[0-9]+: +push-to-registry: true$'
  [ "$(code_line 'Attest the release tarball')" -gt "$(code_line 'run: make release-tarball')" ]
  [ "$(code_line 'Attest the release tarball')" -gt "$(code_line 'gh release create')" ]
  [ "$(code_line 'Attest the release tarball')" -gt "$(code_line 'run: make publish-image')" ]
  [ "$(code_line 'Attest the production image')" -gt "$(code_line 'gh release create')" ]
  [ "$(code_line 'Attest the production image')" -gt "$(code_line 'run: make publish-image')" ]
  [ -n "$(code_line '^[0-9]+: +id: publish_image$')" ]
  [ -n "$(code_line '^[0-9]+: +id-token: write$')" ]
  [ -n "$(code_line '^[0-9]+: +attestations: write$')" ]
}

@test "main verification calls the release only after lint and unit, passing the secrets by name" {
  local job
  job="$(caller_job_code release)"
  printf '%s\n' "$job" | grep -qE '^[0-9]+:    needs: \[lint, unit\]$'
  printf '%s\n' "$job" | grep -qE '^[0-9]+:    uses: \./\.github/workflows/autorelease\.yml$'
  printf '%s\n' "$job" | grep -qF 'VILNACRM_APP_ID: ${{ secrets.VILNACRM_APP_ID }}'
  printf '%s\n' "$job" | grep -qF 'VILNACRM_APP_PRIVATE_KEY: ${{ secrets.VILNACRM_APP_PRIVATE_KEY }}'
  for permission in 'contents: write' 'packages: write' 'id-token: write' 'attestations: write'; do
    printf '%s\n' "$job" | grep -qE "^[0-9]+: +${permission}$"
  done
  run grep -F 'secrets: inherit' "$(CALLER)"
  [ "$status" -ne 0 ]
  [ -z "$(printf '%s\n' "$job" | grep -E '^[0-9]+:    if:')" ]
}

@test "autorelease runs the version preflight before the changelog action" {
  local guard_line action_line
  guard_line="$(code_line 'run: make check-release-version')"
  action_line="$(code_line 'TriPSs/conventional-changelog-action')"
  [ -n "$guard_line" ]
  [ -n "$action_line" ]
  [ "$guard_line" -lt "$action_line" ]
}

@test "autorelease tells the changelog action not to push and never uses --follow-tags" {
  [ -n "$(code_line '^[0-9]+: +git-push: false$')" ]
  [ -z "$(code_line '--follow-tags')" ]
}

@test "autorelease pushes the branch ref before the fully qualified tag ref" {
  local branch_line tag_line
  branch_line="$(code_line 'git push .*HEAD:')"
  tag_line="$(code_line 'git push .*"refs/tags/\$\{RELEASE_TAG\}"')"
  [ -n "$branch_line" ]
  [ -n "$tag_line" ]
  [ "$branch_line" -lt "$tag_line" ]
}

@test "autorelease names the App and the recovery doc on GH006, and still exits non-zero before the tag push" {
  local step error_line exit_line tag_line
  step="$(step_code 'Push the release commit, then its tag')"
  printf '%s\n' "$step" | grep -qE "^[0-9]+: +if: \\\$\{\{ steps\.changelog\.outputs\.skipped == 'false' \}\}$"
  printf '%s\n' "$step" | grep -qE "grep -q 'GH006'"
  printf '%s\n' "$step" | grep -qF '${APP_SLUG}'
  printf '%s\n' "$step" | grep -qF 'APP_SLUG: ${{ steps.generate_token.outputs.app-slug }}'
  printf '%s\n' "$step" | grep -qF "CONTRIBUTING.md, 'Releases and the"
  error_line="$(printf '%s\n' "$step" | grep -E '::error::' | head -n 1 | cut -d: -f1)"
  exit_line="$(printf '%s\n' "$step" | grep -E '^[0-9]+: +exit 1$' | head -n 1 | cut -d: -f1)"
  tag_line="$(printf '%s\n' "$step" | grep -E 'git push .*refs/tags/' | cut -d: -f1)"
  [ "$error_line" -lt "$exit_line" ]
  [ "$exit_line" -lt "$tag_line" ]
}

@test "autorelease packs the tarball, attaches it at release creation, and publishes the image, all gated on a real release" {
  local step
  for name in 'Pack the release tarball' 'Create Release' 'Log in to the GitHub Container Registry' 'Publish the production image'; do
    step="$(step_code "$name")"
    [ -n "$step" ]
    printf '%s\n' "$step" | grep -qE "^[0-9]+: +if: \\\$\{\{ steps\.changelog\.outputs\.skipped == 'false' \}\}$"
  done
  [ -n "$(code_line 'run: make release-tarball')" ]
  [ -n "$(code_line 'run: make publish-image')" ]
  [ -n "$(code_line 'gh release create "\$RELEASE_TAG" "\$\{tarballs\[0\]\}"')" ]
  [ -n "$(code_line '^[0-9]+: +packages: write$')" ]
  [ -n "$(workflow_job_code build | grep -E '^[0-9]+: +timeout-minutes: [0-9]+$')" ]
}

# --- make targets ---------------------------------------------------------------

@test "check-release-version and check-release-health hand off to their scripts" {
  setup_makefile_test_env
  run_make_target check-release-version
  [ "$status" -eq 0 ]
  assert_log_contains 'check-release-version.sh .'
  run_make_target check-release-health
  [ "$status" -eq 0 ]
  assert_log_contains 'check-release-health.sh'
}

@test "release-tarball extracts the production bundle and packs it under the package.json version" {
  setup_makefile_test_env
  run_make_target release-tarball RELEASE_VERSION=1.2.3
  [ "$status" -eq 0 ]
  assert_log_contains 'docker build -t rsbuild-bundle -f Dockerfile --target production .'
  assert_log_contains 'docker cp fake-container-id:/app/dist ./out'
  assert_log_contains 'tar -czf ./release/crm-dist-1.2.3.tar.gz -C ./out .'
  [ -d "$MAKEFILE_SANDBOX/release" ]
}

@test "publish-image builds the production target and pushes the version and commit tags to GHCR" {
  setup_makefile_test_env
  run_make_target publish-image RELEASE_VERSION=1.2.3 RELEASE_GIT_SHA=abcdef123456
  [ "$status" -eq 0 ]
  assert_log_contains 'docker build -t ghcr.io/vilnacrm-org/crm:1.2.3 -t ghcr.io/vilnacrm-org/crm:sha-abcdef123456 -f Dockerfile --target production .'
  assert_log_contains 'push-release-image.sh RELEASE_DIGEST_FILE=./release/image-digest ghcr.io/vilnacrm-org/crm:1.2.3 ghcr.io/vilnacrm-org/crm:sha-abcdef123456'
  run grep -F -- 'test-harness' "$COMMAND_LOG"
  [ "$status" -ne 0 ]
}
