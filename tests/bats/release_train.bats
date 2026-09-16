#!/usr/bin/env bats

# Coverage for the release train (issue #138): the version preflight
# (scripts/ci/check-release-version.sh), the scheduled health monitor
# (scripts/ci/check-release-health.sh), the shape of autorelease.yml, and the
# make targets that wire them (check-release-version, check-release-health,
# release-tarball, publish-image).

load './test_helper.bash'

VERSION_SCRIPT='scripts/ci/check-release-version.sh'
HEALTH_SCRIPT='scripts/ci/check-release-health.sh'

WORKFLOW() {
  printf '%s' "$PROJECT_ROOT/.github/workflows/autorelease.yml"
}

workflow_code() {
  grep -n '' "$(WORKFLOW)" | grep -vE '^[0-9]+:[[:space:]]*#'
}

code_line() {
  workflow_code | grep -E "$1" | head -n 1 | cut -d: -f1
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

if [ "$1" = "api" ]; then
  case "$*" in
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

setup() {
  setup_stub_dir
  create_release_git_stub
  create_release_gh_stub

  SANDBOX="$BATS_TEST_TMPDIR/sandbox"
  mkdir -p "$SANDBOX/scripts/ci"
  cp "$PROJECT_ROOT/$VERSION_SCRIPT" "$SANDBOX/scripts/ci/"
  cp "$PROJECT_ROOT/$HEALTH_SCRIPT" "$SANDBOX/scripts/ci/"
  cp "$PROJECT_ROOT/scripts/ci/upsert-audit-issue.sh" "$SANDBOX/scripts/ci/"

  export FAKE_GIT_TAGS=''
  export FAKE_GIT_TAG_LIST_FAILS=0
  export FAKE_GH_RUN='success 0123456789ab https://github.com/o/r/actions/runs/1'
  export FAKE_GH_TAGS='v0.3.0'
  export FAKE_GH_RELEASE_ASSETS='crm-dist-0.3.0.tar.gz'
  export FAKE_GH_IMAGE_TAGS="0.3.0
sha-0123456789ab"
  export FAKE_GH_ISSUE_NUMBER=''
  export FAKE_GH_ISSUE_BODY=''
  export FAKE_GH_RUN_FAIL='' FAKE_GH_TAGS_FAIL='' FAKE_GH_RELEASE_ERROR='' FAKE_GH_IMAGE_ERROR=''
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

@test "health monitor files an issue and exits 1 when the newest autorelease run failed" {
  export FAKE_GH_RUN='failure feedfacecafe https://github.com/o/r/actions/runs/9'
  run_health
  [ "$status" -eq 1 ]
  assert_log_contains 'gh issue create --label release-broken --title Release train is broken: newest tag v0.3.0, newest run feedfacecafe'
  grep -F 'concluded **failure** at `feedfacecafe`' "$SANDBOX/body.md"
  grep -F '<!-- release-health: tag=v0.3.0 run=feedfacecafe offences=' "$SANDBOX/body.md"
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
  export FAKE_GH_RUN='failure feedfacecafe https://github.com/o/r/actions/runs/9'
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

# --- autorelease.yml shape ------------------------------------------------------

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
  [ -z "$(code_line -- '--follow-tags')" ]
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
  [ -n "$(code_line '^[0-9]+: +timeout-minutes: [0-9]+$')" ]
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
  assert_log_contains 'docker push ghcr.io/vilnacrm-org/crm:1.2.3'
  assert_log_contains 'docker push ghcr.io/vilnacrm-org/crm:sha-abcdef123456'
  run grep -F -- 'test-harness' "$COMMAND_LOG"
  [ "$status" -ne 0 ]
}
