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
    FAKE_GIT_AUTHOR='49699333+dependabot[bot]@users.noreply.github.com' \
    sh "$script_path" base head
  [ "$status" -eq 0 ]
  assert_log_contains 'make lint-commit-bot-message'
  assert_output_contains 'is authored by 49699333+dependabot[bot]@users.noreply.github.com'

  reset_command_log
  run env \
    PATH="$STUB_BIN_DIR:$PATH" \
    COMMAND_LOG="$COMMAND_LOG" \
    FAKE_GIT_REVISIONS='ddd444' \
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
