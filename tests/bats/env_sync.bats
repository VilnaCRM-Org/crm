#!/usr/bin/env bats

# Coverage for the untracked-.env contract (issue #142): the Makefile `.env` bootstrap rule
# behind `make env-bootstrap`, and scripts/check-env-sync.sh, wired as `make check-env-sync`.
# Mirrors the fixture-per-defect approach of lockfile_registries.bats.

load './test_helper.bash'

setup() {
  setup_makefile_test_env

  SCRIPT="$PROJECT_ROOT/scripts/check-env-sync.sh"
  SANDBOX="$BATS_TEST_TMPDIR/env-sandbox"
  mkdir -p "$SANDBOX"
}

write_template() {
  cat > "$MAKEFILE_SANDBOX/.env.example" <<'TEMPLATE'
DEV_PORT=3000
GRAPHQL_SCHEMA_VERSION=v2.8.0
TEMPLATE
}

write_pair() {
  cat > "$SANDBOX/.env.example"
  cp "$SANDBOX/.env.example" "$SANDBOX/.env"
}

run_sync() {
  # shellcheck disable=SC2016
  run bash -c 'cd "$1" && sh "$2"' _ "$SANDBOX" "$SCRIPT"
}

@test "env-bootstrap copies the tracked template to a missing .env and reports it" {
  write_template
  [ ! -f "$MAKEFILE_SANDBOX/.env" ]

  run_make_target env-bootstrap
  [ "$status" -eq 0 ]
  assert_output_contains 'bootstrapped .env from .env.example'
  assert_output_contains '.env present'
  run diff "$MAKEFILE_SANDBOX/.env.example" "$MAKEFILE_SANDBOX/.env"
  [ "$status" -eq 0 ]
}

@test "the bootstrap never overwrites an existing .env, even when the template is newer" {
  write_template
  printf 'DEV_PORT=4100\nGRAPHQL_SCHEMA_VERSION=v2.8.0\n' > "$MAKEFILE_SANDBOX/.env"
  touch -d '2000-01-01' "$MAKEFILE_SANDBOX/.env"
  touch "$MAKEFILE_SANDBOX/.env.example"

  run_make_target env-bootstrap
  [ "$status" -eq 0 ]
  [[ "$output" != *"bootstrapped"* ]]
  run grep -F 'DEV_PORT=4100' "$MAKEFILE_SANDBOX/.env"
  [ "$status" -eq 0 ]
}

@test "naming .env as the goal (which the Makefile marks phony) still never overwrites it" {
  write_template
  printf 'DEV_PORT=4100\n' > "$MAKEFILE_SANDBOX/.env"

  run_make_target .env
  [ "$status" -eq 0 ]
  [[ "$output" != *"bootstrapped"* ]]
  run grep -F 'DEV_PORT=4100' "$MAKEFILE_SANDBOX/.env"
  [ "$status" -eq 0 ]
}

@test "any make target bootstraps .env first, because the Makefile -includes it" {
  write_template

  run_make_target help
  [ "$status" -eq 0 ]
  assert_output_contains 'bootstrapped .env from .env.example'
  [ -f "$MAKEFILE_SANDBOX/.env" ]
}

@test "a checkout without the template is left alone rather than failing every target" {
  [ ! -f "$MAKEFILE_SANDBOX/.env.example" ]

  run_make_target help
  [ "$status" -eq 0 ]
  [[ "$output" != *"bootstrapped"* ]]
  [ ! -f "$MAKEFILE_SANDBOX/.env" ]
}

@test "check-env-sync passes when .env mirrors the template" {
  write_pair <<'PAIR'
DEV_PORT=3000
GRAPHQL_SCHEMA_VERSION=v2.8.0
GRAPHQL_SCHEMA_URL=https://example.test/${GRAPHQL_SCHEMA_VERSION}/spec
OPENAPI_SPEC_VERSION=v2.8.0
OPENAPI_SPEC_URL=https://example.test/${OPENAPI_SPEC_VERSION}/spec.yaml
PAIR

  run_sync
  [ "$status" -eq 0 ]
  assert_output_contains 'env sync OK'
  assert_output_contains 'contract pins aligned'
}

@test "check-env-sync ignores local values that are not contract pins" {
  write_pair <<'PAIR'
DEV_PORT=3000
REACT_APP_SENTRY_DSN=
GRAPHQL_SCHEMA_VERSION=v2.8.0
PAIR
  printf 'DEV_PORT=4100\nREACT_APP_SENTRY_DSN=https://key@sentry.example/1\nGRAPHQL_SCHEMA_VERSION=v2.8.0\n' \
    > "$SANDBOX/.env"

  run_sync
  [ "$status" -eq 0 ]
}

@test "check-env-sync fails on a key the template declares but the local .env lacks" {
  write_pair <<'PAIR'
DEV_PORT=3000
NEW_KEY=value
PAIR
  printf 'DEV_PORT=3000\n' > "$SANDBOX/.env"

  run_sync
  [ "$status" -eq 1 ]
  assert_output_contains 'declared in .env.example but missing from .env'
  assert_output_contains 'NEW_KEY'
}

@test "check-env-sync fails on a key the local .env declares but the template lacks" {
  write_pair <<'PAIR'
DEV_PORT=3000
PAIR
  printf 'DEV_PORT=3000\nSECRET_ONLY_LOCAL=x\n' > "$SANDBOX/.env"

  run_sync
  [ "$status" -eq 1 ]
  assert_output_contains 'declared in .env but missing from .env.example'
  assert_output_contains 'SECRET_ONLY_LOCAL'
}

@test "check-env-sync fails on a contract pin that differs from the tracked template" {
  write_pair <<'PAIR'
GRAPHQL_SCHEMA_VERSION=v2.8.0
OPENAPI_SPEC_VERSION=v2.8.0
PAIR
  printf 'GRAPHQL_SCHEMA_VERSION=v2.8.0\nOPENAPI_SPEC_VERSION=v2.7.1\n' > "$SANDBOX/.env"

  run_sync
  [ "$status" -eq 1 ]
  assert_output_contains 'OPENAPI_SPEC_VERSION is v2.7.1 in .env but v2.8.0 in .env.example'
  assert_output_contains 'contract pins are tracked in .env.example'
}

@test "check-env-sync points at the bootstrap when .env is missing" {
  printf 'DEV_PORT=3000\n' > "$SANDBOX/.env.example"

  run_sync
  [ "$status" -eq 1 ]
  assert_output_contains '.env is missing'
  assert_output_contains 'make env-bootstrap'
}
