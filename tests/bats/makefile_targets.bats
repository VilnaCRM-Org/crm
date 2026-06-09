#!/usr/bin/env bats

load './test_helper.bash'

setup() {
  setup_makefile_test_env
}

@test "help and alias targets expose the documented shell entrypoints" {
  run_make_target help
  [ "$status" -eq 0 ]
  assert_output_contains 'Usage:'
  assert_output_contains 'test-bats'

  run_make_target all
  [ "$status" -eq 0 ]
  assert_output_contains 'Usage:'

  reset_command_log
  run_make_target test
  [ "$status" -eq 0 ]
  assert_log_contains 'docker compose exec -T dev env TEST_ENV=client node ./node_modules/jest/bin/jest.js --maxWorkers=2 --logHeapUsage'
  assert_log_contains 'docker compose exec -T dev env TEST_ENV=server node ./node_modules/jest/bin/jest.js --maxWorkers=2 --logHeapUsage ./tests/apollo-server'
}

@test "orchestration and lifecycle targets delegate to the expected shell flows" {
  while IFS='|' read -r target expected_one expected_two; do
    [ -n "$target" ] || continue

    reset_command_log
    run_make_target "$target"
    [ "$status" -eq 0 ]
    [ -z "$expected_one" ] || assert_log_contains "$expected_one"
    [ -z "$expected_two" ] || assert_log_contains "$expected_two"
  done <<'EOF'
ci-setup|docker compose -f docker-compose.yml up -d --no-recreate dev mockoon|curl -fsS http://localhost:8080/api/users
ci-lint|run-parallel-lint.sh lint-eslint lint-tsc lint-md lint-metrics|
ci-test|run-parallel-tests.sh ci-test-unit-client ci-test-unit-server ci-test-integration|
ci-mutation|bun x stryker run|
ci-prod-setup|docker compose -f docker-compose.yml up -d dev|docker compose -f docker-compose.yml -f docker-compose.test.yml -f common-healthchecks.yml up -d --no-recreate prod mockoon playwright
ci-test-prod|docker compose -f docker-compose.test.yml exec playwright ./node_modules/.bin/playwright test ./tests/e2e|docker compose -f docker-compose.test.yml --profile load run --rm k6 run --summary-trend-stats=avg,min,med,max,p(95),p(99)
ci|run-parallel-lint.sh lint-eslint lint-tsc lint-md lint-metrics|run-parallel-tests.sh ci-test-unit-client ci-test-unit-server ci-test-integration
install|docker compose exec -T dev bun install --frozen-lockfile|bun x husky install
clean|docker compose -f docker-compose.yml down --volumes --remove-orphans --rmi local|docker compose -f docker-compose.test.yml down --volumes --remove-orphans --rmi local
start-prod-clean|docker compose -f docker-compose.yml -f docker-compose.test.yml -f common-healthchecks.yml up -d --force-recreate --build prod mockoon playwright|curl -fsS http://localhost:8080/api/users
wait-for-prod|bun x wait-on http://localhost:3001|
EOF

  run env \
    PATH="$STUB_BIN_DIR:$PATH" \
    COMMAND_LOG="$COMMAND_LOG" \
    FAKE_DOCKER_RUNNING_SERVICE=dev \
    make -C "$MAKEFILE_SANDBOX" ensure-dev BIN_DIR="$STUB_BIN_DIR"
  [ "$status" -eq 0 ]
  assert_output_contains 'Dev service is already running.'
}

@test "build, formatting, lint, and developer convenience targets shell out correctly" {
  reset_command_log
  run_make_target build
  [ "$status" -eq 0 ]
  assert_log_contains 'docker compose -f docker-compose.yml run --rm dev bun x rsbuild build'

  reset_command_log
  run_make_target build DIND=1
  [ "$status" -eq 0 ]
  assert_log_contains 'docker build -t crm-dev -f Dockerfile --target base .'

  while IFS='|' read -r target expected_one expected_two; do
    [ -n "$target" ] || continue

    reset_command_log
    run_make_target "$target"
    [ "$status" -eq 0 ]
    [ -z "$expected_one" ] || assert_log_contains "$expected_one"
    [ -z "$expected_two" ] || assert_log_contains "$expected_two"
  done <<'EOF'
build-analyze|docker compose -f docker-compose.yml run --rm -e ANALYZE=true dev bun x rsbuild build|
build-out|docker build -t rsbuild-bundle -f Dockerfile --target production .|docker cp fake-container-id:/app/dist ./out
format|bun x prettier **/*.{js,jsx,ts,tsx,mts,json,css,scss,md} --write --ignore-path .prettierignore|qlty fmt --all --trigger agent --no-progress
fmt-prettier|bun x prettier **/*.{js,jsx,ts,tsx,mts,json,css,scss,md} --write --ignore-path .prettierignore|
fmt-qlty|qlty fmt --all --trigger agent --no-progress|
lint-eslint|bun x eslint .|
lint-tsc|bun x tsc|
lint-md|bun x markdownlint -i CHANGELOG.md -i test-results/**/*.md -i playwright-report/data/**/*.md **/*.md|
lint-metrics-run|lint-metrics.sh RCA_BIN=./bin/rust-code-analysis-cli RCA_VERSION=0.0.25 RCA_SCOPE=src/ RCA_EXCLUDES=**/node_modules/** **/dist/** **/coverage/** **/.storybook/** **/tests/** METRICS_POLICY=config/metrics-policy.json|
husky|bun x husky install|
storybook-start|bun x storybook dev -p 6006 --host 0.0.0.0 --no-open|
storybook-build|bun x storybook build|
update|docker compose exec -T dev bun update|
check-node-version|docker compose exec -T dev node check-node-version.js|
pr-comments|get-pr-comments.sh 78 markdown|
down|docker compose down --remove-orphans|
sh|docker compose exec dev sh|
ps|docker compose ps|
logs|docker compose logs --follow dev|
new-logs|docker compose logs --tail=0 --follow dev|
logs-prod|docker compose -f docker-compose.test.yml logs --follow prod|
stop|docker compose stop|
EOF

  reset_command_log
  run_make_target pr-comments PR=78 FORMAT=markdown
  [ "$status" -eq 0 ]
  assert_log_contains 'get-pr-comments.sh 78 markdown'
}

@test "metrics, ui, and CI-side test targets keep their shell wrappers stable" {
  local summary_path="$MAKEFILE_SANDBOX/github-step-summary.md"

  run env \
    PATH="$STUB_BIN_DIR:$PATH" \
    COMMAND_LOG="$COMMAND_LOG" \
    GITHUB_STEP_SUMMARY="$summary_path" \
    make -C "$MAKEFILE_SANDBOX" lint-metrics BIN_DIR="$STUB_BIN_DIR"
  [ "$status" -eq 0 ]
  assert_log_contains "docker compose -f docker-compose.yml run --rm -e GITHUB_STEP_SUMMARY=$summary_path -v $summary_path:$summary_path rca make lint-metrics-run RCA_BIN=/usr/local/bin/rust-code-analysis-cli"

  while IFS='|' read -r target expected_one expected_two; do
    [ -n "$target" ] || continue

    reset_command_log
    run_make_target "$target"
    [ "$status" -eq 0 ]
    [ -z "$expected_one" ] || assert_log_contains "$expected_one"
    [ -z "$expected_two" ] || assert_log_contains "$expected_two"
  done <<'EOF'
test-e2e-ui|playwright test ./tests/e2e --ui-port=9324 --ui-host=0.0.0.0|
test-visual-ui|playwright test ./tests/visual --ui-port=9324 --ui-host=0.0.0.0|
test-visual-update|playwright test ./tests/visual --update-snapshots|
ci-test-unit-client|docker compose exec -T dev env TEST_ENV=client node ./node_modules/jest/bin/jest.js --maxWorkers=2 --logHeapUsage|
ci-test-unit-server|docker compose exec -T dev env TEST_ENV=server node ./node_modules/jest/bin/jest.js --maxWorkers=2 --logHeapUsage ./tests/apollo-server|
ci-test-integration|docker compose exec -T dev env TEST_ENV=integration node ./node_modules/jest/bin/jest.js --maxWorkers=2 --logHeapUsage|
ci-test-mutation|docker compose exec -T dev bun x stryker run|
ci-test-e2e|playwright test ./tests/e2e|
ci-test-visual|playwright test ./tests/visual|
ci-test-memory-leak|docker compose -f docker-compose.memory-leak.yml exec -T memory-leak node ./tests/memory-leak/run-memlab-tests.js|
ci-test-load|docker compose -f docker-compose.test.yml --profile load run --rm k6 run --summary-trend-stats=avg,min,med,max,p(95),p(99)|/loadTests/homepage.js
ci-test-lighthouse-desktop|docker compose exec -T dev bun x lhci autorun --config=./lighthouse/lighthouserc.desktop.js|
ci-test-lighthouse-mobile|docker compose exec -T dev bun x lhci autorun --config=./lighthouse/lighthouserc.mobile.js|
test-integration-watch|docker compose exec -T dev env TEST_ENV=integration node ./node_modules/jest/bin/jest.js --watch|
EOF
}

@test "container-backed helper targets fail fast when required names are missing" {
  while IFS='|' read -r target required_var; do
    [ -n "$target" ] || continue

    reset_command_log
    run_make_target "$target"
    [ "$status" -ne 0 ]
    assert_output_contains "$required_var is required"
  done <<'EOF'
create-temp-dev-container-dind|TEMP_CONTAINER_NAME
copy-source-to-container-dind|TEMP_CONTAINER_NAME
install-deps-in-container-dind|TEMP_CONTAINER_NAME
run-unit-tests-dind|TEMP_CONTAINER_NAME
run-integration-tests-dind|TEMP_CONTAINER_NAME
run-mutation-tests-dind|TEMP_CONTAINER_NAME
run-eslint-tests-dind|TEMP_CONTAINER_NAME
run-typescript-tests-dind|TEMP_CONTAINER_NAME
run-markdown-lint-tests-dind|TEMP_CONTAINER_NAME
create-k6-helper-container-dind|K6_HELPER_NAME
run-load-tests-dind|K6_HELPER_NAME
EOF
}

@test "DIND build and helper targets invoke the expected Docker commands" {
  while IFS='|' read -r invocation expected_one expected_two; do
    [ -n "$invocation" ] || continue

    target="${invocation%% *}"
    make_args="${invocation#"$target"}"
    reset_command_log

    if [ "$target" = "$invocation" ]; then
      run_make_target "$target"
    else
      # shellcheck disable=SC2086
      run_make_target "$target" $make_args
    fi

    [ "$status" -eq 0 ]
    [ -z "$expected_one" ] || assert_log_contains "$expected_one"
    [ -z "$expected_two" ] || assert_log_contains "$expected_two"
  done <<'EOF'
build-prod|docker compose -f docker-compose.test.yml build --no-cache prod|
build-k6|docker compose -f docker-compose.test.yml build k6|
install-chromium-lhci|docker compose -f docker-compose.test.yml exec -T --user root prod sh -c apk add --no-cache chromium|
test-chromium|docker compose -f docker-compose.test.yml exec -T prod sh -c chromium-browser --version|
memory-leak-dind|docker compose -f docker-compose.memory-leak.yml exec -T memory-leak node ./tests/memory-leak/run-memlab-tests.js|
lighthouse-desktop-dind|docker compose -f docker-compose.test.yml exec -T prod sh -lc cd /app && mkdir -p ./lighthouse && npm install --no-save --prefix ./lighthouse dotenv@16.4.5|CONFIG_PATH=./lighthouse/lighthouserc.desktop.js
lighthouse-mobile-dind|docker compose -f docker-compose.test.yml exec -T prod sh -lc cd /app && mkdir -p ./lighthouse && npm install --no-save --prefix ./lighthouse dotenv@16.4.5|CONFIG_PATH=./lighthouse/lighthouserc.mobile.js
patch-prod-mockoon-url|docker compose -f docker-compose.test.yml exec -T prod sh -lc|
create-temp-dev-container-dind TEMP_CONTAINER_NAME=crm-dev-test|docker run -d --name crm-dev-test --network crm-network -w /app crm-dev tail -f /dev/null|
copy-source-to-container-dind TEMP_CONTAINER_NAME=crm-dev-test|tar -cf -|docker exec -i crm-dev-test tar -xf - -C /app
install-deps-in-container-dind TEMP_CONTAINER_NAME=crm-dev-test|docker exec crm-dev-test bun install --frozen-lockfile|
run-unit-tests-dind TEMP_CONTAINER_NAME=crm-dev-test|docker exec crm-dev-test env TEST_ENV=client node ./node_modules/jest/bin/jest.js --maxWorkers=2 --logHeapUsage|docker exec crm-dev-test env TEST_ENV=server node ./node_modules/jest/bin/jest.js --maxWorkers=2 --logHeapUsage ./tests/apollo-server
run-integration-tests-dind TEMP_CONTAINER_NAME=crm-dev-test|docker exec crm-dev-test env TEST_ENV=integration node ./node_modules/jest/bin/jest.js --maxWorkers=2 --logHeapUsage|
run-mutation-tests-dind TEMP_CONTAINER_NAME=crm-dev-test|docker exec crm-dev-test bun x stryker run|
run-eslint-tests-dind TEMP_CONTAINER_NAME=crm-dev-test|docker exec crm-dev-test npx eslint .|
run-typescript-tests-dind TEMP_CONTAINER_NAME=crm-dev-test|docker exec crm-dev-test bun x tsc|
run-markdown-lint-tests-dind TEMP_CONTAINER_NAME=crm-dev-test|docker exec crm-dev-test bun x markdownlint -i CHANGELOG.md -i test-results/**/*.md -i playwright-report/data/**/*.md **/*.md|
create-k6-helper-container-dind K6_HELPER_NAME=crm-k6-helper|docker images -q crm-k6|docker run -d --name crm-k6-helper --network crm-network --entrypoint /bin/sh fake-image-id -c tail -f /dev/null
run-load-tests-dind K6_HELPER_NAME=crm-k6-helper|docker exec crm-k6-helper k6 run --summary-trend-stats=avg,min,med,max,p(95),p(99)|/loadTests/homepage.js
EOF
}
