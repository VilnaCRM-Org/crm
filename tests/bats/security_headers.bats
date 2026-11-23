#!/usr/bin/env bats

# Browser security-header gate (issue #113): the three Makefile targets that own it, and the
# shell runner that boots the deployable image twice and asserts the baseline on both starts.

bats_require_minimum_version 1.5.0

load './test_helper.bash'

RUNNER_SOURCE=''

setup() {
  setup_makefile_test_env
  RUNNER_SOURCE="$PROJECT_ROOT/scripts/ci/check-security-headers.sh"
}

# The runner shells out to docker, curl and node; the stubs record every invocation and let a
# test choose which one fails. FAKE_GATE_FAIL_ON_RUN makes the Nth `node` gate call exit 1.
create_runner_stubs() {
  cat > "$STUB_BIN_DIR/node" <<'EOF'
#!/usr/bin/env bash
printf 'node %s\n' "$*" >> "${COMMAND_LOG:?}"
count_file="${COMMAND_LOG}.gate-calls"
count=$(( $(cat "$count_file" 2>/dev/null || printf '0') + 1 ))
printf '%s' "$count" > "$count_file"
if [ "${FAKE_GATE_FAIL_ON_RUN:-0}" = "$count" ]; then
  printf 'check-security-headers: 1 finding(s)\n' >&2
  exit 1
fi
exit 0
EOF
  chmod +x "$STUB_BIN_DIR/node"
  create_curl_stub
  create_docker_stub
  rm -f "$COMMAND_LOG.gate-calls"
}

run_runner() {
  run env \
    PATH="$STUB_BIN_DIR:$PATH" \
    COMMAND_LOG="$COMMAND_LOG" \
    SECURITY_HEADERS_PROBE_IMAGE=crm-security-headers-probe \
    SECURITY_HEADERS_PROBE_PORT=3011 \
    SECURITY_HEADERS_GATE_SCRIPT=scripts/ci/check-security-headers.mjs \
    SECURITY_HEADERS_READY_ATTEMPTS=1 \
    "$@" \
    sh "$RUNNER_SOURCE"
}

@test "lint-security-headers checks serve.json against the policy inside the dev container" {
  run_make_target lint-security-headers
  [ "$status" -eq 0 ]
  assert_log_contains 'docker compose exec -T dev node scripts/generate-serve-config.js --check'
}

@test "security-headers-generate regenerates serve.json inside the dev container" {
  run_make_target security-headers-generate
  [ "$status" -eq 0 ]
  assert_log_contains 'docker compose exec -T dev node scripts/generate-serve-config.js'
  run grep -F -- '--check' "$COMMAND_LOG"
  [ "$status" -ne 0 ]
}

@test "check-security-headers builds the deployable target, then hands the image to the runner" {
  run_make_target check-security-headers
  [ "$status" -eq 0 ]
  assert_log_contains 'docker build -t crm-security-headers-probe -f Dockerfile --target production .'
  assert_log_contains 'check-security-headers.sh SECURITY_HEADERS_PROBE_IMAGE=crm-security-headers-probe SECURITY_HEADERS_PROBE_PORT=3011 SECURITY_HEADERS_GATE_SCRIPT=scripts/ci/check-security-headers.mjs'
  run grep -F -- 'test-harness' "$COMMAND_LOG"
  [ "$status" -ne 0 ]
}

@test "lint aggregate and CI_LINT_TARGETS both carry lint-security-headers" {
  run grep -E '^lint:.* lint-security-headers( |$| ##)' "$MAKEFILE_SANDBOX/Makefile"
  [ "$status" -eq 0 ]
  run grep -E '^CI_LINT_TARGETS.* lint-security-headers( |$)' "$MAKEFILE_SANDBOX/Makefile"
  [ "$status" -eq 0 ]
}

@test "the runner boots the image twice: the committed baseline, then the runtime API overrides" {
  create_runner_stubs
  run_runner
  [ "$status" -eq 0 ]

  assert_log_contains 'docker run -d --name crm-security-headers-probe -p 127.0.0.1:3011:3001 crm-security-headers-probe'
  assert_log_contains 'node scripts/ci/check-security-headers.mjs --url http://127.0.0.1:3011'
  assert_log_contains 'docker run -d --name crm-security-headers-probe -p 127.0.0.1:3011:3001 -e APP_CONFIG_API_BASE_URL=https://api.security-headers-probe.example/api -e APP_CONFIG_GRAPHQL_URL=https://graphql.security-headers-probe.example/graphql crm-security-headers-probe'
  assert_log_contains 'node scripts/ci/check-security-headers.mjs --url http://127.0.0.1:3011 --expect-connect https://api.security-headers-probe.example --expect-connect https://graphql.security-headers-probe.example'
  assert_log_contains 'curl -fsS http://127.0.0.1:3011/'

  run grep -c -- 'docker rm -f crm-security-headers-probe' "$COMMAND_LOG"
  [ "$output" -ge 3 ]
}

@test "the runner fails when the committed baseline is rejected and never starts the override run" {
  create_runner_stubs
  run_runner FAKE_GATE_FAIL_ON_RUN=1
  [ "$status" -ne 0 ]

  run grep -c -- 'docker run -d' "$COMMAND_LOG"
  [ "$output" -eq 1 ]
  run grep -F -- '--expect-connect' "$COMMAND_LOG"
  [ "$status" -ne 0 ]
  assert_log_contains 'docker rm -f crm-security-headers-probe'
}

@test "the runner fails when the runtime overrides never reach connect-src" {
  create_runner_stubs
  run_runner FAKE_GATE_FAIL_ON_RUN=2
  [ "$status" -ne 0 ]

  run grep -c -- 'docker run -d' "$COMMAND_LOG"
  [ "$output" -eq 2 ]
  assert_log_contains 'docker rm -f crm-security-headers-probe'
}

@test "the runner fails closed when the image never answers" {
  create_runner_stubs
  cat > "$STUB_BIN_DIR/curl" <<'EOF'
#!/usr/bin/env bash
printf 'curl %s\n' "$*" >> "${COMMAND_LOG:?}"
exit 7
EOF
  chmod +x "$STUB_BIN_DIR/curl"

  run_runner
  [ "$status" -ne 0 ]
  [[ "$output" == *"did not answer on http://127.0.0.1:3011"* ]]
  run grep -F -- 'node scripts/ci/check-security-headers.mjs' "$COMMAND_LOG"
  [ "$status" -ne 0 ]
  assert_log_contains 'docker logs crm-security-headers-probe'
}

@test "the runner refuses to start without an image name" {
  create_runner_stubs
  run env PATH="$STUB_BIN_DIR:$PATH" COMMAND_LOG="$COMMAND_LOG" sh "$RUNNER_SOURCE"
  [ "$status" -ne 0 ]
  [[ "$output" == *"SECURITY_HEADERS_PROBE_IMAGE is required"* ]]
}
