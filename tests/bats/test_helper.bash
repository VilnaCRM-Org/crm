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

create_gh_stub() {
  cat > "$STUB_BIN_DIR/gh" <<'EOF'
#!/usr/bin/env bash
printf 'gh %s\n' "$*" >> "${COMMAND_LOG:?}"

if [ "$1" = "issue" ] && [ "$2" = "list" ]; then
  case " $* " in
    *" --label ${FAKE_GH_EXPECTED_LABEL:-main-is-red} --state open "*)
      if [ -n "${FAKE_GH_OPEN_ISSUE:-}" ]; then
        printf '%s\n' "$FAKE_GH_OPEN_ISSUE"
      else
        case " $* " in
          *'// empty'*) ;;
          *) printf 'null\n' ;;
        esac
      fi
      ;;
  esac
fi

exit 0
EOF

  chmod +x "$STUB_BIN_DIR/gh"
}

create_git_stub() {
  cat > "$STUB_BIN_DIR/git" <<'EOF'
#!/usr/bin/env bash
printf 'git %s\n' "$*" >> "${COMMAND_LOG:?}"

if [ "$1" = "rev-list" ]; then
  printf '%s\n' ${FAKE_GIT_REVISIONS:-}
  exit 0
fi

if [ "$1" = "log" ]; then
  case " $* " in
    *" --format=%ae "*)
      printf '%s\n' "${FAKE_GIT_AUTHOR:-dev@example.test}"
      ;;
    *)
      printf '%s\n' "${FAKE_GIT_MESSAGE:-chore(#1): stub commit}"
      ;;
  esac
  exit 0
fi

exit 0
EOF

  chmod +x "$STUB_BIN_DIR/git"
}

create_gh_stub() {
  cat > "$STUB_BIN_DIR/gh" <<'EOF'
#!/usr/bin/env bash
printf 'gh %s\n' "$*" >> "${COMMAND_LOG:?}"

# Stands in for `gh api repos/<repo>/commits/<sha> --jq <verified-and-bot filter>`. The real
# call prints a login only when GitHub reports the commit signature-verified AND the author a
# `[bot]` account, so the fixture prints one only when the test says both hold.
printf '%s' "${FAKE_GH_VERIFIED_BOT_LOGIN:-}"
exit 0
EOF

  chmod +x "$STUB_BIN_DIR/gh"
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

  cat > "$MAKEFILE_SANDBOX/scripts/check-env-sync.sh" <<'EOF'
#!/usr/bin/env sh
printf 'check-env-sync.sh\n' >> "${COMMAND_LOG:?}"
exit 0
EOF

  cat > "$MAKEFILE_SANDBOX/scripts/ci/lint-commit-range.sh" <<'EOF'
#!/usr/bin/env sh
printf 'lint-commit-range.sh %s\n' "$*" >> "${COMMAND_LOG:?}"
exit 0
EOF

  chmod +x \
    "$MAKEFILE_SANDBOX/scripts/lint-metrics.sh" \
    "$MAKEFILE_SANDBOX/scripts/get-pr-comments.sh" \
    "$MAKEFILE_SANDBOX/scripts/ci/run-parallel-lint.sh" \
    "$MAKEFILE_SANDBOX/scripts/ci/run-parallel-tests.sh" \
    "$MAKEFILE_SANDBOX/scripts/ci/lint-commit-range.sh" \
    "$MAKEFILE_SANDBOX/scripts/check-env-sync.sh"
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
  create_gh_stub
  create_git_stub
  create_gh_stub
  create_generic_stub tar

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

  # shellcheck disable=SC2016
  run env \
    PATH="$STUB_BIN_DIR:$PATH" \
    COMMAND_LOG="$COMMAND_LOG" \
    bash -c 'cd "$1" && shift && "$@"' _ "$SCRIPT_SANDBOX" "$script_path" "$@"
}

create_memlab_stub_module() {
  local module_path="$1"
  local body="$2"
  local module_dir="$MEMLAB_SANDBOX/node_modules/$module_path"

  mkdir -p "$module_dir"
  printf '%s\n' "$body" > "$module_dir/index.js"
  printf '{ "name": "%s", "version": "0.0.0", "main": "index.js" }\n' "$module_path" \
    > "$module_dir/package.json"
}

setup_memlab_test_env() {
  export MEMLAB_SANDBOX="$BATS_TEST_TMPDIR/memlab-sandbox"
  export MEMLAB_RUNNER_DIR="$MEMLAB_SANDBOX/tests/memory-leak"

  mkdir -p "$MEMLAB_RUNNER_DIR/tests"
  cp -R "$PROJECT_ROOT/tests/memory-leak/utils" "$MEMLAB_RUNNER_DIR/utils"
  cp "$PROJECT_ROOT/tests/memory-leak/run-memlab-tests.js" "$MEMLAB_RUNNER_DIR/run-memlab-tests.js"
  cp "$PROJECT_ROOT/tests/memory-leak/leak-allowlist.json" "$MEMLAB_RUNNER_DIR/leak-allowlist.json"

  cat > "$MEMLAB_RUNNER_DIR/utils/initialize-localization.js" <<'STUB'
module.exports = { initializeLocalization: async () => {}, i18n: {} };
STUB

  create_memlab_stub_module dotenv 'module.exports = { config: () => ({}) };'
  create_memlab_stub_module '@memlab/heap-analysis' \
    'module.exports = { StringAnalysis: class StringAnalysis {} };'
  create_memlab_stub_module '@memlab/api' "$(
    cat <<'STUB'
module.exports = {
  run: async () => ({ runResult: { cleanup: () => {} } }),
  analyze: async () => {},
  findLeaks: async () => JSON.parse(process.env.FAKE_MEMLAB_LEAKS || '[]'),
};
STUB
  )"
}

write_memlab_scenario_file() {
  local file_name="$1"
  local body="$2"

  printf '%s\n' "$body" > "$MEMLAB_RUNNER_DIR/tests/$file_name"
}

write_memlab_allowlist() {
  printf '%s\n' "$1" > "$MEMLAB_RUNNER_DIR/leak-allowlist.json"
}

run_memlab_runner() {
  cd "$MEMLAB_SANDBOX" || return 1

  run env \
    FAKE_MEMLAB_LEAKS="${FAKE_MEMLAB_LEAKS:-[]}" \
    node tests/memory-leak/run-memlab-tests.js
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
