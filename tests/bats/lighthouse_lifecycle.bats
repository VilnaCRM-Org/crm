#!/usr/bin/env bats

load './test_helper.bash'

setup() {
  setup_ci_script_test_env

  cat > "$STUB_BIN_DIR/make" <<'STUB'
#!/usr/bin/env bash
printf 'make %s\n' "$*" >> "${COMMAND_LOG:?}"
target=""
for arg in "$@"; do
  case "$arg" in
    -*|*=*) ;;
    *) target="$arg"; break ;;
  esac
done
if [ "$target" = "${FAKE_MAKE_FAIL_TARGET:-}" ]; then
  printf 'forced make failure: %s\n' "$target" >&2
  exit 37
fi
exit 0
STUB
  chmod +x "$STUB_BIN_DIR/make"

  cat > "$STUB_BIN_DIR/docker" <<'STUB'
#!/usr/bin/env bash
printf 'docker %s\n' "$*" >> "${COMMAND_LOG:?}"
case " $* " in
  *" cp prod:/app/lhci-reports-"*)
    if [ "${FAIL_REPORT_COPY:-0}" = 1 ]; then
      printf 'forced report-copy failure\n' >&2
      exit 45
    fi
    ;;
esac
exit 0
STUB
  chmod +x "$STUB_BIN_DIR/docker"
}

assert_lighthouse_cleanup_ran() {
  assert_log_contains 'docker compose -f common-healthchecks.yml -f docker-compose.test.yml down --volumes --remove-orphans'
  assert_log_contains 'docker network rm crm-network'
}

@test "Lighthouse wrappers stop on build, install, and audit failures and still clean up" {
  local mode audit_target failure_target
  for mode in desktop mobile; do
    audit_target="lighthouse-${mode}-dind"
    for failure_target in build-prod install-chromium-lhci "$audit_target"; do
      reset_command_log
      FAKE_MAKE_FAIL_TARGET="$failure_target" run_ci_script \
        "$PROJECT_ROOT/scripts/ci/batch_lhci_leak.sh" "test-lighthouse-${mode}"

      [ "$status" -eq 37 ]
      assert_output_contains "forced make failure: $failure_target"
      assert_lighthouse_cleanup_ran
      [ -d "$SCRIPT_SANDBOX/lhci-reports-$mode" ]
      run grep -F "make $audit_target" "$COMMAND_LOG"
      if [ "$failure_target" = "$audit_target" ]; then
        [ "$status" -eq 0 ]
      else
        [ "$status" -eq 1 ]
      fi
      if [ "$failure_target" = "build-prod" ]; then
        run grep -F 'make install-chromium-lhci' "$COMMAND_LOG"
        [ "$status" -eq 1 ]
      fi
      if [ "$failure_target" = "install-chromium-lhci" ]; then
        run grep -F "make $audit_target" "$COMMAND_LOG"
        [ "$status" -eq 1 ]
      fi
    done
  done
}

@test "Lighthouse report collection is best-effort and cannot mask audit failure" {
  local mode audit_target
  for mode in desktop mobile; do
    audit_target="lighthouse-${mode}-dind"
    reset_command_log
    FAKE_MAKE_FAIL_TARGET="$audit_target" FAIL_REPORT_COPY=1 run_ci_script \
      "$PROJECT_ROOT/scripts/ci/batch_lhci_leak.sh" "test-lighthouse-${mode}"

    [ "$status" -eq 37 ]
    assert_output_contains "forced make failure: $audit_target"
    [ -d "$SCRIPT_SANDBOX/lhci-reports-$mode" ]
    assert_log_contains "docker compose -f common-healthchecks.yml -f docker-compose.test.yml cp prod:/app/lhci-reports-$mode/. lhci-reports-$mode/"
    assert_lighthouse_cleanup_ran
  done
}
