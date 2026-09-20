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
  *" cp prod:/app/.lighthouseci/. "*)
    if [ "${FAIL_RAW_REPORT_COPY:-0}" = 1 ]; then
      exit 46
    fi
    destination="${@: -1}"
    mkdir -p "$destination"
    printf '{"categories":{"performance":{"score":0.74}}}\n' > "$destination/lhr-test.json"
    ;;
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
  assert_log_contains 'docker compose -f docker-compose.yml -f docker-compose.test.yml -f common-healthchecks.yml down --volumes --remove-orphans'
  assert_log_contains 'docker network rm crm-network'
}

assert_lighthouse_compose_files() {
  local action="$1"
  assert_log_contains "docker compose -f docker-compose.yml -f docker-compose.test.yml -f common-healthchecks.yml $action"
}

@test "Lighthouse DIND commands use locked tooling and run in prod, not nested Compose" {
  run /usr/bin/make -C "$PROJECT_ROOT" -n install-chromium-lhci
  [ "$status" -eq 0 ]
  assert_output_contains 'chromium=136.0.7103.113-r0'
  assert_output_contains 'LHCI_VERSION="0.15.1"'
  assert_output_contains 'DOTENV_EXPAND_VERSION="12.0.3"'
  assert_output_contains 'DOTENV_VERSION="17.4.2"'
  assert_output_contains '"@lhci/cli@$LHCI_VERSION"'
  ! printf '%s' "$output" | grep -Fq '@lhci/cli@0.10.0'

  local mode
  for mode in desktop mobile; do
    run /usr/bin/make -C "$PROJECT_ROOT" -n "lighthouse-${mode}-dind"
    [ "$status" -eq 0 ]
    assert_output_contains "lhci autorun --config=\$CONFIG_PATH"
    assert_output_contains "lighthouse/lighthouserc.${mode}.js"
    assert_output_contains 'LHCI_TARGET_URL=http://localhost:3001'
    assert_output_contains '--collect.chromePath=/usr/bin/chromium-browser'
    assert_output_contains '--collect.settings.chromeFlags="--no-sandbox --disable-dev-shm-usage --disable-gpu --headless=new"'
    ! printf '%s' "$output" | grep -Fq 'docker compose exec -T dev'
    ! printf '%s' "$output" | grep -Fq 'bun x lhci'
  done

  mkdir -p "$SCRIPT_SANDBOX/lighthouse"
  : > "$SCRIPT_SANDBOX/lighthouse/lighthouserc.desktop.js"
  cat > "$STUB_BIN_DIR/lhci" <<'STUB'
#!/usr/bin/env sh
printf '%s\n' "$@" > "${LHCI_ARGV_LOG:?}"
STUB
  cat > "$STUB_BIN_DIR/docker" <<'STUB'
#!/usr/bin/env bash
inner_script="${@: -1}"
inner_script="${inner_script#*cd /app;}"
inner_script="export PATH=\"$STUB_BIN_DIR:$PATH\"; set -e; cd \"$SCRIPT_SANDBOX\";$inner_script"
exec /bin/sh -lc "$inner_script"
STUB
  chmod +x "$STUB_BIN_DIR/lhci" "$STUB_BIN_DIR/docker"

  local argv_log="$BATS_TEST_TMPDIR/lhci-argv.log"
  run env \
    PATH="$STUB_BIN_DIR:$PATH" \
    SCRIPT_SANDBOX="$SCRIPT_SANDBOX" \
    LHCI_ARGV_LOG="$argv_log" \
    /usr/bin/make -C "$PROJECT_ROOT" lighthouse-desktop-dind
  [ "$status" -eq 0 ]
  run grep -Fx -- '--collect.chromePath=/usr/bin/chromium-browser' "$argv_log"
  [ "$status" -eq 0 ]
  run grep -Fx -- '--collect.settings.chromeFlags=--no-sandbox --disable-dev-shm-usage --disable-gpu --headless=new' "$argv_log"
  [ "$status" -eq 0 ]
}

@test "global export does not repeat lockfile shell lookups for each Make recipe" {
  local lookup_log="$BATS_TEST_TMPDIR/lockfile-lookups.log"
  cat > "$STUB_BIN_DIR/sed" <<'STUB'
#!/usr/bin/env sh
printf '%s\n' "$*" >> "${LOOKUP_LOG:?}"
exec /usr/bin/sed "$@"
STUB
  chmod +x "$STUB_BIN_DIR/sed"
  : > "$lookup_log"

  local probe_makefile
  probe_makefile=$'lhci-export-probe:\n\t@:\n\t@:'
  run env \
    PATH="$STUB_BIN_DIR:$PATH" \
    LOOKUP_LOG="$lookup_log" \
    /usr/bin/make -C "$PROJECT_ROOT" --eval="$probe_makefile" lhci-export-probe

  [ "$status" -eq 0 ]
  [ "$(wc -l < "$lookup_log")" -eq 3 ]
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
      [ -f "$SCRIPT_SANDBOX/lhci-reports-$mode/raw/lhr-test.json" ]
      if [ "$failure_target" = "$audit_target" ]; then
        assert_lighthouse_compose_files "cp config/performance-budget.json prod:/app/config/performance-budget.json"
      fi
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
    assert_lighthouse_compose_files "cp prod:/app/lhci-reports-$mode/. lhci-reports-$mode/"
    assert_lighthouse_compose_files "cp prod:/app/.lighthouseci/. lhci-reports-$mode/raw/"
    [ -f "$SCRIPT_SANDBOX/lhci-reports-$mode/raw/lhr-test.json" ]
    assert_lighthouse_compose_files "cp config/performance-budget.json prod:/app/config/performance-budget.json"
    assert_lighthouse_cleanup_ran
  done
}

@test "raw Lighthouse report copy failure preserves audit result and cleanup" {
  local mode
  for mode in desktop mobile; do
    reset_command_log
    FAKE_MAKE_FAIL_TARGET="lighthouse-$mode-dind" FAIL_REPORT_COPY=1 FAIL_RAW_REPORT_COPY=1 run_ci_script \
      "$PROJECT_ROOT/scripts/ci/batch_lhci_leak.sh" "test-lighthouse-$mode"
    [ "$status" -eq 37 ]
    assert_lighthouse_cleanup_ran

    reset_command_log
    FAIL_RAW_REPORT_COPY=1 run_ci_script \
      "$PROJECT_ROOT/scripts/ci/batch_lhci_leak.sh" "test-lighthouse-$mode"
    [ "$status" -eq 0 ]
    assert_lighthouse_cleanup_ran
  done
}

@test "Playwright and load batch Compose commands use the complete start-prod file set" {
  run_ci_script "$PROJECT_ROOT/scripts/ci/batch_pw_load.sh" test-playwright-e2e
  [ "$status" -eq 0 ]
  assert_log_contains 'docker compose -f docker-compose.yml -f docker-compose.test.yml -f common-healthchecks.yml exec -T playwright mkdir -p /app'
  assert_log_contains 'docker compose -f docker-compose.yml -f docker-compose.test.yml -f common-healthchecks.yml cp playwright:/app/playwright-report/. playwright-report/'

  reset_command_log
  run_ci_script "$PROJECT_ROOT/scripts/ci/batch_pw_load.sh" test-playwright-visual
  [ "$status" -eq 0 ]
  assert_log_contains 'docker compose -f docker-compose.yml -f docker-compose.test.yml -f common-healthchecks.yml exec -T playwright mkdir -p /app'

  reset_command_log
  run_ci_script "$PROJECT_ROOT/scripts/ci/batch_pw_load.sh" test-load
  [ "$status" -eq 0 ]
  assert_log_contains 'make start-prod'
}
