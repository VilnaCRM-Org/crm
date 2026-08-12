#!/usr/bin/env bats

# Coverage for the semantic OpenAPI breaking-change gate (issue #177):
# scripts/ci/contract-diff.sh, wired as `make contract-diff`.
# Mirrors the fixture-per-path approach of lockfile_registries.bats.

load './test_helper.bash'

SPEC_URL='https://raw.githubusercontent.com/VilnaCRM-Org/user-service/${OPENAPI_SPEC_VERSION}/spec.yaml'

setup() {
  setup_stub_dir

  SCRIPT="$PROJECT_ROOT/scripts/ci/contract-diff.sh"
  SANDBOX="$BATS_TEST_TMPDIR/sandbox"
  mkdir -p "$SANDBOX/src/api/contracts"
  printf '# no approved breaking changes\n' > "$SANDBOX/src/api/contracts/breaking-changes-approved.txt"

  write_env "$SANDBOX/.env" v2.7.1
  export FAKE_BASE_PIN='v2.7.1'
  export FAKE_BASE_SPEC_URL="$SPEC_URL"

  cat > "$STUB_BIN_DIR/git" <<'EOF'
#!/usr/bin/env bash
printf 'git %s\n' "$*" >> "${COMMAND_LOG:?}"
if [ "$1" = "show" ]; then
  if [ -n "${FAKE_GIT_SHOW_FAIL:-}" ]; then
    exit 128
  fi
  printf 'OPENAPI_SPEC_VERSION=%s\n' "${FAKE_BASE_PIN:?}"
  printf 'OPENAPI_SPEC_URL=%s\n' "${FAKE_BASE_SPEC_URL:?}"
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
[ -z "$out" ] || printf 'openapi: 3.0.0\n' > "$out"
exit 0
EOF

  cat > "$STUB_BIN_DIR/docker" <<'EOF'
#!/usr/bin/env bash
printf 'docker %s\n' "$*" >> "${COMMAND_LOG:?}"
prev=''
for arg in "$@"; do
  if [ "$prev" = "--err-ignore" ] && [ -n "${ERR_IGNORE_COPY:-}" ]; then
    cp "$arg" "$ERR_IGNORE_COPY"
  fi
  prev="$arg"
done
for arg in "$@"; do
  if [ "$arg" = "breaking" ]; then
    exit "${FAKE_OASDIFF_BREAKING_EXIT:-0}"
  fi
  if [ "$arg" = "changelog" ]; then
    printf 'changed: GET /api/health\n'
    exit 0
  fi
done
exit 0
EOF

  chmod +x "$STUB_BIN_DIR/git" "$STUB_BIN_DIR/curl" "$STUB_BIN_DIR/docker"
}

write_env() {
  {
    printf 'OPENAPI_SPEC_VERSION=%s\n' "$2"
    printf 'OPENAPI_SPEC_URL=%s\n' "$SPEC_URL"
  } > "$1"
}

run_gate() {
  run env \
    PATH="$STUB_BIN_DIR:$PATH" \
    COMMAND_LOG="$COMMAND_LOG" \
    FAKE_BASE_PIN="${FAKE_BASE_PIN:-}" \
    FAKE_BASE_SPEC_URL="${FAKE_BASE_SPEC_URL:-}" \
    FAKE_GIT_SHOW_FAIL="${FAKE_GIT_SHOW_FAIL:-}" \
    FAKE_CURL_FAIL="${FAKE_CURL_FAIL:-}" \
    FAKE_OASDIFF_BREAKING_EXIT="${FAKE_OASDIFF_BREAKING_EXIT:-0}" \
    ERR_IGNORE_COPY="${ERR_IGNORE_COPY:-}" \
    GITHUB_STEP_SUMMARY="$BATS_TEST_TMPDIR/summary.md" \
    bash -c 'cd "$1" && shift && "$@"' _ "$SANDBOX" sh "$SCRIPT"
}

run_gate_without_step_summary() {
  run env -u GITHUB_STEP_SUMMARY \
    PATH="$STUB_BIN_DIR:$PATH" \
    COMMAND_LOG="$COMMAND_LOG" \
    FAKE_BASE_PIN="${FAKE_BASE_PIN:-}" \
    FAKE_BASE_SPEC_URL="${FAKE_BASE_SPEC_URL:-}" \
    FAKE_OASDIFF_BREAKING_EXIT=0 \
    bash -c 'cd "$1" && shift && sh "$1" > "$2" 2>&1' _ "$SANDBOX" "$SCRIPT" \
    "$BATS_TEST_TMPDIR/stdout.txt"
}

@test "an unchanged pin fast-exits 0 without fetching or diffing anything" {
  run_gate
  [ "$status" -eq 0 ]
  assert_output_contains 'no OPENAPI_SPEC_VERSION bump (v2.7.1)'

  run grep -c 'curl' "$COMMAND_LOG"
  [ "$output" -eq 0 ]
}

@test "a clean pin bump passes and records the changelog in the job summary" {
  write_env "$SANDBOX/.env" v2.8.0

  run_gate
  [ "$status" -eq 0 ]
  assert_output_contains 'no ERR-level breaking changes between OpenAPI v2.7.1 and v2.8.0'
  assert_log_contains 'breaking'
  assert_log_contains '--err-ignore reports/contract-diff/err-ignore.txt'

  run grep -F 'OpenAPI contract changelog: v2.7.1 -> v2.8.0' "$BATS_TEST_TMPDIR/summary.md"
  [ "$status" -eq 0 ]
}

# oasdiff's --err-ignore file has no comment syntax: every line is a rule, matched by
# substring containment against the flattened finding. Handing it the human-readable
# allowlist would make the file's own format documentation a live suppression.
@test "the allowlist handed to oasdiff is comment-stripped, never the documented file" {
  write_env "$SANDBOX/.env" v2.8.0
  export ERR_IGNORE_COPY="$BATS_TEST_TMPDIR/err-ignore-seen.txt"
  printf '# in api get /api/health api path removed without deprecation\nin api get /api/users something else\n' \
    > "$SANDBOX/src/api/contracts/breaking-changes-approved.txt"

  run_gate
  [ "$status" -eq 0 ]

  run grep -c '^[[:space:]]*#' "$ERR_IGNORE_COPY"
  [ "$output" -eq 0 ]

  run grep -F 'in api get /api/users something else' "$ERR_IGNORE_COPY"
  [ "$status" -eq 0 ]
}

@test "a comment-only allowlist yields an empty ignore file instead of aborting the gate" {
  write_env "$SANDBOX/.env" v2.8.0
  export ERR_IGNORE_COPY="$BATS_TEST_TMPDIR/err-ignore-seen.txt"

  run_gate
  [ "$status" -eq 0 ]

  run test -s "$ERR_IGNORE_COPY"
  [ "$status" -ne 0 ]
}

@test "the changelog is not corrupted when stdout is redirected and no step summary is set" {
  write_env "$SANDBOX/.env" v2.8.0

  run_gate_without_step_summary
  [ "$status" -eq 0 ]

  run grep -F 'OpenAPI contract changelog: v2.7.1 -> v2.8.0' "$BATS_TEST_TMPDIR/stdout.txt"
  [ "$status" -eq 0 ]

  run grep -F 'diffing OpenAPI v2.7.1 -> v2.8.0' "$BATS_TEST_TMPDIR/stdout.txt"
  [ "$status" -eq 0 ]
}

@test "a pin bump with ERR-level breaking changes fails the gate" {
  write_env "$SANDBOX/.env" v3.0.0
  export FAKE_OASDIFF_BREAKING_EXIT=1

  run_gate
  [ "$status" -eq 1 ]
  assert_output_contains 'introduces ERR-level breaking changes'
  assert_output_contains 'breaking-changes-approved.txt'
}

@test "an unreadable base ref fails loudly instead of skipping as a pass" {
  write_env "$SANDBOX/.env" v2.8.0
  export FAKE_GIT_SHOW_FAIL=1

  run_gate
  [ "$status" -eq 1 ]
  assert_output_contains 'cannot read .env at origin/main'
}

@test "a failed spec download fails loudly instead of diffing an empty contract" {
  write_env "$SANDBOX/.env" v2.8.0
  export FAKE_CURL_FAIL=1

  run_gate
  [ "$status" -eq 1 ]
  assert_output_contains 'could not fetch the OpenAPI spec'
}

@test "a missing approved-breaking-changes file fails the gate" {
  write_env "$SANDBOX/.env" v2.8.0
  rm "$SANDBOX/src/api/contracts/breaking-changes-approved.txt"

  run_gate
  [ "$status" -eq 1 ]
  assert_output_contains 'breaking-changes-approved.txt is missing'
}

# Each side is fetched with its own template, so a bump that also relocates the upstream spec
# still compares the two real contracts instead of the head URL against itself.
@test "the base spec is fetched with the base ref's own URL template" {
  write_env "$SANDBOX/.env" v2.8.0
  export FAKE_BASE_SPEC_URL='https://old.example.invalid/${OPENAPI_SPEC_VERSION}/spec.yaml'

  run_gate
  [ "$status" -eq 0 ]
  assert_log_contains 'https://old.example.invalid/v2.7.1/spec.yaml'
  assert_log_contains 'user-service/v2.8.0/spec.yaml'
}

# Without the placeholder both fetches resolve to the same document and every bump would
# report "no breaking changes" -- a false green rather than a gate.
@test "a URL template without the version placeholder fails the gate" {
  {
    printf 'OPENAPI_SPEC_VERSION=%s\n' v2.8.0
    printf 'OPENAPI_SPEC_URL=%s\n' 'https://raw.githubusercontent.com/x/y/v2.7.1/spec.yaml'
  } > "$SANDBOX/.env"

  run_gate
  [ "$status" -eq 1 ]
  assert_output_contains 'must contain the ${OPENAPI_SPEC_VERSION} placeholder'
}

# The committed allowlist must be inert: stripping its comments has to leave nothing, or the
# repository would ship with a live suppression while claiming to approve no breaking changes.
@test "the committed allowlist suppresses nothing today" {
  run sed '/^[[:space:]]*#/d' "$PROJECT_ROOT/src/api/contracts/breaking-changes-approved.txt"
  [ "$status" -eq 0 ]
  [ -z "$(printf '%s' "$output" | tr -d '[:space:]')" ]
}

@test "the committed allowlist documents the oasdiff ignore-line format" {
  run grep -F 'in api <METHOD> <PATH>' \
    "$PROJECT_ROOT/src/api/contracts/breaking-changes-approved.txt"
  [ "$status" -eq 0 ]
}

# An allowlist from outside the checkout would suppress findings without ever showing up in a
# pull-request diff, and the oasdiff container cannot read it either.
@test "a parent-relative override is rejected so overrides stay reviewable" {
  write_env "$SANDBOX/.env" v2.8.0

  run env \
    PATH="$STUB_BIN_DIR:$PATH" \
    COMMAND_LOG="$COMMAND_LOG" \
    FAKE_BASE_PIN="$FAKE_BASE_PIN" \
    FAKE_BASE_SPEC_URL="$FAKE_BASE_SPEC_URL" \
    CONTRACT_BREAKING_ALLOWLIST='../outside/approved.txt' \
    bash -c 'cd "$1" && shift && "$@"' _ "$SANDBOX" sh "$SCRIPT"
  [ "$status" -eq 1 ]
  assert_output_contains 'must stay inside the checkout'
}

@test "an absolute override is rejected too" {
  write_env "$SANDBOX/.env" v2.8.0

  run env \
    PATH="$STUB_BIN_DIR:$PATH" \
    COMMAND_LOG="$COMMAND_LOG" \
    FAKE_BASE_PIN="$FAKE_BASE_PIN" \
    FAKE_BASE_SPEC_URL="$FAKE_BASE_SPEC_URL" \
    CONTRACT_DIFF_DIR='/tmp/contract-diff' \
    bash -c 'cd "$1" && shift && "$@"' _ "$SANDBOX" sh "$SCRIPT"
  [ "$status" -eq 1 ]
  assert_output_contains 'must stay inside the checkout'
}
