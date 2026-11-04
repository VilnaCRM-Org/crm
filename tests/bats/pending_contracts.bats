#!/usr/bin/env bats

# Coverage for scripts/ci/check-pending-contracts.sh, the first step of scripts/codegen.sh:
# a pending GraphQL contract must name the GRAPHQL_SCHEMA_VERSION it was copied against.

load './test_helper.bash'

setup() {
  SCRIPT="$PROJECT_ROOT/scripts/ci/check-pending-contracts.sh"
  SANDBOX="$BATS_TEST_TMPDIR/pending-sandbox"
  mkdir -p "$SANDBOX/pending"
  printf 'GRAPHQL_SCHEMA_VERSION=v2.8.0\n' > "$SANDBOX/.env.example"
}

write_pending() {
  printf '%s\nextend type Mutation {\n  ping: String\n}\n' "$2" > "$SANDBOX/pending/$1"
}

run_check() {
  run env CONTRACT_ENV_FILE="$SANDBOX/.env.example" PENDING_DIR="$SANDBOX/pending" sh "$SCRIPT"
}

@test "passes a pending file whose header names the current pin" {
  write_pending password-reset.graphql '# pending-against: v2.8.0'

  run_check
  [ "$status" -eq 0 ]
  [ -z "$output" ]
}

@test "passes when nothing is pending" {
  run_check
  [ "$status" -eq 0 ]
}

@test "fails a pending file that outlived a pin bump and names both versions" {
  write_pending password-reset.graphql '# pending-against: v2.7.0'

  run_check
  [ "$status" -eq 1 ]
  assert_output_contains 'password-reset.graphql is pending against v2.7.0 but GRAPHQL_SCHEMA_VERSION is v2.8.0'
}

@test "fails a pending file without the header" {
  write_pending password-reset.graphql 'extend type Query {'

  run_check
  [ "$status" -eq 1 ]
  assert_output_contains 'must start with "# pending-against: <version>"'
}

@test "reports every stale file in one run" {
  write_pending a.graphql '# pending-against: v2.7.0'
  write_pending b.graphql '# pending-against: v2.6.0'

  run_check
  [ "$status" -eq 1 ]
  assert_output_contains 'a.graphql is pending against v2.7.0'
  assert_output_contains 'b.graphql is pending against v2.6.0'
}

@test "fails closed when the pin is missing" {
  : > "$SANDBOX/.env.example"
  write_pending password-reset.graphql '# pending-against: v2.8.0'

  run_check
  [ "$status" -eq 1 ]
  assert_output_contains 'GRAPHQL_SCHEMA_VERSION must be set'
}

@test "codegen runs the check before fetching anything" {
  run grep -n 'check-pending-contracts.sh' "$PROJECT_ROOT/scripts/codegen.sh"
  [ "$status" -eq 0 ]
  check_line="${output%%:*}"
  fetch_line="$(grep -n 'curl -fsSL' "$PROJECT_ROOT/scripts/codegen.sh" | head -n1 | cut -d: -f1)"
  [ "$check_line" -lt "$fetch_line" ]
}
