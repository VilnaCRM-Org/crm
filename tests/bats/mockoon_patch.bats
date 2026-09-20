#!/usr/bin/env bats

load './test_helper.bash'

setup() {
  setup_makefile_test_env
  export MOCKOON_FIXTURE_DIST="$BATS_TEST_TMPDIR/dist"
  mkdir -p "$MOCKOON_FIXTURE_DIST/nested assets"
  # Execute the real Make recipe and sh -lc payload. Only the Docker transport
  # and its /app/dist mount are mapped to the isolated filesystem fixture.
  cat > "$STUB_BIN_DIR/docker" << 'STUB'
#!/usr/bin/env bash
while [ "$#" -gt 0 ] && [ "$1" != sh ]; do shift; done
[ "$#" -eq 3 ] && [ "$2" = -lc ] || exit 64
script="$3"
script="${script//\/app\/dist/$MOCKOON_FIXTURE_DIST}"
exec /bin/sh -lc "$script"
STUB
  chmod +x "$STUB_BIN_DIR/docker"
}

@test "actual Mockoon patch shell rewrites supported assets and is idempotent" {
  local extension
  for extension in js html json css txt; do
    printf '%s\n' 'http://localhost:8080/api http://localhost:9090/other' \
      > "$MOCKOON_FIXTURE_DIST/nested assets/bundle file.$extension"
  done

  run_make_target patch-prod-mockoon-url
  [ "$status" -eq 0 ]
  for extension in js html json css; do
    [ "$(cat "$MOCKOON_FIXTURE_DIST/nested assets/bundle file.$extension")" = \
      'http://mockoon:8080/api http://localhost:9090/other' ]
  done
  grep -q 'http://localhost:8080/api' "$MOCKOON_FIXTURE_DIST/nested assets/bundle file.txt"

  run_make_target patch-prod-mockoon-url
  [ "$status" -eq 0 ]
  [ "$(cat "$MOCKOON_FIXTURE_DIST/nested assets/bundle file.js")" = \
    'http://mockoon:8080/api http://localhost:9090/other' ]
}

@test "actual Mockoon patch shell preserves the missing-build no-op" {
  run_make_target patch-prod-mockoon-url MOCKOON_FIXTURE_DIST="$BATS_TEST_TMPDIR/not-built"
  [ "$status" -eq 0 ]
  assert_output_contains 'Prod build directory not found; skipping Mockoon URL patch.'
}

@test "actual Mockoon patch shell propagates sed failure" {
  printf '%s\n' 'http://localhost:8080/api' > "$MOCKOON_FIXTURE_DIST/bundle.js"
  # A malformed substitution exercises real find/sed failure, not a Make stub.
  run_make_target patch-prod-mockoon-url 'MOCKOON_PORT=8080|invalid'
  [ "$status" -eq 2 ]
  assert_output_contains 'sed:'
  [[ "$output" != *'Patched Mockoon URLs from http'* ]]
}
