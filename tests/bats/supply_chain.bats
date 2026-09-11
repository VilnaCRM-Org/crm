#!/usr/bin/env bats

load './test_helper.bash'

setup() {
  setup_stub_dir

  SANDBOX="$BATS_TEST_TMPDIR/sandbox"
  mkdir -p "$SANDBOX/scripts/ci"
  cp "$PROJECT_ROOT/scripts/ci/report-dependency-audit.sh" "$SANDBOX/scripts/ci/"
  cp "$PROJECT_ROOT/scripts/ci/dependency-audit-report.mjs" "$SANDBOX/scripts/ci/"
  cp "$PROJECT_ROOT/scripts/ci/upsert-audit-issue.sh" "$SANDBOX/scripts/ci/"
  cp "$PROJECT_ROOT/scripts/ci/assert-secret-scan-detects.sh" "$SANDBOX/scripts/ci/"
  cp "$PROJECT_ROOT/.gitleaks.toml" "$SANDBOX/.gitleaks.toml"
  : > "$SANDBOX/bun.lock"

  export TRIVY_RUN='docker run --rm'
  export TRIVY_IMAGE='trivy:test'
  export TRIVY_ARGS='--severity HIGH,CRITICAL'
  export GITLEAKS_IMAGE='gitleaks:test'
  export DEPENDENCY_AUDIT_REPORT_DIR="$BATS_TEST_TMPDIR/reports"

  cat > "$STUB_BIN_DIR/docker" <<'EOF'
#!/usr/bin/env bash
printf 'docker %s\n' "$*" >> "${COMMAND_LOG:?}"
if [ -n "${FAKE_GITLEAKS_RULE:-}" ]; then
  for arg in "$@"; do
    case "$arg" in
      *:/probe) printf '[{"RuleID": "%s"}]\n' "$FAKE_GITLEAKS_RULE" > "${arg%%:*}/report.json" ;;
    esac
  done
fi
if [ -n "${FAKE_DOCKER_EXIT:-}" ]; then
  exit "$FAKE_DOCKER_EXIT"
fi
if [ -n "${FAKE_TRIVY_JSON:-}" ]; then
  cat "$FAKE_TRIVY_JSON"
fi
exit 0
EOF
  chmod +x "$STUB_BIN_DIR/docker"

  cat > "$STUB_BIN_DIR/gh" <<'EOF'
#!/usr/bin/env bash
printf 'gh %s\n' "$*" >> "${COMMAND_LOG:?}"
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

write_trivy_json() {
  local path="$1"
  shift
  {
    printf '{"Results":[{"Target":"bun.lock","Type":"bun","Vulnerabilities":['
    local first=1
    for entry in "$@"; do
      IFS='|' read -r id pkg installed fixed severity title <<< "$entry"
      [ "$first" -eq 1 ] || printf ','
      first=0
      printf '{"VulnerabilityID":"%s","PkgName":"%s","InstalledVersion":"%s","FixedVersion":"%s","Severity":"%s","Title":"%s"}' \
        "$id" "$pkg" "$installed" "$fixed" "$severity" "$title"
    done
    printf ']}]}'
  } > "$path"
}

@test "report-dependency-audit files a tracking issue with a table and a state marker" {
  write_trivy_json "$BATS_TEST_TMPDIR/trivy.json" \
    'CVE-2026-1|koa|3.0.3|3.1.2|HIGH|Koa DoS' \
    'CVE-2026-2|adm-zip|0.5.16|0.6.0|HIGH|adm-zip DoS'
  export FAKE_TRIVY_JSON="$BATS_TEST_TMPDIR/trivy.json"

  run env PATH="$STUB_BIN_DIR:$PATH" sh "$SANDBOX/scripts/ci/report-dependency-audit.sh"
  [ "$status" -eq 0 ]
  assert_log_contains 'docker run --rm trivy:test fs --severity HIGH,CRITICAL --include-dev-deps --exit-code 0 --format json bun.lock'
  assert_log_contains 'gh issue create --label dependency-audit --title Dependency audit: 2 fixable HIGH/CRITICAL advisories in the full lockfile'
  run grep -F '| koa | 3.0.3 | 3.1.2 | HIGH | CVE-2026-1 | Koa DoS |' "$DEPENDENCY_AUDIT_REPORT_DIR/issue-body.md"
  [ "$status" -eq 0 ]
  run grep -E '^<!-- audit-state:[0-9a-f]{16} -->$' "$DEPENDENCY_AUDIT_REPORT_DIR/issue-body.md"
  [ "$status" -eq 0 ]
}

@test "report-dependency-audit stays quiet when the tracking issue already records the state" {
  write_trivy_json "$BATS_TEST_TMPDIR/trivy.json" 'CVE-2026-1|koa|3.0.3|3.1.2|HIGH|Koa DoS'
  export FAKE_TRIVY_JSON="$BATS_TEST_TMPDIR/trivy.json"

  run env PATH="$STUB_BIN_DIR:$PATH" sh "$SANDBOX/scripts/ci/report-dependency-audit.sh"
  [ "$status" -eq 0 ]
  marker="$(sed -n 's|^<!-- \(audit-state:[0-9a-f]*\) -->$|\1|p' "$DEPENDENCY_AUDIT_REPORT_DIR/issue-body.md")"
  [ -n "$marker" ]

  reset_command_log
  export FAKE_GH_ISSUE_NUMBER=42
  export FAKE_GH_ISSUE_BODY="<!-- $marker -->"
  run env PATH="$STUB_BIN_DIR:$PATH" sh "$SANDBOX/scripts/ci/report-dependency-audit.sh"
  [ "$status" -eq 0 ]
  assert_output_contains 'issue #42 already records this state; staying quiet'
  run grep -F 'gh issue comment' "$COMMAND_LOG"
  [ "$status" -ne 0 ]
}

@test "report-dependency-audit comments when the advisory set changes" {
  write_trivy_json "$BATS_TEST_TMPDIR/trivy.json" 'CVE-2026-1|koa|3.0.3|3.1.2|HIGH|Koa DoS'
  export FAKE_TRIVY_JSON="$BATS_TEST_TMPDIR/trivy.json"
  export FAKE_GH_ISSUE_NUMBER=42
  export FAKE_GH_ISSUE_BODY='<!-- audit-state:0000000000000000 -->'

  run env PATH="$STUB_BIN_DIR:$PATH" sh "$SANDBOX/scripts/ci/report-dependency-audit.sh"
  [ "$status" -eq 0 ]
  assert_log_contains 'gh issue edit 42 --title Dependency audit: 1 fixable HIGH/CRITICAL advisories in the full lockfile'
  assert_log_contains 'gh issue comment 42 --body The advisory set changed: 1 fixable HIGH/CRITICAL findings'
}

@test "report-dependency-audit needs no tracking issue when the scan is clean" {
  write_trivy_json "$BATS_TEST_TMPDIR/trivy.json"
  export FAKE_TRIVY_JSON="$BATS_TEST_TMPDIR/trivy.json"

  run env PATH="$STUB_BIN_DIR:$PATH" sh "$SANDBOX/scripts/ci/report-dependency-audit.sh"
  [ "$status" -eq 0 ]
  assert_output_contains 'dependency audit clean; no tracking issue needed'
  run grep -F 'gh ' "$COMMAND_LOG"
  [ "$status" -ne 0 ]
}

@test "report-dependency-audit fails closed when the scanner itself fails" {
  export FAKE_DOCKER_EXIT=1

  run env PATH="$STUB_BIN_DIR:$PATH" sh "$SANDBOX/scripts/ci/report-dependency-audit.sh"
  [ "$status" -eq 1 ]
  assert_output_contains 'the dependency scan failed; refusing to report a clean audit'
  run grep -F 'gh ' "$COMMAND_LOG"
  [ "$status" -ne 0 ]
}

@test "report-dependency-audit refuses to run outside the Makefile-owned invocation" {
  unset TRIVY_IMAGE

  run env PATH="$STUB_BIN_DIR:$PATH" sh "$SANDBOX/scripts/ci/report-dependency-audit.sh"
  [ "$status" -ne 0 ]
  assert_output_contains 'TRIVY_IMAGE is required'
}

@test "the secret-scan positive control passes only on an attributed detection" {
  export FAKE_DOCKER_EXIT=1
  export FAKE_GITLEAKS_RULE=aws-access-token
  run env PATH="$STUB_BIN_DIR:$PATH" sh -c "cd '$SANDBOX' && sh scripts/ci/assert-secret-scan-detects.sh"
  [ "$status" -eq 0 ]
  assert_output_contains 'seeded credential detected'
  assert_log_contains "docker run --rm -v $SANDBOX/.secret-scan-control:/probe -v $SANDBOX/.gitleaks.toml:/gitleaks.toml:ro gitleaks:test dir --no-banner --exit-code 1 --config /gitleaks.toml --report-format json --report-path /probe/report.json /probe"
  [ ! -d "$SANDBOX/.secret-scan-control" ]

  reset_command_log
  export FAKE_DOCKER_EXIT=1
  export FAKE_GITLEAKS_RULE=generic-api-key
  run env PATH="$STUB_BIN_DIR:$PATH" sh -c "cd '$SANDBOX' && sh scripts/ci/assert-secret-scan-detects.sh"
  [ "$status" -eq 1 ]
  assert_output_contains 'did not attribute it to the seeded aws-access-token'
  [ ! -d "$SANDBOX/.secret-scan-control" ]

  reset_command_log
  unset FAKE_GITLEAKS_RULE
  export FAKE_DOCKER_EXIT=0
  run env PATH="$STUB_BIN_DIR:$PATH" sh -c "cd '$SANDBOX' && sh scripts/ci/assert-secret-scan-detects.sh"
  [ "$status" -eq 1 ]
  assert_output_contains 'exited 0 on a seeded credential instead of reporting it'
  [ ! -d "$SANDBOX/.secret-scan-control" ]

  reset_command_log
  export FAKE_DOCKER_EXIT=127
  run env PATH="$STUB_BIN_DIR:$PATH" sh -c "cd '$SANDBOX' && sh scripts/ci/assert-secret-scan-detects.sh"
  [ "$status" -eq 1 ]
  assert_output_contains 'exited 127 on a seeded credential instead of reporting it'
}

@test "report-sbom-failure files one tracking issue per release tag with the retry command" {
  cp "$PROJECT_ROOT/scripts/ci/report-sbom-failure.sh" "$SANDBOX/scripts/ci/"
  export SBOM_RELEASE_TAG=v9.9.9
  export SBOM_FAILURE_REPORT_DIR="$BATS_TEST_TMPDIR/sbom-report"
  export SBOM_FAILURE_RUN_URL='https://example.invalid/runs/1'

  run env PATH="$STUB_BIN_DIR:$PATH" sh "$SANDBOX/scripts/ci/report-sbom-failure.sh"
  [ "$status" -eq 0 ]
  assert_log_contains 'gh issue create --label sbom-missing --title Release v9.9.9 is missing its SBOM'
  run grep -F 'gh workflow run sbom.yml -f release_tag=v9.9.9' "$SBOM_FAILURE_REPORT_DIR/issue-body.md"
  [ "$status" -eq 0 ]
  run grep -F '<!-- release:v9.9.9 -->' "$SBOM_FAILURE_REPORT_DIR/issue-body.md"
  [ "$status" -eq 0 ]

  reset_command_log
  export FAKE_GH_ISSUE_NUMBER=7
  export FAKE_GH_ISSUE_BODY='<!-- release:v9.9.9 -->'
  run env PATH="$STUB_BIN_DIR:$PATH" sh "$SANDBOX/scripts/ci/report-sbom-failure.sh"
  [ "$status" -eq 0 ]
  assert_output_contains 'issue #7 already records this state; staying quiet'

  unset SBOM_RELEASE_TAG
  run env PATH="$STUB_BIN_DIR:$PATH" sh "$SANDBOX/scripts/ci/report-sbom-failure.sh"
  [ "$status" -ne 0 ]
  assert_output_contains 'SBOM_RELEASE_TAG is required'
}
