#!/usr/bin/env bats

load './test_helper.bash'

setup() {
  setup_ci_script_test_env
}

@test "run-parallel-lint.sh groups output and propagates failures" {
  local script_path="$PROJECT_ROOT/scripts/ci/run-parallel-lint.sh"

  run_ci_script "$script_path"
  [ "$status" -eq 1 ]
  assert_output_contains 'Usage:'

  reset_command_log
  # shellcheck disable=SC2016
  run env \
    PATH="$STUB_BIN_DIR:$PATH" \
    COMMAND_LOG="$COMMAND_LOG" \
    FAKE_MAKE_FAIL_TARGET=lint-tsc \
    bash -c 'cd "$1" && shift && "$@"' _ "$SCRIPT_SANDBOX" "$script_path" lint-eslint lint-tsc
  [ "$status" -eq 1 ]
  assert_output_contains '===== lint-eslint ====='
  assert_output_contains '===== lint-tsc ====='
  assert_output_contains 'ci-lint: lint-tsc failed with exit code 1'
  assert_log_contains 'make lint-eslint'
  assert_log_contains 'make lint-tsc'
}

@test "run-parallel-tests.sh groups output and propagates failures" {
  local script_path="$PROJECT_ROOT/scripts/ci/run-parallel-tests.sh"

  run_ci_script "$script_path"
  [ "$status" -eq 1 ]
  assert_output_contains 'Usage:'

  reset_command_log
  # shellcheck disable=SC2016
  run env \
    PATH="$STUB_BIN_DIR:$PATH" \
    COMMAND_LOG="$COMMAND_LOG" \
    FAKE_MAKE_FAIL_TARGET=ci-test-unit-server \
    bash -c 'cd "$1" && shift && "$@"' _ "$SCRIPT_SANDBOX" "$script_path" ci-test-unit-client ci-test-unit-server
  [ "$status" -eq 1 ]
  assert_output_contains '===== ci-test-unit-client ====='
  assert_output_contains '===== ci-test-unit-server ====='
  assert_output_contains 'ci-test: ci-test-unit-server failed with exit code 1'
  assert_log_contains 'make ci-test-unit-client'
  assert_log_contains 'make ci-test-unit-server'
}

@test "batch_unit_mutation_integration_lint.sh dispatches each DIND flow through make" {
  local script_path="$PROJECT_ROOT/scripts/ci/batch_unit_mutation_integration_lint.sh"

  run_ci_script "$script_path" test-unit
  [ "$status" -eq 0 ]
  assert_log_contains 'docker network create crm-network'
  assert_log_contains 'make build'
  assert_log_contains 'make create-temp-dev-container-dind TEMP_CONTAINER_NAME=dev-test'
  assert_log_contains 'make copy-source-to-container-dind TEMP_CONTAINER_NAME=dev-test'
  assert_log_contains 'make install-deps-in-container-dind TEMP_CONTAINER_NAME=dev-test'
  assert_log_contains 'make run-unit-tests-dind TEMP_CONTAINER_NAME=dev-test'

  reset_command_log
  run_ci_script "$script_path" test-mutation
  [ "$status" -eq 0 ]
  assert_log_contains 'make run-mutation-tests-dind TEMP_CONTAINER_NAME=dev-test'

  reset_command_log
  run_ci_script "$script_path" test-integration
  [ "$status" -eq 0 ]
  assert_log_contains 'make run-integration-tests-dind TEMP_CONTAINER_NAME=dev-integration'

  reset_command_log
  run_ci_script "$script_path" test-lint
  [ "$status" -eq 0 ]
  assert_log_contains 'make run-eslint-tests-dind TEMP_CONTAINER_NAME=dev-lint'
  assert_log_contains 'make run-typescript-tests-dind TEMP_CONTAINER_NAME=dev-lint'
  assert_log_contains 'make run-markdown-lint-tests-dind TEMP_CONTAINER_NAME=dev-lint'
}

@test "batch_pw_load.sh dispatches its Playwright and load flows through make and docker" {
  local script_path="$PROJECT_ROOT/scripts/ci/batch_pw_load.sh"

  run_ci_script "$script_path" test-playwright-e2e
  [ "$status" -eq 0 ]
  assert_log_contains 'make start-prod'
  assert_log_contains 'docker compose -f common-healthchecks.yml -f docker-compose.test.yml exec -T playwright mkdir -p /app'
  assert_log_contains 'make test-e2e'
  assert_log_contains 'docker compose -f common-healthchecks.yml -f docker-compose.test.yml cp playwright:/app/playwright-report/. playwright-report/'

  reset_command_log
  run_ci_script "$script_path" test-playwright-visual
  [ "$status" -eq 0 ]
  assert_log_contains 'make start-prod'
  assert_log_contains 'make test-visual'

  reset_command_log
  run_ci_script "$script_path" test-load
  [ "$status" -eq 0 ]
  assert_log_contains 'make start-prod'
  assert_log_contains 'make build-k6'
  assert_log_contains 'make create-k6-helper-container-dind K6_HELPER_NAME=crm-k6-helper-homepage'
  assert_log_contains 'make run-load-tests-dind K6_HELPER_NAME=crm-k6-helper-homepage K6_TEST_SCRIPT=/loadTests/homepage.js K6_RESULTS_FILE=/loadTests/results/homepage.html'
  assert_log_contains 'docker cp tests/load/. crm-k6-helper-homepage:/loadTests/'

  reset_command_log
  run_ci_script "$script_path" test-load-signup
  [ "$status" -eq 0 ]
  assert_log_contains 'make create-k6-helper-container-dind K6_HELPER_NAME=crm-k6-helper-signup'
  assert_log_contains 'make run-load-tests-dind K6_HELPER_NAME=crm-k6-helper-signup K6_TEST_SCRIPT=/loadTests/signup.js K6_RESULTS_FILE=/loadTests/results/signup.html'
}

# Route-coverage inventory gate (issue #169): scripts/ci/check-e2e-route-coverage.ts,
# wired as `make check-e2e-route-coverage`.
write_route_fixture() {
  ROUTE_SANDBOX="$BATS_TEST_TMPDIR/routes"
  mkdir -p "$ROUTE_SANDBOX/src/routes" "$ROUTE_SANDBOX/tests/e2e" "$ROUTE_SANDBOX/tests/visual"
  printf 'const ROUTE_PATHS = {\n%s} as const;\n\nexport default ROUTE_PATHS;\n' "$1" \
    > "$ROUTE_SANDBOX/src/routes/route-paths.ts"
  printf 'import "x";\n' > "$ROUTE_SANDBOX/tests/e2e/home.spec.ts"
  printf 'import "x";\n' > "$ROUTE_SANDBOX/tests/visual/home.spec.ts"
  printf '%s\n' "$2" > "$ROUTE_SANDBOX/tests/e2e/route-coverage.tsv"
}

run_route_gate() {
  run env \
    PATH="$STUB_BIN_DIR:$PATH" \
    COMMAND_LOG="$COMMAND_LOG" \
    bash -c 'cd "$1" && shift && "$@"' _ "$ROUTE_SANDBOX" \
    node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
    "$PROJECT_ROOT/scripts/ci/check-e2e-route-coverage.ts"
}

@test "check-e2e-route-coverage.ts passes when every route names an existing spec" {
  write_route_fixture "  home: '/',
" "route	suite	spec	details
home	e2e	tests/e2e/home.spec.ts	Covered."

  run_route_gate
  [ "$status" -eq 0 ]
  assert_output_contains 'every route covered'
}

@test "check-e2e-route-coverage.ts fails on a route added without a manifest row" {
  write_route_fixture "  home: '/',
  settings: '/settings',
" "route	suite	spec	details
home	e2e	tests/e2e/home.spec.ts	Covered."

  run_route_gate
  [ "$status" -eq 1 ]
  assert_output_contains 'route "settings" has no row'
}

@test "check-e2e-route-coverage.ts fails when a manifest row names a missing spec" {
  write_route_fixture "  home: '/',
" "route	suite	spec	details
home	e2e	tests/e2e/deleted.spec.ts	Covered."

  run_route_gate
  [ "$status" -eq 1 ]
  assert_output_contains 'does not exist'
}

@test "check-e2e-route-coverage.ts fails on a stale row for a route that no longer exists" {
  write_route_fixture "  home: '/',
" "route	suite	spec	details
home	e2e	tests/e2e/home.spec.ts	Covered.
retired	e2e	tests/e2e/home.spec.ts	Stale."

  run_route_gate
  [ "$status" -eq 1 ]
  assert_output_contains 'is not declared in src/routes/route-paths.ts'
}

@test "check-e2e-route-coverage.ts fails when an allowlisted route is also covered" {
  write_route_fixture "  home: '/',
" "route	suite	spec	details
home	e2e	tests/e2e/home.spec.ts	Covered.
home	allowlisted	-	Out of browser scope."

  run_route_gate
  [ "$status" -eq 1 ]
  assert_output_contains 'both allowlisted and covered'
}

# An allowlist row is a claim that nothing renders the route. Once a contract binds the key to a
# `path:`, that claim is stale and only a machine check keeps it honest.
@test "check-e2e-route-coverage.ts fails when an allowlisted route is registered by a contract" {
  write_route_fixture "  home: '/',
  settings: '/settings',
" "route	suite	spec	details
home	e2e	tests/e2e/home.spec.ts	Covered.
settings	allowlisted	-	Nothing renders it yet."
  printf 'export default [{ path: ROUTE_PATHS.settings }];\n' \
    > "$ROUTE_SANDBOX/src/routes/settings-routes.ts"

  run_route_gate
  [ "$status" -eq 1 ]
  assert_output_contains 'is allowlisted in tests/e2e/route-coverage.tsv but src registers'
}

# The committed `passwordRecovery` shape: referenced only as a link target, registered by nothing.
@test "check-e2e-route-coverage.ts leaves an allowlisted route green while only a link names it" {
  write_route_fixture "  home: '/',
  settings: '/settings',
" "route	suite	spec	details
home	e2e	tests/e2e/home.spec.ts	Covered.
settings	allowlisted	-	No contract renders /settings yet."
  printf 'export default <a href={ROUTE_PATHS.settings} />;\n' \
    > "$ROUTE_SANDBOX/src/routes/settings-link.tsx"

  run_route_gate
  [ "$status" -eq 0 ]
  assert_output_contains 'every route covered'
}

@test "check-e2e-route-coverage.ts fails when a spec sits outside its suite root" {
  write_route_fixture "  home: '/',
" "route	suite	spec	details
home	visual	tests/e2e/home.spec.ts	Wrong root."

  run_route_gate
  [ "$status" -eq 1 ]
  assert_output_contains 'is not under "tests/visual/"'
}

# `tests/e2e/../../src/x` starts with the suite root and exists, so containment has to be
# checked on the resolved path or a route could be "covered" by a non-spec file.
@test "check-e2e-route-coverage.ts rejects a traversal path that escapes its suite root" {
  write_route_fixture "  home: '/',
" "route	suite	spec	details
home	e2e	tests/e2e/../../src/routes/route-paths.ts	Traversal."

  run_route_gate
  [ "$status" -eq 1 ]
  assert_output_contains 'is not under "tests/e2e/"'
}

@test "check-e2e-route-coverage.ts rejects a real file Playwright would never run" {
  write_route_fixture "  home: '/',
" "route	suite	spec	details
home	e2e	tests/e2e/helper.ts	Helper, not a spec."
  printf 'export const x = 1;\n' > "$ROUTE_SANDBOX/tests/e2e/helper.ts"

  run_route_gate
  [ "$status" -eq 1 ]
  assert_output_contains 'is not a .spec.ts file'
}

@test "check-e2e-route-coverage.ts rejects a directory posing as a covering spec" {
  write_route_fixture "  home: '/',
" "route	suite	spec	details
home	e2e	tests/e2e/nested.spec.ts	Directory, not a file."
  mkdir -p "$ROUTE_SANDBOX/tests/e2e/nested.spec.ts"

  run_route_gate
  [ "$status" -eq 1 ]
  assert_output_contains 'does not exist'
}

@test "check-e2e-route-coverage.ts refuses a manifest whose header was removed" {
  write_route_fixture "  home: '/',
" "home	e2e	tests/e2e/home.spec.ts	Covered."

  run_route_gate
  [ "$status" -eq 1 ]
  assert_output_contains 'must start with the tab-separated header'
}

@test "the committed route manifest covers the real route table" {
  run env \
    PATH="$STUB_BIN_DIR:$PATH" \
    COMMAND_LOG="$COMMAND_LOG" \
    bash -c 'cd "$1" && shift && "$@"' _ "$PROJECT_ROOT" \
    node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
    scripts/ci/check-e2e-route-coverage.ts
  [ "$status" -eq 0 ]
  assert_output_contains 'every route covered'
}

@test "batch_lhci_leak.sh dispatches memory-leak and Lighthouse DIND flows through make" {
  local script_path="$PROJECT_ROOT/scripts/ci/batch_lhci_leak.sh"

  run_ci_script "$script_path" test-memory-leak
  [ "$status" -eq 0 ]
  assert_log_contains 'make build-prod'
  assert_log_contains 'make start-prod'
  assert_log_contains 'make patch-prod-mockoon-url'
  assert_log_contains 'make memory-leak-dind'

  reset_command_log
  run_ci_script "$script_path" test-lighthouse-desktop
  [ "$status" -eq 0 ]
  assert_log_contains 'make build-prod'
  assert_log_contains 'make install-chromium-lhci'
  assert_log_contains 'make test-chromium'
  assert_log_contains 'make lighthouse-desktop-dind'
  assert_log_contains 'docker compose -f common-healthchecks.yml -f docker-compose.test.yml cp lighthouse/. prod:/app/lighthouse/'

  reset_command_log
  run_ci_script "$script_path" test-lighthouse-mobile
  [ "$status" -eq 0 ]
  assert_log_contains 'make build-prod'
  assert_log_contains 'make install-chromium-lhci'
  assert_log_contains 'make test-chromium'
  assert_log_contains 'make lighthouse-mobile-dind'
}

# resolve() does not dereference symlinks but statSync() does, so containment has to be
# re-checked on the real path or a symlink could smuggle an out-of-suite file in as coverage.
@test "check-e2e-route-coverage.ts rejects a symlink escaping its suite root" {
  write_route_fixture "  home: '/',
" "route	suite	spec	details
home	e2e	tests/e2e/linked.spec.ts	Symlink out of the suite."
  printf 'import "x";\n' > "$ROUTE_SANDBOX/outside.spec.ts"
  ln -s ../../outside.spec.ts "$ROUTE_SANDBOX/tests/e2e/linked.spec.ts"
  [ -f "$ROUTE_SANDBOX/tests/e2e/linked.spec.ts" ]

  run_route_gate
  [ "$status" -eq 1 ]
  assert_output_contains 'is not under "tests/e2e/"'
}

@test "check-e2e-route-coverage.ts rejects a row naming the suite root's parent" {
  write_route_fixture "  home: '/',
" "route	suite	spec	details
home	e2e	tests/e2e/..	Parent of the suite root."

  run_route_gate
  [ "$status" -eq 1 ]
  assert_output_contains 'is not under "tests/e2e/"'
}

@test "report-main-verification-failure.sh opens one issue and reuses it afterwards" {
  local script_path="$PROJECT_ROOT/scripts/ci/report-main-verification-failure.sh"

  run env \
    PATH="$STUB_BIN_DIR:$PATH" \
    COMMAND_LOG="$COMMAND_LOG" \
    FAILED_SHA=deadbee \
    RUN_URL=https://example.test/run/1 \
    sh "$script_path"
  [ "$status" -eq 0 ]
  assert_log_contains 'gh label create main-is-red'
  assert_log_contains 'gh issue list --label main-is-red --state open'
  assert_log_contains \
    'gh issue create --title main is red: post-merge verification failed --label main-is-red'
  ! grep -qF 'gh issue comment' "$COMMAND_LOG"

  reset_command_log
  run env \
    PATH="$STUB_BIN_DIR:$PATH" \
    COMMAND_LOG="$COMMAND_LOG" \
    FAILED_SHA=deadbee \
    RUN_URL=https://example.test/run/2 \
    FAKE_GH_OPEN_ISSUE=42 \
    sh "$script_path"
  [ "$status" -eq 0 ]
  assert_log_contains 'gh issue comment 42'
  assert_output_contains 'updated existing main-is-red issue #42'
  ! grep -qF 'gh issue create' "$COMMAND_LOG"
}

@test "report-main-verification-failure.sh closes the tracking issue once main recovers" {
  local script_path="$PROJECT_ROOT/scripts/ci/report-main-verification-failure.sh"

  run env \
    PATH="$STUB_BIN_DIR:$PATH" \
    COMMAND_LOG="$COMMAND_LOG" \
    RUN_URL=https://example.test/run/3 \
    FAKE_GH_OPEN_ISSUE=42 \
    sh "$script_path" --resolve
  [ "$status" -eq 0 ]
  assert_log_contains 'gh issue close 42'
  assert_output_contains 'closed main-is-red issue #42'

  reset_command_log
  run env \
    PATH="$STUB_BIN_DIR:$PATH" \
    COMMAND_LOG="$COMMAND_LOG" \
    RUN_URL=https://example.test/run/4 \
    sh "$script_path" --resolve
  [ "$status" -eq 0 ]
  assert_output_contains 'no main-is-red issue is open'
  ! grep -qF 'gh issue close' "$COMMAND_LOG"
}

@test "report-main-verification-failure.sh fails when the failing revision is unknown" {
  local script_path="$PROJECT_ROOT/scripts/ci/report-main-verification-failure.sh"

  run env \
    PATH="$STUB_BIN_DIR:$PATH" \
    COMMAND_LOG="$COMMAND_LOG" \
    RUN_URL=https://example.test/run/3 \
    sh "$script_path"
  [ "$status" -ne 0 ]
}

@test "lint-commit-range.sh lints every commit and propagates a failure" {
  local script_path="$PROJECT_ROOT/scripts/ci/lint-commit-range.sh"

  run_ci_script "$script_path"
  [ "$status" -eq 1 ]
  assert_output_contains 'Usage:'

  reset_command_log
  run env \
    PATH="$STUB_BIN_DIR:$PATH" \
    COMMAND_LOG="$COMMAND_LOG" \
    FAKE_GIT_REVISIONS='aaa111 bbb222' \
    sh "$script_path" base head
  [ "$status" -eq 0 ]
  assert_log_contains 'git rev-list base..head'
  assert_log_contains 'make lint-commit-message'
  assert_output_contains 'linted 2 commit(s) in base..head'

  reset_command_log
  run env \
    PATH="$STUB_BIN_DIR:$PATH" \
    COMMAND_LOG="$COMMAND_LOG" \
    FAKE_GIT_REVISIONS='ccc333' \
    GH_TOKEN=stub-token \
    COMMIT_PROVENANCE_REPO=VilnaCRM-Org/crm \
    FAKE_GH_COMMIT_VERIFIED=true \
    FAKE_GH_COMMIT_AUTHOR_LOGIN='dependabot[bot]' \
    FAKE_GH_COMMIT_COMMITTER_LOGIN='web-flow' \
    sh "$script_path" base head
  [ "$status" -eq 0 ]
  assert_log_contains 'gh api repos/VilnaCRM-Org/crm/commits/ccc333'
  assert_log_contains 'make lint-commit-bot-message'
  assert_output_contains 'is a GitHub-verified commit by dependabot[bot]'

  reset_command_log
  run env \
    PATH="$STUB_BIN_DIR:$PATH" \
    COMMAND_LOG="$COMMAND_LOG" \
    FAKE_GIT_REVISIONS='ddd444' \
    GH_TOKEN=stub-token \
    COMMIT_PROVENANCE_REPO=VilnaCRM-Org/crm \
    FAKE_GIT_AUTHOR='82976108+RudoiDmytro@users.noreply.github.com' \
    sh "$script_path" base head
  [ "$status" -eq 0 ]
  assert_log_contains 'make lint-commit-message'
  ! grep -qF 'make lint-commit-bot-message' "$COMMAND_LOG"

  reset_command_log
  run env \
    PATH="$STUB_BIN_DIR:$PATH" \
    COMMAND_LOG="$COMMAND_LOG" \
    FAKE_GIT_REVISIONS='aaa111' \
    FAKE_MAKE_FAIL_TARGET=lint-commit-message \
    sh "$script_path" base head
  [ "$status" -eq 1 ]
  assert_output_contains 'aaa111 has a non-conventional commit header'
}

@test "lint-commit-range.sh refuses a bot exemption forged in commit metadata" {
  local script_path="$PROJECT_ROOT/scripts/ci/lint-commit-range.sh"

  # The commit claims a bot noreply address, but GitHub vouches for nothing, so the strict
  # contract must still apply. Author email is contributor-controlled and must buy nothing.
  reset_command_log
  run env \
    PATH="$STUB_BIN_DIR:$PATH" \
    COMMAND_LOG="$COMMAND_LOG" \
    FAKE_GIT_REVISIONS='eee555' \
    GH_TOKEN=stub-token \
    COMMIT_PROVENANCE_REPO=VilnaCRM-Org/crm \
    FAKE_GIT_AUTHOR='1+attacker[bot]@users.noreply.github.com' \
    sh "$script_path" base head
  [ "$status" -eq 0 ]
  assert_log_contains 'make lint-commit-message'
  ! grep -qF 'make lint-commit-bot-message' "$COMMAND_LOG"

  # Same forged address, and this time GitHub would confirm a bot — but with no token the
  # script cannot ask, so it must fail closed onto the strict contract rather than open.
  reset_command_log
  run env \
    PATH="$STUB_BIN_DIR:$PATH" \
    COMMAND_LOG="$COMMAND_LOG" \
    FAKE_GIT_REVISIONS='fff666' \
    FAKE_GIT_AUTHOR='1+attacker[bot]@users.noreply.github.com' \
    FAKE_GH_COMMIT_VERIFIED=true \
    FAKE_GH_COMMIT_AUTHOR_LOGIN='dependabot[bot]' \
    FAKE_GH_COMMIT_COMMITTER_LOGIN='web-flow' \
    sh "$script_path" base head
  [ "$status" -eq 0 ]
  assert_log_contains 'make lint-commit-message'
  ! grep -qF 'make lint-commit-bot-message' "$COMMAND_LOG"
}

@test "lint-commit-range.sh refuses a bot exemption signed under a borrowed author" {
  local script_path="$PROJECT_ROOT/scripts/ci/lint-commit-range.sh"

  # GitHub resolves the author from a contributor-controlled email, and the signature attests
  # the committer, not the author. A contributor holding a verified key can therefore author a
  # commit as a bot and still have GitHub report it verified. Only the committer identity says
  # GitHub wrote the commit object, so a verified bot author under a human committer must stay
  # on the strict contract.
  reset_command_log
  run env \
    PATH="$STUB_BIN_DIR:$PATH" \
    COMMAND_LOG="$COMMAND_LOG" \
    FAKE_GIT_REVISIONS='hhh888' \
    GH_TOKEN=stub-token \
    COMMIT_PROVENANCE_REPO=VilnaCRM-Org/crm \
    FAKE_GH_COMMIT_VERIFIED=true \
    FAKE_GH_COMMIT_AUTHOR_LOGIN='dependabot[bot]' \
    FAKE_GH_COMMIT_COMMITTER_LOGIN='attacker' \
    sh "$script_path" base head
  [ "$status" -eq 0 ]
  assert_log_contains 'make lint-commit-message'
  ! grep -qF 'make lint-commit-bot-message' "$COMMAND_LOG"

  # An unsigned or unverifiable commit buys nothing either, whoever it claims to be from.
  reset_command_log
  run env \
    PATH="$STUB_BIN_DIR:$PATH" \
    COMMAND_LOG="$COMMAND_LOG" \
    FAKE_GIT_REVISIONS='iii999' \
    GH_TOKEN=stub-token \
    COMMIT_PROVENANCE_REPO=VilnaCRM-Org/crm \
    FAKE_GH_COMMIT_VERIFIED=false \
    FAKE_GH_COMMIT_AUTHOR_LOGIN='dependabot[bot]' \
    FAKE_GH_COMMIT_COMMITTER_LOGIN='web-flow' \
    sh "$script_path" base head
  [ "$status" -eq 0 ]
  assert_log_contains 'make lint-commit-message'
  ! grep -qF 'make lint-commit-bot-message' "$COMMAND_LOG"

  # A GitHub App that commits as itself rather than through `web-flow` is still GitHub-written,
  # so that committer keeps the exemption the release and image bots depend on.
  reset_command_log
  run env \
    PATH="$STUB_BIN_DIR:$PATH" \
    COMMAND_LOG="$COMMAND_LOG" \
    FAKE_GIT_REVISIONS='jjj000' \
    GH_TOKEN=stub-token \
    COMMIT_PROVENANCE_REPO=VilnaCRM-Org/crm \
    FAKE_GH_COMMIT_VERIFIED=true \
    FAKE_GH_COMMIT_AUTHOR_LOGIN='github-actions[bot]' \
    FAKE_GH_COMMIT_COMMITTER_LOGIN='github-actions[bot]' \
    sh "$script_path" base head
  [ "$status" -eq 0 ]
  assert_log_contains 'make lint-commit-bot-message'
  assert_output_contains 'is a GitHub-verified commit by github-actions[bot]'
}

@test "lint-commit-range.sh grants no exemption when it asks the wrong endpoint" {
  # The gh fixture answers only `gh api repos/<repo>/commits/<sha>`, and this pins that contract
  # from the caller's side. A copy of the script that asks GitHub a different question must fall
  # back to the strict contract instead of inheriting the fixture's bot login -- otherwise an
  # endpoint regression would keep every exemption test green against a script that no longer
  # checks commit provenance at all.
  local regressed="$BATS_TEST_TMPDIR/lint-commit-range-wrong-endpoint.sh"

  sed 's#gh api "[^"]*"#gh api "user"#' \
    "$PROJECT_ROOT/scripts/ci/lint-commit-range.sh" > "$regressed"
  grep -qF 'gh api "user"' "$regressed"
  ! grep -qF 'commits/' "$regressed"

  reset_command_log
  run env \
    PATH="$STUB_BIN_DIR:$PATH" \
    COMMAND_LOG="$COMMAND_LOG" \
    FAKE_GIT_REVISIONS='ggg777' \
    GH_TOKEN=stub-token \
    COMMIT_PROVENANCE_REPO=VilnaCRM-Org/crm \
    FAKE_GH_COMMIT_VERIFIED=true \
    FAKE_GH_COMMIT_AUTHOR_LOGIN='dependabot[bot]' \
    FAKE_GH_COMMIT_COMMITTER_LOGIN='web-flow' \
    sh "$regressed" base head
  [ "$status" -eq 0 ]
  assert_log_contains 'gh api user'
  assert_log_contains 'make lint-commit-message'
  ! grep -qF 'make lint-commit-bot-message' "$COMMAND_LOG"
  ! printf '%s' "$output" | grep -qF 'is a GitHub-verified commit by'
}

@test "lint-commit-range.sh fails instead of passing an empty range vacuously" {
  local script_path="$PROJECT_ROOT/scripts/ci/lint-commit-range.sh"

  run env \
    PATH="$STUB_BIN_DIR:$PATH" \
    COMMAND_LOG="$COMMAND_LOG" \
    FAKE_GIT_REVISIONS='' \
    sh "$script_path" base head
  [ "$status" -eq 1 ]
  assert_output_contains 'contains no commits'
}
