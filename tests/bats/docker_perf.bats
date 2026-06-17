#!/usr/bin/env bats
#
# Unit coverage for the pure subcommands of scripts/ci/docker_perf.sh.
#
# Per agents.md, every behavior is exercised across all three scenario classes:
#   (1) positive / happy path, (2) negative / failure path, (3) boundary / edge.
#
# Scope note — the `run` orchestration subcommand is intentionally NOT tested
# here.
#   Not applicable: `run` invokes real `docker buildx`, `dive` and `hadolint`;
#   that Docker orchestration is covered by the CI workflow, not by these unit
#   tests. Only the side-effect-free subcommands (evaluate, detect-exception,
#   render-report) are unit-tested below.

SCRIPT="$BATS_TEST_DIRNAME/../../scripts/ci/docker_perf.sh"

readonly MIB=1048576

# ---------------------------------------------------------------------------
# evaluate
# ---------------------------------------------------------------------------

@test "evaluate: PASS exit 0 when under budget and all gates clean (positive)" {
  run env CURRENT_BYTES=$((10 * MIB)) BUDGET_MB=100 TOLERANCE_PCT=0 \
    DIVE_STATUS=0 HADOLINT_STATUS=0 EXCEPTION_REASON="" \
    bash "$SCRIPT" evaluate
  [ "$status" -eq 0 ]
  [[ "$output" == PASS* ]]
  [[ "$output" == *"all gates within budget"* ]]
}

@test "evaluate: FAIL exit 1 when size exceeds budget and no exception (negative)" {
  run env CURRENT_BYTES=$((200 * MIB)) BUDGET_MB=100 TOLERANCE_PCT=0 \
    DIVE_STATUS=0 HADOLINT_STATUS=0 EXCEPTION_REASON="" \
    bash "$SCRIPT" evaluate
  [ "$status" -eq 1 ]
  [[ "$output" == FAIL* ]]
  [[ "$output" == *"exceeds limit"* ]]
  [[ "$output" == *"a documented exception is required"* ]]
}

@test "evaluate: EXCEPTION exit 0 when over budget but a documented exception applies (negative-waived)" {
  run env CURRENT_BYTES=$((200 * MIB)) BUDGET_MB=100 TOLERANCE_PCT=0 \
    DIVE_STATUS=0 HADOLINT_STATUS=0 EXCEPTION_REASON="glibc baseline only" \
    bash "$SCRIPT" evaluate
  [ "$status" -eq 0 ]
  [[ "$output" == EXCEPTION* ]]
  [[ "$output" == *"glibc baseline only"* ]]
  [[ "$output" == *"(waived)"* ]]
  [[ "$output" == *"exceeds limit"* ]]
}

@test "evaluate: PASS when size is exactly at the limit (boundary)" {
  # limit = 100 MiB * (100 + 0) / 100 = exactly 100 MiB.
  run env CURRENT_BYTES=$((100 * MIB)) BUDGET_MB=100 TOLERANCE_PCT=0 \
    DIVE_STATUS=0 HADOLINT_STATUS=0 EXCEPTION_REASON="" \
    bash "$SCRIPT" evaluate
  [ "$status" -eq 0 ]
  [[ "$output" == PASS* ]]
}

@test "evaluate: FAIL when size is one byte over the limit (boundary)" {
  run env CURRENT_BYTES=$((100 * MIB + 1)) BUDGET_MB=100 TOLERANCE_PCT=0 \
    DIVE_STATUS=0 HADOLINT_STATUS=0 EXCEPTION_REASON="" \
    bash "$SCRIPT" evaluate
  [ "$status" -eq 1 ]
  [[ "$output" == FAIL* ]]
  [[ "$output" == *"exceeds limit"* ]]
}

@test "evaluate: FAIL when only the dive gate fails (negative)" {
  run env CURRENT_BYTES=$((10 * MIB)) BUDGET_MB=100 TOLERANCE_PCT=0 \
    DIVE_STATUS=1 HADOLINT_STATUS=0 EXCEPTION_REASON="" \
    bash "$SCRIPT" evaluate
  [ "$status" -eq 1 ]
  [[ "$output" == FAIL* ]]
  [[ "$output" == *"dive layer-efficiency gate failed"* ]]
  [[ "$output" != *"hadolint"* ]]
  [[ "$output" != *"exceeds limit"* ]]
}

@test "evaluate: FAIL when only the hadolint gate fails (negative)" {
  run env CURRENT_BYTES=$((10 * MIB)) BUDGET_MB=100 TOLERANCE_PCT=0 \
    DIVE_STATUS=0 HADOLINT_STATUS=1 EXCEPTION_REASON="" \
    bash "$SCRIPT" evaluate
  [ "$status" -eq 1 ]
  [[ "$output" == FAIL* ]]
  [[ "$output" == *"hadolint best-practice gate failed"* ]]
  [[ "$output" != *"dive"* ]]
}

@test "evaluate: tolerance widens the limit so just-over-budget passes (boundary)" {
  # Raw budget = 1 MiB = 1048576 bytes. +10% tolerance => limit 1153433 bytes.
  # CURRENT is one byte above the raw budget but well within tolerance.
  run env CURRENT_BYTES=$((MIB + 1)) BUDGET_MB=1 TOLERANCE_PCT=10 \
    DIVE_STATUS=0 HADOLINT_STATUS=0 EXCEPTION_REASON="" \
    bash "$SCRIPT" evaluate
  [ "$status" -eq 0 ]
  [[ "$output" == PASS* ]]
}

@test "evaluate: at the tolerance-widened limit passes, one byte beyond fails (boundary)" {
  # limit = 1 MiB * 110 / 100 = 1153433 bytes (integer division).
  local limit=$(( MIB * 110 / 100 ))

  run env CURRENT_BYTES="$limit" BUDGET_MB=1 TOLERANCE_PCT=10 \
    DIVE_STATUS=0 HADOLINT_STATUS=0 EXCEPTION_REASON="" \
    bash "$SCRIPT" evaluate
  [ "$status" -eq 0 ]
  [[ "$output" == PASS* ]]

  run env CURRENT_BYTES="$((limit + 1))" BUDGET_MB=1 TOLERANCE_PCT=10 \
    DIVE_STATUS=0 HADOLINT_STATUS=0 EXCEPTION_REASON="" \
    bash "$SCRIPT" evaluate
  [ "$status" -eq 1 ]
  [[ "$output" == FAIL* ]]
}

# ---------------------------------------------------------------------------
# detect-exception
# ---------------------------------------------------------------------------

@test "detect-exception: extracts the inline marker reason verbatim (positive)" {
  local df="$BATS_TEST_TMPDIR/Dockerfile.marker"
  cat > "$df" <<'EOF'
FROM alpine
# perf-exception: large base image is required for native deps
RUN true
EOF

  run bash "$SCRIPT" detect-exception "$df"
  [ "$status" -eq 0 ]
  [ "$output" = "large base image is required for native deps" ]
}

@test "detect-exception: empty output when no marker and no label (negative)" {
  local df="$BATS_TEST_TMPDIR/Dockerfile.plain"
  cat > "$df" <<'EOF'
FROM alpine
RUN true
EOF

  run env -u PERF_EXCEPTION_LABEL -u PERF_EXCEPTION_IMAGE_LABEL -u NAME bash "$SCRIPT" detect-exception "$df"
  [ "$status" -eq 0 ]
  [ -z "$output" ]
}

@test "detect-exception: falls back to PR-label reason when no marker present (positive)" {
  local df="$BATS_TEST_TMPDIR/Dockerfile.label"
  cat > "$df" <<'EOF'
FROM alpine
RUN true
EOF

  run env -u PERF_EXCEPTION_LABEL_NAME PERF_EXCEPTION_LABEL=true bash "$SCRIPT" detect-exception "$df"
  [ "$status" -eq 0 ]
  [[ "$output" == *"PR label 'docker-perf-exception' applied"* ]]
}

@test "detect-exception: label reason honors a custom label name (positive)" {
  local df="$BATS_TEST_TMPDIR/Dockerfile.label2"
  cat > "$df" <<'EOF'
FROM alpine
EOF

  run env PERF_EXCEPTION_LABEL=true PERF_EXCEPTION_LABEL_NAME=size-waiver \
    bash "$SCRIPT" detect-exception "$df"
  [ "$status" -eq 0 ]
  [[ "$output" == *"PR label 'size-waiver' applied"* ]]
}

@test "detect-exception: marker takes precedence over the label (edge)" {
  local df="$BATS_TEST_TMPDIR/Dockerfile.both"
  cat > "$df" <<'EOF'
FROM alpine
# perf-exception: inline wins
EOF

  run env PERF_EXCEPTION_LABEL=true bash "$SCRIPT" detect-exception "$df"
  [ "$status" -eq 0 ]
  [ "$output" = "inline wins" ]
}

@test "detect-exception: marker match is case-insensitive and trims whitespace (edge)" {
  local df="$BATS_TEST_TMPDIR/Dockerfile.case"
  cat > "$df" <<'EOF'
FROM alpine
#   Perf-Exception:  glibc only
EOF

  run bash "$SCRIPT" detect-exception "$df"
  [ "$status" -eq 0 ]
  [ "$output" = "glibc only" ]
}

@test "detect-exception: a marker-like string inside a RUN command is not a waiver (edge)" {
  local df="$BATS_TEST_TMPDIR/Dockerfile.instring"
  cat > "$df" <<'EOF'
FROM alpine
RUN echo "documenting the # perf-exception: policy"
EOF

  run env -u PERF_EXCEPTION_LABEL -u PERF_EXCEPTION_IMAGE_LABEL -u NAME bash "$SCRIPT" detect-exception "$df"
  [ "$status" -eq 0 ]
  [ -z "$output" ]
}

@test "detect-exception: scoped image label waives only the named image (positive)" {
  local df="$BATS_TEST_TMPDIR/Dockerfile.scoped"
  cat > "$df" <<'EOF'
FROM alpine
EOF

  run env -u PERF_EXCEPTION_LABEL -u PERF_EXCEPTION_LABEL_NAME \
    PERF_EXCEPTION_IMAGE_LABEL=true NAME=production \
    bash "$SCRIPT" detect-exception "$df"
  [ "$status" -eq 0 ]
  [ "$output" = "PR label 'docker-perf-exception:production' applied" ]
}

@test "detect-exception: missing/nonexistent file path yields empty output, exit 0 (edge)" {
  run env -u PERF_EXCEPTION_LABEL -u PERF_EXCEPTION_IMAGE_LABEL -u NAME bash "$SCRIPT" detect-exception "$BATS_TEST_TMPDIR/does-not-exist"
  [ "$status" -eq 0 ]
  [ -z "$output" ]
}

# ---------------------------------------------------------------------------
# render-report
# ---------------------------------------------------------------------------

@test "render-report: passing image with a base shows name, pass cell and signed delta (positive)" {
  local json="$BATS_TEST_TMPDIR/pass.json"
  cat > "$json" <<'EOF'
{
  "name": "web-prod",
  "dockerfile": "Dockerfile",
  "current_bytes": 104857600,
  "base_bytes": 94371840,
  "build_ms": 42000,
  "base_build_ms": 40000,
  "budget_mb": 150,
  "tolerance_pct": 10,
  "dive_status": 0,
  "hadolint_status": 0,
  "verdict": "pass",
  "exception": ""
}
EOF

  run bash "$SCRIPT" render-report "$json"
  [ "$status" -eq 0 ]
  [[ "$output" == *"web-prod"* ]]
  [[ "$output" == *"✅ pass"* ]]
  # current (100 MiB) is larger than base (90 MiB) => positive delta.
  [[ "$output" == *"+10 MiB"* ]]
  [[ "$output" == *"150 MiB +10%"* ]]
}

@test "render-report: base_bytes of 0 renders the delta cell as n/a (boundary)" {
  local json="$BATS_TEST_TMPDIR/nobase.json"
  cat > "$json" <<'EOF'
{
  "name": "web-prod",
  "dockerfile": "Dockerfile",
  "current_bytes": 104857600,
  "base_bytes": 0,
  "build_ms": 42000,
  "base_build_ms": 0,
  "budget_mb": 150,
  "tolerance_pct": 0,
  "dive_status": 0,
  "hadolint_status": 0,
  "verdict": "pass",
  "exception": ""
}
EOF

  run bash "$SCRIPT" render-report "$json"
  [ "$status" -eq 0 ]
  local delta
  delta="$(printf '%s\n' "$output" | awk -F'|' '{gsub(/^[[:space:]]+|[[:space:]]+$/, "", $5); print $5}')"
  [ "$delta" = "n/a" ]
}

@test "render-report: failing verdict renders the fail status cell (negative)" {
  local json="$BATS_TEST_TMPDIR/fail.json"
  cat > "$json" <<'EOF'
{
  "name": "web-prod",
  "dockerfile": "Dockerfile",
  "current_bytes": 314572800,
  "base_bytes": 94371840,
  "build_ms": 42000,
  "base_build_ms": 40000,
  "budget_mb": 150,
  "tolerance_pct": 0,
  "dive_status": 1,
  "hadolint_status": 0,
  "verdict": "fail",
  "exception": ""
}
EOF

  run bash "$SCRIPT" render-report "$json"
  [ "$status" -eq 0 ]
  [[ "$output" == *"❌ fail"* ]]
}

@test "render-report: exception verdict shows the exception cell with its reason (negative-waived)" {
  local json="$BATS_TEST_TMPDIR/exc.json"
  cat > "$json" <<'EOF'
{
  "name": "web-prod",
  "dockerfile": "Dockerfile",
  "current_bytes": 314572800,
  "base_bytes": 94371840,
  "build_ms": 42000,
  "base_build_ms": 40000,
  "budget_mb": 150,
  "tolerance_pct": 0,
  "dive_status": 0,
  "hadolint_status": 0,
  "verdict": "exception",
  "exception": "PR label 'docker-perf-exception' applied"
}
EOF

  run bash "$SCRIPT" render-report "$json"
  [ "$status" -eq 0 ]
  [[ "$output" == *"⚠️ exception"* ]]
  [[ "$output" == *"PR label 'docker-perf-exception' applied"* ]]
}

@test "render-report: negative delta when the image shrank vs base (edge)" {
  local json="$BATS_TEST_TMPDIR/shrink.json"
  cat > "$json" <<'EOF'
{
  "name": "web-prod",
  "dockerfile": "Dockerfile",
  "current_bytes": 94371840,
  "base_bytes": 104857600,
  "build_ms": 42000,
  "base_build_ms": 40000,
  "budget_mb": 150,
  "tolerance_pct": 0,
  "dive_status": 0,
  "hadolint_status": 0,
  "verdict": "pass",
  "exception": ""
}
EOF

  run bash "$SCRIPT" render-report "$json"
  [ "$status" -eq 0 ]
  # current (90 MiB) smaller than base (100 MiB) => negative delta, no leading '+'.
  [[ "$output" == *"-10 MiB"* ]]
  [[ "$output" != *"+10 MiB"* ]]
}
