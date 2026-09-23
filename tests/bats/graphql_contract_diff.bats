#!/usr/bin/env bats

# Coverage for the semantic GraphQL breaking-change gate (issues #178 phase 2, #136 E):
# scripts/ci/graphql-contract-diff.sh, run by `make contract-diff` beside the OpenAPI half.
# The docker stub replays graphql-inspector output captured from the pinned image, so the
# parser is exercised against the real verdict and breaking-line shapes.

load './test_helper.bash'

SDL_URL='https://raw.githubusercontent.com/VilnaCRM-Org/user-service/${GRAPHQL_SCHEMA_VERSION}/.github/graphql-spec/spec'

setup() {
  setup_stub_dir

  SCRIPT="$PROJECT_ROOT/scripts/ci/graphql-contract-diff.sh"
  SANDBOX="$BATS_TEST_TMPDIR/sandbox"
  ALLOWLIST="$SANDBOX/src/api/contracts/graphql-breaking-changes-approved.txt"
  mkdir -p "$SANDBOX/src/api/contracts"
  printf '# no approved breaking changes\n#   Field c was removed from object type Query\n' > "$ALLOWLIST"

  write_env "$SANDBOX/.env.example" v2.7.1
  export FAKE_BASE_PIN='v2.7.1'
  export FAKE_BASE_SDL_URL="$SDL_URL"
  export FAKE_INSPECTOR_MODE='clean'

  cat > "$STUB_BIN_DIR/git" <<'EOF'
#!/usr/bin/env bash
printf 'git %s\n' "$*" >> "${COMMAND_LOG:?}"
if [ "$1" = "show" ]; then
  if [ -n "${FAKE_GIT_SHOW_FAIL:-}" ]; then
    exit 128
  fi
  if [ -n "${FAKE_BASE_PREDATES_TEMPLATE:-}" ] && [ "$2" = "origin/main:.env.example" ]; then
    exit 128
  fi
  printf 'GRAPHQL_SCHEMA_VERSION=%s\n' "${FAKE_BASE_PIN:?}"
  printf 'GRAPHQL_SCHEMA_URL=%s\n' "${FAKE_BASE_SDL_URL:?}"
  exit 0
fi
exit 0
EOF

  cat > "$STUB_BIN_DIR/curl" <<'EOF'
#!/usr/bin/env bash
printf 'curl %s\n' "$*" >> "${COMMAND_LOG:?}"
if [ -n "${FAKE_CURL_FAIL:-}" ]; then
  exit 22
fi
out=""
while [ "$#" -gt 0 ]; do
  if [ "$1" = "-o" ]; then
    out="$2"
    shift
  fi
  shift
done
if [ -n "$out" ] && [ -z "${FAKE_CURL_EMPTY:-}" ]; then
  printf 'type Query { a: String }\n' > "$out"
elif [ -n "$out" ]; then
  : > "$out"
fi
exit 0
EOF

  cat > "$STUB_BIN_DIR/docker" <<'EOF'
#!/usr/bin/env bash
printf 'docker %s\n' "$*" >> "${COMMAND_LOG:?}"
case "${FAKE_INSPECTOR_MODE:?}" in
  clean)
    printf '[log] \nDetected the following changes (1) between schemas:\n\n'
    printf '[log] \xe2\x9a\xa0  Enum value B was added to enum E\n'
    printf '[success] No breaking changes detected\n'
    exit 0
    ;;
  breaking)
    printf '[log] \nDetected the following changes (3) between schemas:\n\n'
    printf '[log] \xe2\x9c\x96  Enum value B was removed from enum E\n'
    printf '[log] \xe2\x9c\x96  Field c was removed from object type Query\n'
    printf '[log] \xe2\x9a\xa0  Default value for argument x on field Query.b changed from 1 to undefined\n'
    printf '[error] Detected 2 breaking changes\n'
    exit 1
    ;;
  crash)
    printf '[error] GraphQLError: Syntax Error: Expected Name, found <EOF>.\n'
    exit 1
    ;;
  miscount)
    printf '[log] \xe2\x9c\x96  Field c was removed from object type Query\n'
    printf '[error] Detected 2 breaking changes\n'
    exit 1
    ;;
  daemon)
    printf 'docker: Cannot connect to the Docker daemon.\n' >&2
    exit 125
    ;;
esac
exit 0
EOF

  chmod +x "$STUB_BIN_DIR/git" "$STUB_BIN_DIR/curl" "$STUB_BIN_DIR/docker"
}

write_env() {
  {
    printf 'GRAPHQL_SCHEMA_VERSION=%s\n' "$2"
    printf 'GRAPHQL_SCHEMA_URL=%s\n' "$SDL_URL"
  } > "$1"
}

run_gate() {
  run env \
    PATH="$STUB_BIN_DIR:$PATH" \
    COMMAND_LOG="$COMMAND_LOG" \
    FAKE_BASE_PIN="${FAKE_BASE_PIN:-}" \
    FAKE_BASE_SDL_URL="${FAKE_BASE_SDL_URL:-}" \
    FAKE_GIT_SHOW_FAIL="${FAKE_GIT_SHOW_FAIL:-}" \
    FAKE_BASE_PREDATES_TEMPLATE="${FAKE_BASE_PREDATES_TEMPLATE:-}" \
    FAKE_CURL_FAIL="${FAKE_CURL_FAIL:-}" \
    FAKE_CURL_EMPTY="${FAKE_CURL_EMPTY:-}" \
    FAKE_INSPECTOR_MODE="${FAKE_INSPECTOR_MODE:-clean}" \
    CONTRACT_SPEC_MAX_BYTES="${CONTRACT_SPEC_MAX_BYTES:-}" \
    GITHUB_STEP_SUMMARY="$BATS_TEST_TMPDIR/summary.md" \
    bash -c 'cd "$1" && shift && "$@"' _ "$SANDBOX" sh "$SCRIPT"
}

@test "an unchanged schema pin fast-exits 0 without fetching or diffing anything" {
  run_gate
  [ "$status" -eq 0 ]
  assert_output_contains 'no GRAPHQL_SCHEMA_VERSION bump (v2.7.1)'

  run grep -c -E '^(curl|docker)' "$COMMAND_LOG"
  [ "$output" -eq 0 ]
}

@test "a clean schema bump passes and records the inspector report in the job summary" {
  write_env "$SANDBOX/.env.example" v2.8.0

  run_gate
  [ "$status" -eq 0 ]
  assert_output_contains 'no breaking changes between GraphQL v2.7.1 and v2.8.0'
  assert_log_contains 'graphql-inspector diff reports/contract-diff/base.graphql reports/contract-diff/head.graphql'

  run grep -F 'GraphQL contract changes: v2.7.1 -> v2.8.0' "$BATS_TEST_TMPDIR/summary.md"
  [ "$status" -eq 0 ]
  run grep -F 'Enum value B was added to enum E' "$BATS_TEST_TMPDIR/summary.md"
  [ "$status" -eq 0 ]
}

@test "the inspector image is pinned by digest" {
  write_env "$SANDBOX/.env.example" v2.8.0

  run_gate
  [ "$status" -eq 0 ]
  run grep -E 'kamilkisiela/graphql-inspector:v[0-9.]+@sha256:[0-9a-f]{64} graphql-inspector diff' \
    "$COMMAND_LOG"
  [ "$status" -eq 0 ]
}

# The commented example in the default allowlist quotes one of these messages verbatim: a
# comment must never approve anything.
@test "a schema bump with unapproved breaking changes fails and names each one" {
  write_env "$SANDBOX/.env.example" v3.0.0
  export FAKE_INSPECTOR_MODE='breaking'

  run_gate
  [ "$status" -eq 1 ]
  assert_output_contains 'introduces breaking changes for this client'
  assert_output_contains '  Enum value B was removed from enum E'
  assert_output_contains '  Field c was removed from object type Query'
  assert_output_contains 'graphql-breaking-changes-approved.txt'
}

@test "breaking changes that are all approved by exact message pass" {
  write_env "$SANDBOX/.env.example" v3.0.0
  export FAKE_INSPECTOR_MODE='breaking'
  printf '# enum B was never sent by this client\nEnum value B was removed from enum E\n# field c is not queried\nField c was removed from object type Query   \n' \
    > "$ALLOWLIST"

  run_gate
  [ "$status" -eq 0 ]
  assert_output_contains 'all 2 breaking changes between GraphQL v2.7.1 and v3.0.0 are approved'
}

@test "approving only some breaking changes still fails on the rest" {
  write_env "$SANDBOX/.env.example" v3.0.0
  export FAKE_INSPECTOR_MODE='breaking'
  printf 'Enum value B was removed from enum E\n' > "$ALLOWLIST"

  run_gate
  [ "$status" -eq 1 ]
  assert_output_contains '  Field c was removed from object type Query'
  [[ "$output" != *'  Enum value B was removed from enum E'* ]]
}

# Matching is whole-line: a prefix or a substring of a finding approves nothing.
@test "a partial message approves nothing" {
  write_env "$SANDBOX/.env.example" v3.0.0
  export FAKE_INSPECTOR_MODE='breaking'
  printf 'Field c was removed\nEnum value B\n' > "$ALLOWLIST"

  run_gate
  [ "$status" -eq 1 ]
  assert_output_contains '  Field c was removed from object type Query'
  assert_output_contains '  Enum value B was removed from enum E'
}

# graphql-inspector exits 1 for its own failures too. Without a verdict line that matches the
# listed breaking changes, the run is a tool failure -- never an approved or clean diff.
@test "an inspector crash without a verdict fails closed" {
  write_env "$SANDBOX/.env.example" v2.8.0
  export FAKE_INSPECTOR_MODE='crash'

  run_gate
  [ "$status" -eq 1 ]
  assert_output_contains 'without a readable verdict'
}

@test "a verdict whose count disagrees with the listed changes fails closed" {
  write_env "$SANDBOX/.env.example" v2.8.0
  export FAKE_INSPECTOR_MODE='miscount'
  printf 'Field c was removed from object type Query\n' > "$ALLOWLIST"

  run_gate
  [ "$status" -eq 1 ]
  assert_output_contains 'without a readable verdict'
}

@test "a docker failure fails closed" {
  write_env "$SANDBOX/.env.example" v2.8.0
  export FAKE_INSPECTOR_MODE='daemon'

  run_gate
  [ "$status" -eq 1 ]
  assert_output_contains 'graphql-inspector failed (exit 125)'
}

@test "a failed schema download fails loudly instead of diffing an empty schema" {
  write_env "$SANDBOX/.env.example" v2.8.0
  export FAKE_CURL_FAIL=1

  run_gate
  [ "$status" -eq 1 ]
  assert_output_contains 'could not fetch the GraphQL schema pinned at v2.7.1'
}

@test "an empty schema download fails loudly" {
  write_env "$SANDBOX/.env.example" v2.8.0
  export FAKE_CURL_EMPTY=1

  run_gate
  [ "$status" -eq 1 ]
  assert_output_contains 'the GraphQL schema fetched for v2.7.1 is empty'
}

@test "a schema that streamed past the size cap is rejected" {
  write_env "$SANDBOX/.env.example" v2.8.0
  export CONTRACT_SPEC_MAX_BYTES=8

  run_gate
  [ "$status" -eq 1 ]
  assert_output_contains 'exceeds 8 bytes'
}

@test "both schema fetches are bounded in time and size" {
  write_env "$SANDBOX/.env.example" v2.8.0

  run_gate
  [ "$status" -eq 0 ]

  run grep -c -- '--connect-timeout' "$COMMAND_LOG"
  [ "$output" -eq 2 ]

  run grep -c -- '--max-time' "$COMMAND_LOG"
  [ "$output" -eq 2 ]

  run grep -c -- '--max-filesize' "$COMMAND_LOG"
  [ "$output" -eq 2 ]
}

@test "an unreadable base ref fails loudly instead of skipping as a pass" {
  write_env "$SANDBOX/.env.example" v2.8.0
  export FAKE_GIT_SHOW_FAIL=1

  run_gate
  [ "$status" -eq 1 ]
  assert_output_contains 'cannot read .env.example or .env at origin/main'
}

@test "a base ref that predates the .env untracking is read from its .env" {
  write_env "$SANDBOX/.env.example" v2.8.0
  export FAKE_BASE_PREDATES_TEMPLATE=1
  export FAKE_BASE_PIN='v2.8.0'

  run_gate
  [ "$status" -eq 0 ]
  assert_output_contains 'no GRAPHQL_SCHEMA_VERSION bump'
  assert_log_contains 'git show origin/main:.env'
}

@test "the base schema is fetched with the base ref's own URL template" {
  write_env "$SANDBOX/.env.example" v2.8.0
  export FAKE_BASE_SDL_URL='https://old.example.invalid/${GRAPHQL_SCHEMA_VERSION}/schema.graphql'

  run_gate
  [ "$status" -eq 0 ]
  assert_log_contains 'https://old.example.invalid/v2.7.1/schema.graphql'
  assert_log_contains 'user-service/v2.8.0/.github/graphql-spec/spec'
}

@test "a URL template without the version placeholder fails the gate" {
  {
    printf 'GRAPHQL_SCHEMA_VERSION=%s\n' v2.8.0
    printf 'GRAPHQL_SCHEMA_URL=%s\n' 'https://raw.githubusercontent.com/x/y/v2.7.1/spec'
  } > "$SANDBOX/.env.example"

  run_gate
  [ "$status" -eq 1 ]
  assert_output_contains 'must contain the ${GRAPHQL_SCHEMA_VERSION} placeholder'
}

@test "a missing approved-breaking-changes file fails the gate" {
  write_env "$SANDBOX/.env.example" v2.8.0
  rm "$ALLOWLIST"

  run_gate
  [ "$status" -eq 1 ]
  assert_output_contains 'graphql-breaking-changes-approved.txt is missing'
}

@test "a parent-relative allowlist override is rejected so overrides stay reviewable" {
  write_env "$SANDBOX/.env.example" v2.8.0

  run env \
    PATH="$STUB_BIN_DIR:$PATH" \
    COMMAND_LOG="$COMMAND_LOG" \
    FAKE_BASE_PIN="$FAKE_BASE_PIN" \
    FAKE_BASE_SDL_URL="$FAKE_BASE_SDL_URL" \
    FAKE_INSPECTOR_MODE=clean \
    GRAPHQL_CONTRACT_BREAKING_ALLOWLIST='../outside/approved.txt' \
    bash -c 'cd "$1" && shift && "$@"' _ "$SANDBOX" sh "$SCRIPT"
  [ "$status" -eq 1 ]
  assert_output_contains 'must stay inside the checkout'
}

# The committed allowlist must be inert: dropping its comments and blank lines has to leave
# nothing, or the repository would ship with a live approval while claiming none.
@test "the committed GraphQL allowlist approves nothing today" {
  run sed -e '/^[[:space:]]*#/d' -e '/^[[:space:]]*$/d' \
    "$PROJECT_ROOT/src/api/contracts/graphql-breaking-changes-approved.txt"
  [ "$status" -eq 0 ]
  [ -z "$output" ]
}
