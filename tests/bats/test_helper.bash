#!/usr/bin/env bash

PROJECT_ROOT="$(cd "$(dirname "${BATS_TEST_FILENAME:-$0}")/../.." >/dev/null 2>&1 && pwd)"

setup_stub_dir() {
  export STUB_BIN_DIR="$BATS_TEST_TMPDIR/bin"
  export COMMAND_LOG="$BATS_TEST_TMPDIR/commands.log"

  mkdir -p "$STUB_BIN_DIR"
  : > "$COMMAND_LOG"

  export PATH="$STUB_BIN_DIR:$PATH"
}

reset_command_log() {
  : > "$COMMAND_LOG"
}

create_generic_stub() {
  local name="$1"

  cat > "$STUB_BIN_DIR/$name" <<'EOF'
#!/usr/bin/env bash
printf '%s %s\n' "$(basename "$0")" "$*" >> "${COMMAND_LOG:?}"
exit 0
EOF

  chmod +x "$STUB_BIN_DIR/$name"
}

create_curl_stub() {
  cat > "$STUB_BIN_DIR/curl" <<'EOF'
#!/usr/bin/env bash
printf 'curl %s\n' "$*" >> "${COMMAND_LOG:?}"
exit 0
EOF

  chmod +x "$STUB_BIN_DIR/curl"
}

create_docker_stub() {
  cat > "$STUB_BIN_DIR/docker" <<'EOF'
#!/usr/bin/env bash
printf 'docker %s\n' "$*" >> "${COMMAND_LOG:?}"

if [ "$1" = "network" ] && [ "$2" = "ls" ]; then
  if [ -n "${FAKE_DOCKER_NETWORK_EXISTS:-}" ]; then
    printf '%s\n' "${FAKE_DOCKER_NETWORK_EXISTS}"
  fi
  exit 0
fi

if [ "$1" = "create" ]; then
  printf 'fake-container-id\n'
  exit 0
fi

if [ "$1" = "images" ] && [ "${2:-}" = "-q" ]; then
  printf '%s\n' "${FAKE_DOCKER_IMAGE_ID:-fake-image-id}"
  exit 0
fi

if [ "$1" = "inspect" ]; then
  printf '%s\n' "${FAKE_DOCKER_HEALTH_STATUS:-healthy}"
  exit 0
fi

if [ "$1" = "compose" ]; then
  for index in "$@"; do
    if [ "$index" = "ps" ]; then
      case " $* " in
        *" --services "*)
          if [ -n "${FAKE_DOCKER_RUNNING_SERVICE:-}" ]; then
            printf '%s\n' "${FAKE_DOCKER_RUNNING_SERVICE}"
          fi
          exit 0
          ;;
        *" -q prod "*)
          printf '%s\n' "${FAKE_DOCKER_COMPOSE_CID:-fake-prod-cid}"
          exit 0
          ;;
        *)
          printf 'prod (healthy)\n'
          exit 0
          ;;
      esac
    fi
  done
fi

if [ ! -t 0 ]; then
  cat >/dev/null || true
fi

exit 0
EOF

  chmod +x "$STUB_BIN_DIR/docker"
}

create_make_stub() {
  cat > "$STUB_BIN_DIR/make" <<'EOF'
#!/usr/bin/env bash
printf 'make %s\n' "$*" >> "${COMMAND_LOG:?}"

target=""
for arg in "$@"; do
  case "$arg" in
    -*|*=*)
      ;;
    *)
      target="$arg"
      break
      ;;
  esac
done

if [ -n "${FAKE_MAKE_FAIL_TARGET:-}" ] && [ "$target" = "$FAKE_MAKE_FAIL_TARGET" ]; then
  exit 1
fi

exit 0
EOF

  chmod +x "$STUB_BIN_DIR/make"
}

create_makefile_script_stubs() {
  mkdir -p "$MAKEFILE_SANDBOX/scripts/ci"

  cat > "$MAKEFILE_SANDBOX/scripts/lint-metrics.sh" <<'EOF'
#!/usr/bin/env sh
printf 'lint-metrics.sh RCA_BIN=%s RCA_VERSION=%s RCA_SCOPE=%s RCA_EXCLUDES=%s METRICS_POLICY=%s\n' \
  "${RCA_BIN:-}" \
  "${RCA_VERSION:-}" \
  "${RCA_SCOPE:-}" \
  "${RCA_EXCLUDES:-}" \
  "${METRICS_POLICY:-}" >> "${COMMAND_LOG:?}"
exit 0
EOF

  cat > "$MAKEFILE_SANDBOX/scripts/get-pr-comments.sh" <<'EOF'
#!/usr/bin/env sh
printf 'get-pr-comments.sh %s\n' "$*" >> "${COMMAND_LOG:?}"
exit 0
EOF

  cat > "$MAKEFILE_SANDBOX/scripts/ci/run-parallel-lint.sh" <<'EOF'
#!/usr/bin/env sh
printf 'run-parallel-lint.sh %s\n' "$*" >> "${COMMAND_LOG:?}"
exit 0
EOF

  cat > "$MAKEFILE_SANDBOX/scripts/ci/run-parallel-tests.sh" <<'EOF'
#!/usr/bin/env sh
printf 'run-parallel-tests.sh %s\n' "$*" >> "${COMMAND_LOG:?}"
exit 0
EOF

  chmod +x \
    "$MAKEFILE_SANDBOX/scripts/lint-metrics.sh" \
    "$MAKEFILE_SANDBOX/scripts/get-pr-comments.sh" \
    "$MAKEFILE_SANDBOX/scripts/ci/run-parallel-lint.sh" \
    "$MAKEFILE_SANDBOX/scripts/ci/run-parallel-tests.sh"
}

setup_makefile_test_env() {
  setup_stub_dir

  create_docker_stub
  create_curl_stub
  create_generic_stub bun
  create_generic_stub qlty
  create_generic_stub tar
  create_generic_stub npx
  create_generic_stub node
  create_generic_stub gh

  export MAKEFILE_SANDBOX="$BATS_TEST_TMPDIR/makefile-sandbox"
  mkdir -p "$MAKEFILE_SANDBOX"
  cp "$PROJECT_ROOT/Makefile" "$MAKEFILE_SANDBOX/Makefile"
  create_makefile_script_stubs
}

setup_ci_script_test_env() {
  setup_stub_dir

  create_docker_stub
  create_make_stub
  create_generic_stub tar
  create_generic_stub grep
  create_generic_stub tee

  export SCRIPT_SANDBOX="$BATS_TEST_TMPDIR/script-sandbox"
  mkdir -p "$SCRIPT_SANDBOX"

  if [ -f "$PROJECT_ROOT/common-healthchecks.yml" ]; then
    cp "$PROJECT_ROOT/common-healthchecks.yml" "$SCRIPT_SANDBOX/common-healthchecks.yml"
  fi
}

run_make_target() {
  local target="$1"
  shift

  run env \
    PATH="$STUB_BIN_DIR:$PATH" \
    COMMAND_LOG="$COMMAND_LOG" \
    make -C "$MAKEFILE_SANDBOX" "$target" BIN_DIR="$STUB_BIN_DIR" "$@"
}

run_ci_script() {
  local script_path="$1"
  shift

  run env \
    PATH="$STUB_BIN_DIR:$PATH" \
    COMMAND_LOG="$COMMAND_LOG" \
    bash -c 'cd "$1" && shift && "$@"' _ "$SCRIPT_SANDBOX" "$script_path" "$@"
}

assert_log_contains() {
  local expected="$1"

  if ! grep -F -- "$expected" "$COMMAND_LOG" >/dev/null 2>&1; then
    echo "Expected command log to contain: $expected" >&2
    echo "--- command log ---" >&2
    cat "$COMMAND_LOG" >&2
    return 1
  fi
}

assert_output_contains() {
  local expected="$1"
  local actual_output="${output-}"

  if [[ "$actual_output" != *"$expected"* ]]; then
    echo "Expected output to contain: $expected" >&2
    echo "--- output ---" >&2
    printf '%s\n' "$actual_output" >&2
    return 1
  fi
}
