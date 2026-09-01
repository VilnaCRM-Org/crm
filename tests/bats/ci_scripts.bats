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
