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
  printf 'module.exports = {}; // %s semi\n' "$(suppression_directive 'disable-line')" \
    > "$MAKEFILE_SANDBOX/.eslintrc.js"
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

  run grep -E '^ESLINT_SUPPRESSION_SCAN_PATHS[[:space:]]*=[[:space:]]*src tests scripts \.eslintrc\.js' \
    "$PROJECT_ROOT/Makefile"
  [ "$status" -eq 0 ]

  run grep -E '^lint:' "$PROJECT_ROOT/Makefile"
  [ "$status" -eq 0 ]
  assert_output_not_contains 'lint-eslint-suppressions'
}

@test "default scan succeeds with a short message when no suppression directives exist in scope" {
  run_make_target lint-eslint-suppressions
  [ "$status" -eq 0 ]
  assert_output_contains 'No ESLint suppression directives found'
}

@test "default scan reports directives from src, tests, scripts, and .eslintrc.js" {
  create_scope_fixtures

  run_make_target lint-eslint-suppressions
  [ "$status" -ne 0 ]
  assert_output_contains "src/fixture.ts:1:// $(suppression_directive 'disable-next-line') no-console"
  assert_output_contains "tests/fixture.test.ts:1:/* $(suppression_directive 'disable') no-magic-numbers */"
  assert_output_contains "scripts/fixture.js:1:// $(suppression_directive 'enable') no-console"
  assert_output_contains ".eslintrc.js:1:module.exports = {}; // $(suppression_directive 'disable-line') semi"
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
  # eslint-disable-next-line must be reported once, not also as a bare eslint-disable.
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
