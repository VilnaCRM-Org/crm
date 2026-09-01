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
ci-lint|run-parallel-lint.sh check-env-sync lint-eslint lint-tsc lint-md lint-deps lint-dup lint-metrics lint-prettier lint-shell lint-actionlint lint-compose lint-lockfile lint-licenses|
ci-test|run-parallel-tests.sh ci-test-unit-client ci-test-unit-server ci-test-integration|
ci-mutation|bun x stryker run|
ci-prod-setup|docker compose -f docker-compose.yml up -d dev|docker compose -f docker-compose.yml -f docker-compose.test.yml -f common-healthchecks.yml up -d --no-recreate prod mockoon playwright
ci-test-prod|docker compose -f docker-compose.test.yml exec playwright ./node_modules/.bin/playwright test ./tests/e2e|docker compose -f docker-compose.test.yml --profile load run --rm k6 run --summary-trend-stats=avg,min,med,max,p(95),p(99)
ci|run-parallel-lint.sh check-env-sync lint-eslint lint-tsc lint-md lint-deps lint-dup lint-metrics lint-prettier lint-shell lint-actionlint lint-compose lint-lockfile lint-licenses|run-parallel-tests.sh ci-test-unit-client ci-test-unit-server ci-test-integration
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

  while IFS='|' read -r target expected_commands; do
    [ -n "$target" ] || continue

    reset_command_log
    run_make_target "$target"
    [ "$status" -eq 0 ]
    local expected remaining="$expected_commands"
    while [ -n "$remaining" ]; do
      expected="${remaining%%|*}"
      if [ "$remaining" = "$expected" ]; then
        remaining=""
      else
        remaining="${remaining#*|}"
      fi
      [ -z "$expected" ] || assert_log_contains "$expected"
    done
  done <<'EOF'
build-analyze|docker compose -f docker-compose.yml run --rm -e ANALYZE=true dev bun x rsbuild build|
perf-budget|docker compose -f docker-compose.yml run --rm dev sh -c bun x rsbuild build && node scripts/bundle-size-report.mjs --dir dist|
check-auth-seed-gate|docker build -t crm-auth-seed-probe -f Dockerfile --target production .|dev node scripts/ci/check-auth-seed-gate.mjs --dir ./dist-auth-seed-probe --expect absent --token auth-seed-gate-probe-token
build-out|docker build -t rsbuild-bundle -f Dockerfile --target production .|docker cp fake-container-id:/app/dist ./out
format|bun x prettier **/*.{js,jsx,ts,tsx,mts,mjs,json,css,scss,md,yml,yaml} --write --ignore-path .prettierignore|qlty fmt --all --trigger agent --no-progress
fmt-prettier|bun x prettier **/*.{js,jsx,ts,tsx,mts,mjs,json,css,scss,md,yml,yaml} --write --ignore-path .prettierignore|
fmt-qlty|qlty fmt --all --trigger agent --no-progress|
lint-eslint|bun x eslint .|
lint-tsc|bun x tsc|
lint-md|bun x markdownlint -i CHANGELOG.md -i test-results/**/*.md -i playwright-report/data/**/*.md **/*.md|
lint-dup|bun x jscpd|
lint-zizmor|ghcr.io/zizmorcore/zizmor:1.28.0@sha256:8e6b3e4fb74d1aa5d23e83ea369f386c66eced0d1fb944d32cd8b2aac100b00d --no-online-audits --min-severity medium --persona pedantic --format plain .github/workflows/|
lint-compose|docker compose -f docker-compose.yml config -q|docker compose -f docker-compose.test.yml config -q|docker compose -f docker-compose.yml -f docker-compose.test.yml -f common-healthchecks.yml config -q|docker compose -f docker-compose.memory-leak.yml config -q
check-env-sync|check-env-sync.sh|
lint-metrics-run|lint-metrics.sh RCA_BIN=./bin/rust-code-analysis-cli RCA_VERSION=0.0.25 RCA_SCOPE=src/ RCA_EXCLUDES=**/node_modules/** **/dist/** **/coverage/** **/.storybook/** **/tests/** **/api/generated/** METRICS_POLICY=config/metrics-policy.json|
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

  # lint-compose is the duplicate-mapping-key gate (issue #161): prettier accepts duplicate
  # keys, compose's own loader rejects them. It only covers the surface it actually validates,
  # so every combination the repo starts must stay in the recipe — assert all four, not a pair.
  reset_command_log
  run_make_target lint-compose
  [ "$status" -eq 0 ]
  assert_log_contains 'docker compose -f docker-compose.yml config -q'
  assert_log_contains 'docker compose -f docker-compose.test.yml config -q'
  assert_log_contains 'docker compose -f docker-compose.yml -f docker-compose.test.yml -f common-healthchecks.yml config -q'
  assert_log_contains 'docker compose -f docker-compose.memory-leak.yml config -q'
}

@test "commit contract targets lint the header and the range with their own configs" {
  reset_command_log
  run_make_target lint-commit-message
  [ "$status" -eq 0 ]
  assert_log_contains 'bun x commitlint --verbose --config commitlint.config.js'

  reset_command_log
  run_make_target lint-commit-bot-message
  [ "$status" -eq 0 ]
  assert_log_contains 'bun x commitlint --verbose --config commitlint.bot.config.js'

  reset_command_log
  run_make_target lint-commit-range COMMIT_RANGE_FROM=abc123 COMMIT_RANGE_TO=def456
  [ "$status" -eq 0 ]
  assert_log_contains 'lint-commit-range.sh abc123 def456'
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

@test "the flake audit injects its toggles into the Playwright container (issue #186)" {
  # The table is read on fd 3: run_make_target inherits stdin, so a stub that consumed it
  # would starve the loop and the test would pass after checking only the first row.
  while IFS='|' read -r target expected_one expected_two <&3; do
    [ -n "$target" ] || continue

    reset_command_log
    run_make_target "$target"
    [ "$status" -eq 0 ]
    assert_log_contains "$expected_one"
    [ -z "$expected_two" ] || assert_log_contains "$expected_two"
  done 3<<'EOF'
test-e2e-flake-audit|-e PLAYWRIGHT_JSON_REPORT=reports/playwright/report.json -e PLAYWRIGHT_HTML_REPORT=reports/playwright/html -e PLAYWRIGHT_OUTPUT_DIR=reports/playwright/output -e PLAYWRIGHT_FLAKE_RETRIES=2 -e PLAYWRIGHT_FAIL_ON_FLAKY=1 playwright|playwright test ./tests/e2e
test-visual-flake-audit|-e PLAYWRIGHT_JSON_REPORT=reports/playwright/report.json -e PLAYWRIGHT_HTML_REPORT=reports/playwright/html -e PLAYWRIGHT_OUTPUT_DIR=reports/playwright/output -e PLAYWRIGHT_FLAKE_RETRIES=2 -e PLAYWRIGHT_FAIL_ON_FLAKY=1 playwright|playwright test ./tests/visual
print-flake-env|-e PLAYWRIGHT_FLAKE_RETRIES=2 -e PLAYWRIGHT_FAIL_ON_FLAKY=1 playwright|flake audit env: retries=%s
EOF
}

# Each suite needs its own html/output destination: Playwright clears both at the start of a
# run, so a shared folder would delete the e2e evidence when the visual suite starts.
@test "the flake audit gives each suite its own report and trace destination" {
  reset_command_log
  run_make_target test-e2e-flake-audit \
    PLAYWRIGHT_HTML_REPORT=reports/playwright/e2e-html \
    PLAYWRIGHT_OUTPUT_DIR=reports/playwright/e2e-output
  [ "$status" -eq 0 ]
  assert_log_contains '-e PLAYWRIGHT_HTML_REPORT=reports/playwright/e2e-html'
  assert_log_contains '-e PLAYWRIGHT_OUTPUT_DIR=reports/playwright/e2e-output'
}

@test "the required PR Playwright lanes never see the flake toggles" {
  for target in ci-test-e2e ci-test-visual; do
    reset_command_log
    run_make_target "$target"
    [ "$status" -eq 0 ]

    run grep -c 'PLAYWRIGHT_FAIL_ON_FLAKY' "$COMMAND_LOG"
    [ "$output" -eq 0 ]
  done
}

@test "the contract, drift, route-coverage and flake gates dispatch to their scripts" {
  while IFS='|' read -r target expected_one expected_two <&3; do
    [ -n "$target" ] || continue

    reset_command_log
    run_make_target "$target"
    [ "$status" -eq 0 ]
    assert_log_contains "$expected_one"
    [ -z "$expected_two" ] || assert_log_contains "$expected_two"
  done 3<<'EOF'
contract-diff|contract-diff.sh|
check-contract-drift|check-contract-drift.sh|
check-e2e-route-coverage|node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/ci/check-e2e-route-coverage.ts|
check-flakes|node scripts/ci/check-flakes.ts|
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

@test "dev-mode Playwright targets run inside the dev container with PLAYWRIGHT_DEV_MODE" {
  # Full suite: reuses the running dev container and injects the dev-mode flag in-container.
  run env \
    PATH="$STUB_BIN_DIR:$PATH" \
    COMMAND_LOG="$COMMAND_LOG" \
    FAKE_DOCKER_RUNNING_SERVICE=dev \
    make -C "$MAKEFILE_SANDBOX" test-e2e ENV=dev BIN_DIR="$STUB_BIN_DIR"
  [ "$status" -eq 0 ]
  assert_log_contains 'compose exec -T dev env PLAYWRIGHT_DEV_MODE=1 bun x playwright test ./tests/e2e'
  # Dev-server and mockoon readiness are gated as preconditions (the reuse path too);
  # the require-playwright-browsers preflight also runs ahead of the Playwright invocation.
  assert_log_contains 'curl -fsS http://localhost:3000'
  assert_log_contains 'curl -fsS http://localhost:8080/api/users'

  # FILE= scopes to a single spec; the test dir is not also passed, so the run is not broadened.
  reset_command_log
  run env \
    PATH="$STUB_BIN_DIR:$PATH" \
    COMMAND_LOG="$COMMAND_LOG" \
    FAKE_DOCKER_RUNNING_SERVICE=dev \
    make -C "$MAKEFILE_SANDBOX" test-e2e ENV=dev FILE=tests/e2e/modules/back-to-main.spec.ts BIN_DIR="$STUB_BIN_DIR"
  [ "$status" -eq 0 ]
  assert_log_contains 'compose exec -T dev env PLAYWRIGHT_DEV_MODE=1 bun x playwright test tests/e2e/modules/back-to-main.spec.ts'

  # Visual smoke run targets the visual directory through the same dev-mode wrapper.
  reset_command_log
  run env \
    PATH="$STUB_BIN_DIR:$PATH" \
    COMMAND_LOG="$COMMAND_LOG" \
    FAKE_DOCKER_RUNNING_SERVICE=dev \
    make -C "$MAKEFILE_SANDBOX" test-visual ENV=dev BIN_DIR="$STUB_BIN_DIR"
  [ "$status" -eq 0 ]
  assert_log_contains 'compose exec -T dev env PLAYWRIGHT_DEV_MODE=1 bun x playwright test ./tests/visual'

  # Browser provisioning installs the system Chromium via apk (Alpine-compatible).
  reset_command_log
  run env \
    PATH="$STUB_BIN_DIR:$PATH" \
    COMMAND_LOG="$COMMAND_LOG" \
    FAKE_DOCKER_RUNNING_SERVICE=dev \
    make -C "$MAKEFILE_SANDBOX" ensure-playwright-browsers BIN_DIR="$STUB_BIN_DIR"
  [ "$status" -eq 0 ]
  assert_log_contains 'apk add --no-cache chromium=136.0.7103.113-r0'
}

@test "test-e2e ENV=dev DEBUG=1 requires FILE and allocates a TTY" {
  # Missing FILE fails fast with remediation before invoking Playwright.
  run env \
    PATH="$STUB_BIN_DIR:$PATH" \
    COMMAND_LOG="$COMMAND_LOG" \
    FAKE_DOCKER_RUNNING_SERVICE=dev \
    make -C "$MAKEFILE_SANDBOX" test-e2e ENV=dev DEBUG=1 BIN_DIR="$STUB_BIN_DIR"
  [ "$status" -ne 0 ]
  assert_output_contains 'FILE= is required'

  # With FILE set it debugs a single spec via a TTY-capable exec (no -T) under --debug.
  reset_command_log
  run env \
    PATH="$STUB_BIN_DIR:$PATH" \
    COMMAND_LOG="$COMMAND_LOG" \
    FAKE_DOCKER_RUNNING_SERVICE=dev \
    make -C "$MAKEFILE_SANDBOX" test-e2e ENV=dev DEBUG=1 FILE=tests/e2e/modules/back-to-main.spec.ts BIN_DIR="$STUB_BIN_DIR"
  [ "$status" -eq 0 ]
  assert_log_contains 'compose exec dev env PLAYWRIGHT_DEV_MODE=1 PLAYWRIGHT_TRACE_PORT=9323 bun x playwright test tests/e2e/modules/back-to-main.spec.ts --debug'
}

@test "start-dev builds and starts only the dev service" {
  reset_command_log
  run_make_target start-dev
  [ "$status" -eq 0 ]
  assert_log_contains 'docker compose -f docker-compose.yml up -d --build dev'
}

@test "test-mutation-shard runs the shard config in the dev container with shard env vars" {
  reset_command_log
  run_make_target test-mutation-shard MUTATION_SHARD_INDEX=2 MUTATION_SHARD_TOTAL=4
  [ "$status" -eq 0 ]
  assert_log_contains 'docker compose exec -T -e MUTATION_SHARD_INDEX=2 -e MUTATION_SHARD_TOTAL=4 dev bun x stryker run stryker.shard.config.mjs'
}

@test "merge-mutation-reports merges shard reports and enforces the gate in the dev container" {
  reset_command_log
  run_make_target merge-mutation-reports MUTATION_SHARD_TOTAL=4
  [ "$status" -eq 0 ]
  assert_log_contains 'docker compose exec -T -e MUTATION_SHARD_TOTAL=4 dev bun scripts/ci/merge-mutation-reports.ts'
}

@test "test-mutation-shard appends --incremental when MUTATION_INCREMENTAL=1" {
  reset_command_log
  run_make_target test-mutation-shard MUTATION_SHARD_INDEX=1 MUTATION_SHARD_TOTAL=4 MUTATION_INCREMENTAL=1
  [ "$status" -eq 0 ]
  assert_log_contains 'dev bun x stryker run stryker.shard.config.mjs --incremental'
}

@test "scaffolding targets drive plop and the self-verification gate (issue #108)" {
  reset_command_log
  run_make_target new-module name=orders feature=order-list owner=@octocat
  [ "$status" -eq 0 ]
  assert_log_contains 'docker compose exec -T dev bun x plop module orders order-list @octocat'

  reset_command_log
  run_make_target new-feature module=orders feature=order-detail
  [ "$status" -eq 0 ]
  assert_log_contains 'docker compose exec -T dev bun x plop feature orders order-detail'

  # This only proves the recipe forwards the variable; whether the list is complete is the
  # separate test below, which derives its expectation from an independent source.
  local forwarded
  forwarded=$(grep -E '^SCAFFOLD_VERIFY_TARGETS[[:space:]]*\?=' "$MAKEFILE_SANDBOX/Makefile" |
    sed 's/^[^=]*=[[:space:]]*//')
  [ -n "$forwarded" ]

  reset_command_log
  run_make_target verify-scaffold
  [ "$status" -eq 0 ]
  assert_log_contains "verify-scaffold.sh SCAFFOLD_VERIFY_TARGETS=$forwarded"
}

@test "SCAFFOLD_VERIFY_TARGETS runs every lint gate that reads generated source (issue #108)" {
  # Derived from the `lint:` prerequisites, NOT from the SCAFFOLD_VERIFY_TARGETS line itself:
  # re-deriving from the line under test cannot detect a gate being dropped from it, because
  # the expectation would shrink with it. The exclusions are the six gates that never read
  # src/ or tests/ — env parity, shell scripts, workflow YAML, compose files, the lockfile,
  # and the licenses of the production dependency tree — so adding a new lint gate fails this
  # test until it is classified one way or the other.
  local makefile="$MAKEFILE_SANDBOX/Makefile"
  local excluded=" check-env-sync lint-shell lint-actionlint lint-compose lint-lockfile lint-licenses "

  local lint_prereqs scaffold_targets expected actual target
  lint_prereqs=$(grep -E '^lint:[[:space:]]' "$makefile" | sed 's/^lint:[[:space:]]*//; s/[[:space:]]*##.*//')
  scaffold_targets=$(grep -E '^SCAFFOLD_VERIFY_TARGETS[[:space:]]*\?=' "$makefile" |
    sed 's/^[^=]*=[[:space:]]*//')

  [ -n "$lint_prereqs" ]
  [ -n "$scaffold_targets" ]

  expected=""
  for target in $lint_prereqs; do
    case "$excluded" in
      *" $target "*) continue ;;
    esac
    expected="$expected$target"$'\n'
  done
  expected=$(printf '%s' "$expected" | sort)
  actual=$(printf '%s\n' $scaffold_targets | sort)

  [ "$expected" = "$actual" ]
}

@test "new-module reuses the module name when no feature name is given (issue #108)" {
  reset_command_log
  run_make_target new-module name=orders owner=@octocat
  [ "$status" -eq 0 ]
  assert_log_contains 'bun x plop module orders orders @octocat'
}

@test "scaffolding targets fail fast when a required name is missing (issue #108)" {
  reset_command_log
  run_make_target new-module
  [ "$status" -ne 0 ]
  assert_output_contains 'name= is required'

  reset_command_log
  run_make_target new-feature module=orders
  [ "$status" -ne 0 ]
  assert_output_contains 'feature= is required'

  reset_command_log
  run_make_target new-feature feature=order-detail
  [ "$status" -ne 0 ]
  assert_output_contains 'module= is required'
}

@test "CI_LINT_TARGETS mirrors the lint prerequisite set exactly (issue #182)" {
  # The local CI mirror (make ci / make ci-lint) must run the same lint gates as
  # CI's `make lint`, so a green local run implies a green `static testing` run.
  # Bidirectional: the mirror can neither drop a CI gate nor accrue targets CI omits.
  local makefile="$MAKEFILE_SANDBOX/Makefile"

  local lint_prereqs ci_targets
  lint_prereqs=$(grep -E '^lint:[[:space:]]' "$makefile" | sed 's/^lint:[[:space:]]*//; s/[[:space:]]*##.*//')
  ci_targets=$(grep -E '^CI_LINT_TARGETS[[:space:]]*=' "$makefile" | sed 's/^[^=]*=[[:space:]]*//')

  [ -n "$lint_prereqs" ]
  [ -n "$ci_targets" ]

  # every `lint:` prerequisite must appear in CI_LINT_TARGETS
  local t
  for t in $lint_prereqs; do
    if ! printf '%s\n' $ci_targets | grep -qxF -- "$t"; then
      echo "lint: prerequisite '$t' is missing from CI_LINT_TARGETS" >&2
      return 1
    fi
  done

  # every CI_LINT_TARGETS entry must be a `lint:` prerequisite
  for t in $ci_targets; do
    if ! printf '%s\n' $lint_prereqs | grep -qxF -- "$t"; then
      echo "CI_LINT_TARGETS entry '$t' is not a lint: prerequisite" >&2
      return 1
    fi
  done
}
