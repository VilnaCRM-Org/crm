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
