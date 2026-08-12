#!/usr/bin/env bats

# Coverage for the binding flake budget (issue #186): scripts/ci/check-flakes.ts
# (`make check-flakes`) and the tracking-issue routing in scripts/ci/report-flake-audit.sh.

load './test_helper.bash'

setup() {
  setup_stub_dir

  SANDBOX="$BATS_TEST_TMPDIR/sandbox"
  mkdir -p "$SANDBOX/scripts/ci" "$SANDBOX/reports/playwright"
  cp "$PROJECT_ROOT/scripts/ci/check-flakes.ts" "$SANDBOX/scripts/ci/"
  cp "$PROJECT_ROOT/scripts/ci/report-flake-audit.sh" "$SANDBOX/scripts/ci/"
  cp "$PROJECT_ROOT/scripts/ci/upsert-audit-issue.sh" "$SANDBOX/scripts/ci/"

  cat > "$STUB_BIN_DIR/gh" <<'EOF'
#!/usr/bin/env bash
printf 'gh %s\n' "$*" >> "${COMMAND_LOG:?}"
if [ "$1" = "issue" ] && [ "$2" = "list" ]; then
  [ -z "${FAKE_GH_ISSUE_NUMBER:-}" ] || printf '%s\n' "$FAKE_GH_ISSUE_NUMBER"
fi
if [ "$1" = "issue" ] && [ "$2" = "view" ]; then
  printf '%s\n' "${FAKE_GH_ISSUE_BODY:-}"
fi
exit 0
EOF
  chmod +x "$STUB_BIN_DIR/gh"
}

write_report() {
  printf '%s' "$2" > "$SANDBOX/reports/playwright/$1"
}

run_check() {
  run env \
    PATH="$STUB_BIN_DIR:$PATH" \
    COMMAND_LOG="$COMMAND_LOG" \
    PLAYWRIGHT_JSON_REPORT="${PLAYWRIGHT_JSON_REPORT:-reports/playwright/report.json}" \
    FLAKE_SUMMARY_FILE="${FLAKE_SUMMARY_FILE:-reports/playwright/flake-summary.md}" \
    FLAKE_BUDGET="${FLAKE_BUDGET:-0}" \
    bash -c 'cd "$1" && shift && "$@"' _ "$SANDBOX" node scripts/ci/check-flakes.ts
}

run_router() {
  run env \
    PATH="$STUB_BIN_DIR:$PATH" \
    COMMAND_LOG="$COMMAND_LOG" \
    FAKE_GH_ISSUE_NUMBER="${FAKE_GH_ISSUE_NUMBER:-}" \
    FAKE_GH_ISSUE_BODY="${FAKE_GH_ISSUE_BODY:-}" \
    FLAKE_SUMMARY_FILES="${FLAKE_SUMMARY_FILES:-reports/playwright/flake-summary.md}" \
    FLAKE_AUDIT_RUN_URL='https://example.invalid/run/1' \
    bash -c 'cd "$1" && shift && "$@"' _ "$SANDBOX" sh scripts/ci/report-flake-audit.sh
}

clean_report() {
  printf '%s' '{"suites":[{"specs":[{"title":"passes","file":"tests/e2e/a.spec.ts","line":3,
    "tests":[{"status":"expected","projectName":"chromium"}]}]}]}'
}

flaky_report() {
  printf '%s' '{"suites":[{"suites":[{"specs":[{"title":"races","file":"tests/e2e/b.spec.ts","line":9,
    "tests":[{"status":"flaky","projectName":"webkit"}]}]}]}]}'
}

failed_report() {
  printf '%s' '{"suites":[{"specs":[{"title":"broken","file":"tests/e2e/c.spec.ts","line":4,
    "tests":[{"status":"unexpected","projectName":"firefox"}]}]}]}'
}

@test "a clean report passes and records a no-offender marker" {
  write_report report.json "$(clean_report)"

  run_check
  [ "$status" -eq 0 ]
  assert_output_contains 'flaky (passed on retry): 0 (budget 0)'

  run grep -F '<!-- offenders: none -->' "$SANDBOX/reports/playwright/flake-summary.md"
  [ "$status" -eq 0 ]
}

@test "a retried pass breaches a zero budget and names the offending spec" {
  write_report report.json "$(flaky_report)"

  run_check
  [ "$status" -eq 1 ]
  assert_output_contains 'tests/e2e/b.spec.ts:9 > races [webkit]'
  assert_output_contains 'flaky (passed on retry): 1 (budget 0)'
}

@test "a retried pass inside the budget passes" {
  write_report report.json "$(flaky_report)"
  export FLAKE_BUDGET=1

  run_check
  [ "$status" -eq 0 ]
  assert_output_contains 'flaky (passed on retry): 1 (budget 1)'
}

@test "a hard failure exits 2 so it routes separately from a flake" {
  write_report report.json "$(failed_report)"

  run_check
  [ "$status" -eq 2 ]
  assert_output_contains 'tests/e2e/c.spec.ts:4 > broken [firefox]'
  assert_output_contains 'hard failures: 1'
}

@test "a missing report is a broken audit, never a pass" {
  run_check
  [ "$status" -eq 2 ]
  assert_output_contains 'not found'
}

@test "a report describing no tests refuses to pass vacuously" {
  write_report report.json '{"suites":[]}'

  run_check
  [ "$status" -eq 2 ]
  assert_output_contains 'describes no tests'
}

@test "a non-negative integer budget is required" {
  write_report report.json "$(clean_report)"
  export FLAKE_BUDGET=-1

  run_check
  [ "$status" -eq 2 ]
  assert_output_contains 'FLAKE_BUDGET must be a non-negative integer'
}

@test "a clean audit files no tracking issue" {
  write_report report.json "$(clean_report)"
  run_check
  [ "$status" -eq 0 ]

  reset_command_log
  run_router
  [ "$status" -eq 0 ]
  assert_output_contains 'flake audit clean; no tracking issue needed'

  run grep -c 'gh issue' "$COMMAND_LOG"
  [ "$output" -eq 0 ]
}

@test "an audit with offenders files the mandatory tracking issue" {
  write_report report.json "$(flaky_report)"
  run_check
  [ "$status" -eq 1 ]

  reset_command_log
  run_router
  [ "$status" -eq 0 ]
  assert_log_contains 'gh label create flaky-tests'
  assert_log_contains 'gh issue create --label flaky-tests'

  run grep -F 'tests/e2e/b.spec.ts:9 > races [webkit]' \
    "$SANDBOX/reports/playwright/audit-issue-body.md"
  [ "$status" -eq 0 ]
}

# The change marker has to be derived from WHICH specs offended. Hashing the summary file
# names instead would freeze the issue on the first night's list while the real offenders
# rotated underneath it.
@test "a changed offender set re-comments on and updates the tracking issue" {
  write_report report.json "$(flaky_report)"
  run_check
  [ "$status" -eq 1 ]
  run_router
  [ "$status" -eq 0 ]
  cp "$SANDBOX/reports/playwright/audit-issue-body.md" "$BATS_TEST_TMPDIR/night1.md"

  write_report report.json '{"suites":[{"specs":[{"title":"other","file":"tests/e2e/d.spec.ts","line":11,
    "tests":[{"status":"flaky","projectName":"chromium"}]}]}]}'
  run_check
  [ "$status" -eq 1 ]

  reset_command_log
  export FAKE_GH_ISSUE_NUMBER=7
  FAKE_GH_ISSUE_BODY="$(cat "$BATS_TEST_TMPDIR/night1.md")"
  export FAKE_GH_ISSUE_BODY
  run_router
  [ "$status" -eq 0 ]
  assert_log_contains 'gh issue comment 7'
  assert_log_contains 'gh issue edit 7'
}

@test "an unchanged offender set stays quiet so the audit never becomes nightly noise" {
  write_report report.json "$(flaky_report)"
  run_check
  [ "$status" -eq 1 ]
  run_router
  [ "$status" -eq 0 ]

  reset_command_log
  export FAKE_GH_ISSUE_NUMBER=7
  FAKE_GH_ISSUE_BODY="$(cat "$SANDBOX/reports/playwright/audit-issue-body.md")"
  export FAKE_GH_ISSUE_BODY
  run_router
  [ "$status" -eq 0 ]
  assert_output_contains 'already records this state; staying quiet'

  run grep -c 'gh issue comment' "$COMMAND_LOG"
  [ "$output" -eq 0 ]
}

@test "a crashed suite never collides with an equal-sized flaky set" {
  write_report report.json "$(flaky_report)"
  run_check
  [ "$status" -eq 1 ]
  run_router
  [ "$status" -eq 0 ]
  FLAKY_MARKER="$(sed -n 's|.*<!-- \(audit-state:[0-9]*\) -->.*|\1|p' \
    "$SANDBOX/reports/playwright/audit-issue-body.md")"
  [ -n "$FLAKY_MARKER" ]

  export FLAKE_SUMMARY_FILES='reports/playwright/gone.md'
  run_router
  [ "$status" -eq 0 ]
  MISSING_MARKER="$(sed -n 's|.*<!-- \(audit-state:[0-9]*\) -->.*|\1|p' \
    "$SANDBOX/reports/playwright/audit-issue-body.md")"
  [ -n "$MISSING_MARKER" ]
  [ "$FLAKY_MARKER" != "$MISSING_MARKER" ]
}

# A hard failure on the scheduled run is a different, more urgent problem than accumulated
# nondeterminism, so it must not be filed as "flaky tests".
@test "a suite that produced no summary escalates under the failure label, not as a flake" {
  export FLAKE_SUMMARY_FILES='reports/playwright/missing-flakes.md'

  run_router
  [ "$status" -eq 0 ]
  assert_log_contains 'gh issue create --label audit-failure'
  assert_log_contains 'Scheduled Playwright audit failed outright'

  run grep -F 'No summary produced' "$SANDBOX/reports/playwright/audit-issue-body.md"
  [ "$status" -eq 0 ]
}

@test "a hard-failure run escalates distinctly from a flake-only run" {
  write_report report.json "$(failed_report)"
  run_check
  [ "$status" -eq 2 ]

  reset_command_log
  run_router
  [ "$status" -eq 0 ]
  assert_log_contains 'gh issue create --label audit-failure'

  run grep -F 'HARD FAILURES' "$SANDBOX/reports/playwright/audit-issue-body.md"
  [ "$status" -eq 0 ]
}

@test "a summary without the offenders marker is untrustworthy, never clean" {
  printf '## Playwright flake audit\n\n- tests analysed: 3\n' \
    > "$SANDBOX/reports/playwright/flake-summary.md"

  run_router
  [ "$status" -eq 0 ]
  assert_log_contains 'gh issue create --label audit-failure'

  run grep -F 'Summary is unreadable' "$SANDBOX/reports/playwright/audit-issue-body.md"
  [ "$status" -eq 0 ]
}

# Playwright could rename or add a failure status in a future release; an allowlist of
# passing statuses keeps that from silently becoming a clean audit.
@test "an unrecognised test status counts as a hard failure, not a pass" {
  write_report report.json '{"suites":[{"specs":[{"title":"weird","file":"tests/e2e/e.spec.ts","line":2,
    "tests":[{"status":"someNewStatus","projectName":"chromium"}]}]}]}'

  run_check
  [ "$status" -eq 2 ]
  assert_output_contains 'hard failures: 1'
}

@test "a budget with trailing garbage is rejected instead of silently truncated" {
  write_report report.json "$(clean_report)"
  export FLAKE_BUDGET='2abc'

  run_check
  [ "$status" -eq 2 ]
  assert_output_contains 'FLAKE_BUDGET must be a non-negative integer'
}
