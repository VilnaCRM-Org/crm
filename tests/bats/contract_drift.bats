#!/usr/bin/env bats

# Coverage for the scheduled upstream contract drift monitor (issue #178):
# scripts/ci/check-contract-drift.sh and the shared tracking-issue upsert it delegates to
# (scripts/ci/upsert-audit-issue.sh), wired as `make check-contract-drift`.

load './test_helper.bash'

setup() {
  setup_stub_dir

  SCRIPT="$PROJECT_ROOT/scripts/ci/check-contract-drift.sh"
  SANDBOX="$BATS_TEST_TMPDIR/sandbox"
  mkdir -p "$SANDBOX/scripts/ci"
  cp "$PROJECT_ROOT/scripts/ci/check-contract-drift.sh" "$SANDBOX/scripts/ci/"
  cp "$PROJECT_ROOT/scripts/ci/upsert-audit-issue.sh" "$SANDBOX/scripts/ci/"
  SCRIPT="$SANDBOX/scripts/ci/check-contract-drift.sh"

  write_pins v2.7.1 v2.7.1

  cat > "$STUB_BIN_DIR/gh" <<'EOF'
#!/usr/bin/env bash
printf 'gh %s\n' "$*" >> "${COMMAND_LOG:?}"

if [ "$1" = "api" ]; then
  case "$2" in
    *releases/latest*)
      if [ -n "${FAKE_GH_RELEASES_FAIL:-}" ]; then
        printf '%s\n' "${FAKE_GH_RELEASES_FAIL}" >&2
        exit 1
      fi
      [ -z "${FAKE_GH_RELEASE_TAG:-}" ] || printf '%s\n' "$FAKE_GH_RELEASE_TAG"
      exit 0
      ;;
    *tags*)
      if [ -n "${FAKE_GH_TAGS_FAIL:-}" ]; then
        printf '%s\n' "${FAKE_GH_TAGS_FAIL}" >&2
        exit 1
      fi
      printf '%s\n' ${FAKE_GH_TAGS:-}
      exit 0
      ;;
  esac
fi

if [ "$1" = "issue" ] && [ "$2" = "list" ]; then
  [ -z "${FAKE_GH_ISSUE_NUMBER:-}" ] || printf '%s\n' "$FAKE_GH_ISSUE_NUMBER"
  exit 0
fi

if [ "$1" = "issue" ] && [ "$2" = "view" ]; then
  printf '%s\n' "${FAKE_GH_ISSUE_BODY:-}"
  exit 0
fi

exit 0
EOF
  chmod +x "$STUB_BIN_DIR/gh"
}

write_pins() {
  {
    printf 'GRAPHQL_SCHEMA_VERSION=%s\n' "$1"
    printf 'OPENAPI_SPEC_VERSION=%s\n' "$2"
    printf 'OPENAPI_SPEC_URL=https://raw.githubusercontent.com/VilnaCRM-Org/user-service/${OPENAPI_SPEC_VERSION}/spec.yaml\n'
  } > "$SANDBOX/.env"
}

run_monitor() {
  run env \
    PATH="$STUB_BIN_DIR:$PATH" \
    COMMAND_LOG="$COMMAND_LOG" \
    FAKE_GH_RELEASE_TAG="${FAKE_GH_RELEASE_TAG:-}" \
    FAKE_GH_TAGS="${FAKE_GH_TAGS:-}" \
    FAKE_GH_RELEASES_FAIL="${FAKE_GH_RELEASES_FAIL:-}" \
    FAKE_GH_TAGS_FAIL="${FAKE_GH_TAGS_FAIL:-}" \
    FAKE_GH_ISSUE_NUMBER="${FAKE_GH_ISSUE_NUMBER:-}" \
    FAKE_GH_ISSUE_BODY="${FAKE_GH_ISSUE_BODY:-}" \
    bash -c 'cd "$1" && shift && "$@"' _ "$SANDBOX" sh "$SCRIPT"
}

@test "pins level with upstream report no drift and open no issue" {
  export FAKE_GH_RELEASE_TAG='v2.7.1'
  export FAKE_GH_TAGS='v2.7.1 v2.7.0'

  run_monitor
  [ "$status" -eq 0 ]
  assert_output_contains 'contract pins are current; no drift'

  run grep -c 'gh issue' "$COMMAND_LOG"
  [ "$output" -eq 0 ]
}

@test "a stale releases/latest never hides a higher tag" {
  # The real upstream publishes releases out of order: releases/latest is v0.8.0 while the
  # highest tag is v2.8.0. Trusting releases/latest alone would report zero drift forever.
  export FAKE_GH_RELEASE_TAG='v0.8.0'
  export FAKE_GH_TAGS='v2.8.0 v2.7.1 v1.4.4 v0.8.0'

  run_monitor
  [ "$status" -eq 0 ]
  assert_output_contains 'latest=v2.8.0'
  assert_log_contains 'gh issue create'
}

@test "a bare version gap opens the tracking issue without failing the run" {
  export FAKE_GH_RELEASE_TAG='v2.8.0'
  export FAKE_GH_TAGS='v2.8.0 v2.7.1'

  run_monitor
  [ "$status" -eq 0 ]
  assert_log_contains 'gh label create contract-drift'
  assert_log_contains 'gh issue create --label contract-drift'
  assert_output_contains 'opened a contract-drift tracking issue'
}

@test "an unchanged upstream tag stays quiet on the existing issue" {
  export FAKE_GH_RELEASE_TAG='v2.8.0'
  export FAKE_GH_TAGS='v2.8.0 v2.7.1'
  export FAKE_GH_ISSUE_NUMBER=42
  export FAKE_GH_ISSUE_BODY='<!-- last-seen: v2.8.0 -->'

  run_monitor
  [ "$status" -eq 0 ]
  assert_output_contains 'issue #42 already records this state'

  run grep -c 'gh issue comment' "$COMMAND_LOG"
  [ "$output" -eq 0 ]
}

@test "a moved upstream tag comments on and updates the existing issue" {
  export FAKE_GH_RELEASE_TAG='v2.9.0'
  export FAKE_GH_TAGS='v2.9.0 v2.8.0 v2.7.1'
  export FAKE_GH_ISSUE_NUMBER=42
  export FAKE_GH_ISSUE_BODY='<!-- last-seen: v2.8.0 -->'

  run_monitor
  [ "$status" -eq 0 ]
  assert_log_contains 'gh issue comment 42'
  assert_log_contains 'gh issue edit 42'
  assert_output_contains 'updated issue #42'
}

@test "an upstream lookup that resolves nothing fails the run loudly" {
  export FAKE_GH_RELEASES_FAIL='gh: Not Found (HTTP 404)'
  export FAKE_GH_TAGS='v0.0.0'

  run_monitor
  [ "$status" -eq 1 ]
  assert_output_contains 'is ahead of the resolved upstream latest'
}

# A half-failed lookup must never be laundered into "no drift": trusting a stale
# releases/latest when the tag lookup broke is exactly the silent-monitor failure this
# gate exists to prevent.
@test "a failed tag lookup fails the run instead of trusting releases/latest alone" {
  export FAKE_GH_RELEASE_TAG='v2.7.1'
  export FAKE_GH_TAGS_FAIL='gh: API rate limit exceeded (HTTP 403)'

  run_monitor
  [ "$status" -eq 1 ]
  assert_output_contains 'the tag lookup for'
  assert_output_contains 'refusing to report drift from releases/latest alone'
}

@test "a transport failure on releases/latest fails the run" {
  export FAKE_GH_RELEASES_FAIL='gh: API rate limit exceeded (HTTP 403)'
  export FAKE_GH_TAGS='v2.8.0'

  run_monitor
  [ "$status" -eq 1 ]
  assert_output_contains 'the releases/latest lookup for'
}

# An upstream that tags without publishing releases 404s here; that is a legitimate empty,
# not a broken lookup, so the tag list still decides.
@test "a 404 on releases/latest still resolves the latest version from tags" {
  export FAKE_GH_RELEASES_FAIL='gh: Not Found (HTTP 404)'
  export FAKE_GH_TAGS='v2.8.0 v2.7.1'

  run_monitor
  [ "$status" -eq 0 ]
  assert_output_contains 'latest=v2.8.0'
  assert_log_contains 'gh issue create --label contract-drift'
}

@test "a pin ahead of everything upstream is treated as a defect, not as drift" {
  write_pins v3.5.0 v3.5.0
  export FAKE_GH_RELEASE_TAG='v2.8.0'
  export FAKE_GH_TAGS='v2.8.0'

  run_monitor
  [ "$status" -eq 1 ]
  assert_output_contains 'is ahead of the resolved upstream latest'
}

@test "a body without the marker is refused so the next run can still detect a change" {
  printf 'no marker here\n' > "$BATS_TEST_TMPDIR/body.md"

  run env \
    PATH="$STUB_BIN_DIR:$PATH" \
    COMMAND_LOG="$COMMAND_LOG" \
    AUDIT_ISSUE_LABEL=contract-drift \
    AUDIT_ISSUE_TITLE='drift' \
    AUDIT_ISSUE_BODY_FILE="$BATS_TEST_TMPDIR/body.md" \
    AUDIT_ISSUE_MARKER='last-seen: v9.9.9' \
    AUDIT_ISSUE_COMMENT='moved' \
    sh "$SANDBOX/scripts/ci/upsert-audit-issue.sh"
  [ "$status" -eq 1 ]
  assert_output_contains 'must embed AUDIT_ISSUE_MARKER'
}
