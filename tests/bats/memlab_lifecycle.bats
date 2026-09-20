#!/usr/bin/env bats

load './test_helper.bash'

setup() {
  setup_makefile_test_env
  cat > "$STUB_BIN_DIR/docker" << 'STUB'
#!/usr/bin/env bash
printf 'docker %s\n' "$*" >> "${COMMAND_LOG:?}"
for stage in up exec cp logs down; do
  case " $* " in
    *" $stage "*)
      if [ "$stage" = exec ]; then printf 'scenario output\n'; fi
      if [ "$stage" = "${FAIL_STAGE:-}" ]; then exit 37; fi
      if [ "$stage" = cp ] && [ "${FAIL_REPORT:-}" = 1 ]; then exit 45; fi
      if [ "$stage" = down ] && [ "${FAIL_CLEANUP:-}" = 1 ]; then exit 19; fi
      break
      ;;
  esac
done
exit 0
STUB
  chmod +x "$STUB_BIN_DIR/docker"
}

assert_collection_before_cleanup() {
  local phases count
  phases=$(
    awk '{for (i=1; i<=NF; i++) if ($i ~ /^(up|exec|cp|logs|down)$/) print $i}' "$COMMAND_LOG"
  )
  [[ "$phases" == *$'cp\nlogs\ndown' ]]
  count=$(grep -c 'docker compose -p memleak -f docker-compose.memory-leak.yml' "$COMMAND_LOG")
  [ "$count" -ge 4 ]
  ! grep 'docker compose -f docker-compose.memory-leak.yml' "$COMMAND_LOG"
}

@test "memory target saves live runner output and reports before dedicated teardown" {
  run_make_target memory-leak-dind
  [ "$status" -eq 0 ]
  assert_collection_before_cleanup
  grep -q 'scenario output' "$MAKEFILE_SANDBOX/memory-leak-logs/test-execution.log"
  assert_log_contains 'memory-leak:/app/./tests/memory-leak/results/.'
}

@test "memory target retains runner failure despite report and cleanup failures" {
  FAIL_STAGE=exec FAIL_REPORT=1 FAIL_CLEANUP=1 run_make_target memory-leak-dind
  [ "$status" -eq 2 ]
  assert_output_contains 'Error 37'
  assert_collection_before_cleanup
  grep -q 'scenario output' "$MAKEFILE_SANDBOX/memory-leak-logs/test-execution.log"
}

@test "memory target tears down a partially started stack without running tests" {
  FAIL_STAGE=up run_make_target memory-leak-dind
  [ "$status" -eq 2 ]
  assert_output_contains 'Error 37'
  assert_collection_before_cleanup
  run grep ' exec ' "$COMMAND_LOG"
  [ "$status" -eq 1 ]
}

@test "memory target still tears down when report collection fails" {
  FAIL_REPORT=1 run_make_target memory-leak-dind
  [ "$status" -eq 0 ]
  assert_collection_before_cleanup
}

@test "memory target exposes teardown failure after successful tests" {
  FAIL_CLEANUP=1 run_make_target memory-leak-dind
  [ "$status" -eq 2 ]
  assert_output_contains 'Error 19'
  assert_collection_before_cleanup
}

@test "memory target preserves the runner error when writing its log also fails" {
  cat > "$STUB_BIN_DIR/tee" << 'STUB'
#!/usr/bin/env bash
cat >/dev/null
exit 49
STUB
  chmod +x "$STUB_BIN_DIR/tee"
  FAIL_STAGE='exec' run_make_target memory-leak-dind
  [ "$status" -eq 2 ]
  assert_output_contains 'Error 37'
  assert_collection_before_cleanup
}

@test "AWS memory wrapper stops on each prerequisite failure and cleans the app stack" {
  setup_ci_script_test_env
  local target
  for target in build-prod start-prod patch-prod-mockoon-url memory-leak-dind; do
    reset_command_log
    FAKE_MAKE_FAIL_TARGET="$target" run_ci_script \
      "$PROJECT_ROOT/scripts/ci/batch_lhci_leak.sh" test-memory-leak
    [ "$status" -eq 1 ]
    assert_log_contains 'docker compose -f docker-compose.yml -f docker-compose.test.yml -f common-healthchecks.yml down --volumes --remove-orphans'
    run grep 'docker compose -p memleak' "$COMMAND_LOG"
    [ "$status" -eq 1 ]
    if [ "$target" != memory-leak-dind ]; then
      run grep 'make memory-leak-dind' "$COMMAND_LOG"
      [ "$status" -eq 1 ]
    fi
  done
}

@test "AWS memory wrapper defaults to software rendering and preserves an explicit override" {
  setup_ci_script_test_env
  cat > "$STUB_BIN_DIR/make" <<'STUB'
#!/usr/bin/env bash
printf 'gpu:%s:%s\n' "${MEMLAB_DISABLE_GPU:-unset}" "$*" >> "$COMMAND_LOG"
STUB
  chmod +x "$STUB_BIN_DIR/make"
  unset MEMLAB_DISABLE_GPU
  run_ci_script "$PROJECT_ROOT/scripts/ci/batch_lhci_leak.sh" test-memory-leak
  [ "$status" -eq 0 ]
  assert_log_contains 'gpu:1:memory-leak-dind'

  reset_command_log
  MEMLAB_DISABLE_GPU=0 run_ci_script "$PROJECT_ROOT/scripts/ci/batch_lhci_leak.sh" test-memory-leak
  [ "$status" -eq 0 ]
  assert_log_contains 'gpu:0:memory-leak-dind'
}
