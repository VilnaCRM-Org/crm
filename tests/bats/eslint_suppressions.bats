#!/usr/bin/env bats

load './test_helper.bash'

setup() {
  setup_makefile_test_env
}

# Build directive text at runtime so this file never contains a raw
# suppression token: tests/ is part of the target's own default scan scope.
suppression_directive() {
  printf 'eslint-%s' "$1"
}

assert_output_not_contains() {
  local unexpected="$1"
  local actual_output="${output-}"

  if [[ "$actual_output" == *"$unexpected"* ]]; then
    echo "Expected output to not contain: $unexpected" >&2
    echo "--- output ---" >&2
    printf '%s\n' "$actual_output" >&2
    return 1
  fi
}

create_scope_fixtures() {
  mkdir -p "$MAKEFILE_SANDBOX/src" "$MAKEFILE_SANDBOX/tests"

  printf '// %s no-console\n' "$(suppression_directive 'disable-next-line')" \
    > "$MAKEFILE_SANDBOX/src/fixture.ts"
  printf '/* %s no-magic-numbers */\n' "$(suppression_directive 'disable')" \
    > "$MAKEFILE_SANDBOX/tests/fixture.test.ts"
  printf '// %s no-console\n' "$(suppression_directive 'enable')" \
    > "$MAKEFILE_SANDBOX/scripts/fixture.js"
  printf 'export default {}; // %s semi\n' "$(suppression_directive 'disable-line')" \
    > "$MAKEFILE_SANDBOX/eslint.config.mjs"
}

create_excluded_dir_fixtures() {
  local dir

  for dir in .git node_modules dist coverage test-results playwright-report; do
    mkdir -p "$MAKEFILE_SANDBOX/src/$dir"
    printf '// %s no-console\n' "$(suppression_directive 'disable')" \
      > "$MAKEFILE_SANDBOX/src/$dir/excluded.js"
  done
}

@test "Makefile defines the suppression policy near lint targets and keeps aggregate lint unchanged" {
  run grep -E '^lint-eslint-suppressions:' "$PROJECT_ROOT/Makefile"
  [ "$status" -eq 0 ]

  run grep -E '^ESLINT_SUPPRESSION_PATTERN[[:space:]]*=' "$PROJECT_ROOT/Makefile"
  [ "$status" -eq 0 ]

  run grep -E '^ESLINT_SUPPRESSION_SCAN_PATHS[[:space:]]*=[[:space:]]*src tests scripts eslint\.config\.mjs' \
    "$PROJECT_ROOT/Makefile"
  [ "$status" -eq 0 ]

  run grep -E '^lint:' "$PROJECT_ROOT/Makefile"
  [ "$status" -eq 0 ]
  assert_output_not_contains 'lint-eslint-suppressions'
}

@test "Makefile documents the standalone workflow placement and future-wiring guidance" {
  # AC1: the target's help text marks it standalone and not part of `make lint`.
  run grep -E '^lint-eslint-suppressions:.*standalone' "$PROJECT_ROOT/Makefile"
  [ "$status" -eq 0 ]

  # AC1/AC2: the policy comment states it is standalone during MVP.
  run grep -F 'Standalone during MVP' "$PROJECT_ROOT/Makefile"
  [ "$status" -eq 0 ]

  # AC3: forward-looking guidance is recorded for when the baseline decision
  # later wires the target into aggregate lint.
  run grep -F 'wires it into aggregate' "$PROJECT_ROOT/Makefile"
  [ "$status" -eq 0 ]
}

@test "baseline artifact publishes counts and the finalized standalone enforcement decision" {
  local baseline="$PROJECT_ROOT/specs/eslint-suppressions/implementation-artifacts/eslint-suppressions-baseline.md"

  # AC1: the baseline artifact exists.
  [ -f "$baseline" ]

  # AC1/AC3: before-cleanup and after-cleanup suppression counts are recorded.
  run grep -F 'Before cleanup' "$baseline"
  [ "$status" -eq 0 ]
  run grep -F 'After cleanup' "$baseline"
  [ "$status" -eq 0 ]

  # AC3: the command used and the scan scope are recorded.
  run grep -F 'make lint-eslint-suppressions' "$baseline"
  [ "$status" -eq 0 ]
  run grep -F 'src tests scripts eslint.config.mjs' "$baseline"
  [ "$status" -eq 0 ]

  # AC2: the decision states the target is standalone during the MVP and that
  # aggregate `make lint` and CI enforcement are not changed in the MVP.
  run grep -F 'Standalone during MVP' "$baseline"
  [ "$status" -eq 0 ]
  run grep -F 'aggregate `make lint` and CI enforcement are not changed in MVP' "$baseline"
  [ "$status" -eq 0 ]

  # AC3: with a zero baseline there are no remaining entries, so the artifact
  # records a zero-baseline statement rather than a remaining-suppression list.
  run grep -F 'zero' "$baseline"
  [ "$status" -eq 0 ]

  # AC4: future enforcement options are deferred and no story requires CI
  # enforcement or aggregate lint wiring as part of the MVP.
  run grep -F 'no story requires CI enforcement or aggregate lint wiring as part of the MVP' "$baseline"
  [ "$status" -eq 0 ]

  # AC2/AC4: the decision is finalized, not still pending in a later story.
  run grep -F 'To be recorded in Story 3.2' "$baseline"
  [ "$status" -ne 0 ]
}

@test "default scan succeeds with a short message when no suppression directives exist in scope" {
  run_make_target lint-eslint-suppressions
  [ "$status" -eq 0 ]
  assert_output_contains 'No ESLint suppression directives found'
}

@test "default scan reports directives from src, tests, scripts, and eslint.config.mjs" {
  create_scope_fixtures

  run_make_target lint-eslint-suppressions
  [ "$status" -ne 0 ]
  assert_output_contains "src/fixture.ts:1:// $(suppression_directive 'disable-next-line') no-console"
  assert_output_contains "tests/fixture.test.ts:1:/* $(suppression_directive 'disable') no-magic-numbers */"
  assert_output_contains "scripts/fixture.js:1:// $(suppression_directive 'enable') no-console"
  assert_output_contains "eslint.config.mjs:1:export default {}; // $(suppression_directive 'disable-line') semi"
}

@test "each required directive variant is reported once in grep-style path:line:matched text" {
  mkdir -p "$MAKEFILE_SANDBOX/src"
  {
    printf '// %s a\n' "$(suppression_directive 'disable-next-line')"
    printf 'const value = 1; // %s b\n' "$(suppression_directive 'disable-line')"
    printf '/* %s c */\n' "$(suppression_directive 'disable')"
    printf '/* %s d */\n' "$(suppression_directive 'enable')"
  } > "$MAKEFILE_SANDBOX/src/variants.ts"

  run_make_target lint-eslint-suppressions
  [ "$status" -ne 0 ]

  # Four distinct directive lines must produce exactly four reported entries:
  # the longest directive form must be reported once, not also as a shorter prefix form.
  local reported
  reported="$(printf '%s\n' "$output" | grep -c 'src/variants\.ts:')"
  [ "$reported" -eq 4 ]

  assert_output_contains "src/variants.ts:1:// $(suppression_directive 'disable-next-line') a"
  assert_output_contains "src/variants.ts:2:const value = 1; // $(suppression_directive 'disable-line') b"
  assert_output_contains "src/variants.ts:3:/* $(suppression_directive 'disable') c */"
  assert_output_contains "src/variants.ts:4:/* $(suppression_directive 'enable') d */"
}

@test "default scan excludes vendor, build, and report directories nested in scan paths" {
  create_scope_fixtures
  create_excluded_dir_fixtures

  run_make_target lint-eslint-suppressions
  [ "$status" -ne 0 ]

  local dir
  for dir in .git node_modules dist coverage test-results playwright-report; do
    assert_output_not_contains "$dir/excluded.js"
  done
}

@test "ESLINT_SUPPRESSION_SCAN_PATHS is overridable from the make invocation" {
  create_scope_fixtures

  local override_dir="$BATS_TEST_TMPDIR/override-scope"
  mkdir -p "$override_dir"
  printf '// %s no-alert\n' "$(suppression_directive 'disable')" \
    > "$override_dir/sample.js"

  run_make_target lint-eslint-suppressions "ESLINT_SUPPRESSION_SCAN_PATHS=$override_dir"
  [ "$status" -ne 0 ]
  assert_output_contains "$override_dir/sample.js:1:// $(suppression_directive 'disable') no-alert"
  assert_output_not_contains 'src/fixture.ts'
}

@test "pass and fail exit codes track the controlled fixture via ESLINT_SUPPRESSION_SCAN_PATHS" {
  local positive_dir="$BATS_TEST_TMPDIR/positive-scope"
  mkdir -p "$positive_dir"
  {
    printf '// %s a\n' "$(suppression_directive 'disable-next-line')"
    printf 'const value = 1; // %s b\n' "$(suppression_directive 'disable-line')"
    printf '/* %s c */\n' "$(suppression_directive 'disable')"
    printf '/* %s d */\n' "$(suppression_directive 'enable')"
  } > "$positive_dir/all-variants.ts"

  run_make_target lint-eslint-suppressions "ESLINT_SUPPRESSION_SCAN_PATHS=$positive_dir"
  [ "$status" -ne 0 ]
  assert_output_contains "$positive_dir/all-variants.ts:1:// $(suppression_directive 'disable-next-line') a"
  assert_output_contains "$positive_dir/all-variants.ts:2:const value = 1; // $(suppression_directive 'disable-line') b"
  assert_output_contains "$positive_dir/all-variants.ts:3:/* $(suppression_directive 'disable') c */"
  assert_output_contains "$positive_dir/all-variants.ts:4:/* $(suppression_directive 'enable') d */"

  local negative_dir="$BATS_TEST_TMPDIR/negative-scope"
  mkdir -p "$negative_dir"
  printf 'const clean = true;\n' > "$negative_dir/clean.ts"

  run_make_target lint-eslint-suppressions "ESLINT_SUPPRESSION_SCAN_PATHS=$negative_dir"
  [ "$status" -eq 0 ]
  assert_output_contains 'No ESLint suppression directives found'
}

@test "a grep scan error other than no-match exits non-zero and is not masked as success" {
  # Force grep to fail with a scan error (status >= 2), as it would on an
  # unreadable path, to prove the target propagates the error instead of
  # reporting a false success.
  cat > "$STUB_BIN_DIR/grep" <<'STUB'
#!/usr/bin/env bash
echo "grep: simulated scan error" >&2
exit 2
STUB
  chmod +x "$STUB_BIN_DIR/grep"

  mkdir -p "$MAKEFILE_SANDBOX/src"
  printf 'const ok = true;\n' > "$MAKEFILE_SANDBOX/src/clean.ts"

  run_make_target lint-eslint-suppressions
  [ "$status" -ne 0 ]
  assert_output_not_contains 'No ESLint suppression directives found'
}
