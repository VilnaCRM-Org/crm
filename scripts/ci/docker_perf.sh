#!/bin/bash
#
# docker_perf.sh — measure and gate Dockerfile build performance.
#
# The script keeps the decision logic in small, side-effect-free subcommands so
# it can be unit-tested with Bats (no Docker required), while the `run`
# subcommand wires those decisions to real `docker buildx`, `dive` and
# `hadolint` invocations in CI.
#
# Subcommands:
#   run               build head (+ base) image, measure, gate, emit report
#   evaluate          decide pass/fail from measured metrics (reads env)
#   detect-exception  resolve a documented perf exception (marker or PR label)
#   render-report     render one Markdown table row from a metrics JSON file
#
# Exit codes: 0 = within budget (or waived by a documented exception),
#             1 = a gate failed and no exception applies, 2 = usage error.
#
set -euo pipefail

readonly MIB=$((1024 * 1024))

log() { printf '%s\n' "$*" >&2; }

# ---------------------------------------------------------------------------
# detect_exception <dockerfile>
#
# A perf exception is documented either inline in the Dockerfile as
#   # perf-exception: <reason>
# or repo-wide via a PR label (the caller exports PERF_EXCEPTION_LABEL=true and,
# optionally, PERF_EXCEPTION_LABEL_NAME). Prints the reason (empty if none) and
# always exits 0 — the marker is informational, never an error.
# ---------------------------------------------------------------------------
detect_exception() {
  local dockerfile="${1:-}"
  local reason=""

  if [ -n "$dockerfile" ] && [ -f "$dockerfile" ]; then
    # `|| true` keeps a no-match grep (exit 1) and any SIGPIPE from `head`
    # closing the pipe early from aborting the script under `set -o pipefail`.
    reason="$(grep -iE '^[[:space:]]*#[[:space:]]*perf-exception:' "$dockerfile" 2>/dev/null \
      | head -n1 \
      | sed -E 's/^[[:space:]]*#[[:space:]]*[Pp][Ee][Rr][Ff]-[Ee][Xx][Cc][Ee][Pp][Tt][Ii][Oo][Nn]:[[:space:]]*//' \
      | tr -d '\r' \
      | sed -E 's/[[:space:]]+$//' || true)"
  fi

  if [ -z "$reason" ]; then
    local label_name="${PERF_EXCEPTION_LABEL_NAME:-docker-perf-exception}"
    if [ "${PERF_EXCEPTION_LABEL:-false}" = "true" ]; then
      reason="PR label '${label_name}' applied"
    elif [ "${PERF_EXCEPTION_IMAGE_LABEL:-false}" = "true" ]; then
      reason="PR label '${label_name}:${NAME:-}' applied"
    fi
  fi

  printf '%s' "$reason"
}

# ---------------------------------------------------------------------------
# evaluate   (reads env, no args)
#
# Inputs (env): CURRENT_BYTES BUDGET_MB TOLERANCE_PCT DIVE_STATUS
#               HADOLINT_STATUS EXCEPTION_REASON
#
# Prints a verdict whose first token is PASS, EXCEPTION or FAIL, followed by the
# specific gate failures. Exits 0 on PASS/EXCEPTION, 1 on FAIL.
# ---------------------------------------------------------------------------
evaluate() {
  local current="${CURRENT_BYTES:?CURRENT_BYTES is required}"
  local budget_mb="${BUDGET_MB:?BUDGET_MB is required}"
  local tol="${TOLERANCE_PCT:-0}"
  local dive_status="${DIVE_STATUS:-0}"
  local hadolint_status="${HADOLINT_STATUS:-0}"
  local exception="${EXCEPTION_REASON:-}"

  local budget_bytes=$((budget_mb * MIB))
  local limit=$(( budget_bytes * (100 + tol) / 100 ))

  local -a failures=()
  if [ "$current" -gt "$limit" ]; then
    failures+=("size ${current}B exceeds limit ${limit}B (budget ${budget_mb}MiB +${tol}% tolerance)")
  fi
  if [ "$dive_status" -ne 0 ]; then
    failures+=("dive layer-efficiency gate failed")
  fi
  if [ "$hadolint_status" -ne 0 ]; then
    failures+=("hadolint best-practice gate failed")
  fi

  if [ "${#failures[@]}" -eq 0 ]; then
    echo "PASS: all gates within budget"
    return 0
  fi

  local f
  if [ -n "$exception" ]; then
    echo "EXCEPTION: gate(s) failed but a documented exception applies: ${exception}"
    for f in "${failures[@]}"; do echo "  - (waived) ${f}"; done
    return 0
  fi

  echo "FAIL: a documented exception is required to merge"
  for f in "${failures[@]}"; do echo "  - ${f}"; done
  return 1
}

# ---------------------------------------------------------------------------
# render_report <metrics.json>
#
# Emits one Markdown table row describing the image. Columns:
#   Image | Dockerfile | Size | Δ vs base | Build time | Budget | Status
# ---------------------------------------------------------------------------
render_report() {
  local metrics="${1:?metrics JSON path is required}"

  jq -r '
    def mib: (. / 1048576 * 10 | round) / 10;
    def secs: (. / 100 | round) / 10;
    def sign(d): (if d > 0 then "+" else "" end) + ((d | mib) | tostring) + " MiB";

    "| `\(.name)` "
    + "| `\(.dockerfile)` "
    + "| \(.current_bytes | mib) MiB "
    + "| " + (if (.base_bytes // 0) > 0 then sign(.current_bytes - .base_bytes) else "n/a" end) + " "
    + "| \(.build_ms | secs)s "
    + "| \(.budget_mb) MiB +\(.tolerance_pct)% "
    + "| " + (
        if .verdict == "pass" then "✅ pass"
        elif .verdict == "exception" then "⚠️ exception"
        else "❌ fail" end
      )
    + (if (.exception // "") != "" then " — " + (.exception | gsub("[\r\n]+"; " ") | gsub("\\|"; "\\|")) else "" end)
    + " |"
  ' "$metrics"
}

# ---------------------------------------------------------------------------
# Build / measurement helpers (real Docker; overridable for tests).
# ---------------------------------------------------------------------------

# build_image <dockerfile> <context> <target> <tag> <role>
# Builds the image, streaming logs to stderr, and prints the build time in ms.
build_image() {
  local dockerfile="$1" context="$2" target="$3" tag="$4" role="$5"
  local -a args=(buildx build --file "$dockerfile" --tag "$tag" --load --progress plain)

  [ -n "$target" ] && args+=(--target "$target")

  if [ -n "${DOCKER_PERF_GHA_CACHE:-}" ]; then
    args+=(--cache-from "type=gha,scope=docker-perf-${NAME}")
    if [ "$role" = "head" ]; then
      args+=(--cache-to "type=gha,mode=max,scope=docker-perf-${NAME}")
    fi
  fi
  args+=("$context")

  local start end
  start="$(date +%s%N)"
  docker "${args[@]}" >&2
  end="$(date +%s%N)"
  echo $(( (end - start) / 1000000 ))
}

# image_size <tag> -> uncompressed size in bytes
image_size() {
  docker image inspect "$1" --format '{{.Size}}'
}

# run_hadolint <dockerfile> -> exits non-zero when the best-practice gate fails
run_hadolint() {
  local dockerfile="$1"
  local config="${HADOLINT_CONFIG:-.hadolint.yaml}"

  if [ -n "${HADOLINT:-}" ]; then
    "$HADOLINT" --config "$config" "$dockerfile"
  else
    docker run --rm -i \
      -v "$PWD/$config:/.config/hadolint.yaml:ro" \
      "hadolint/hadolint:${HADOLINT_VERSION:-v2.13.1-alpine}" \
      hadolint --config /.config/hadolint.yaml - < "$dockerfile"
  fi
}

# run_dive <tag> -> exits non-zero when the layer-efficiency gate fails
run_dive() {
  local tag="$1"
  local config="${DIVE_CONFIG:-.dive-ci}"

  if [ -n "${DIVE:-}" ]; then
    CI=true "$DIVE" --ci --ci-config "$config" --source docker "$tag"
  else
    docker run --rm \
      -e CI=true \
      -v /var/run/docker.sock:/var/run/docker.sock \
      -v "$PWD/$config:/.dive-ci:ro" \
      "wagoodman/dive:${DIVE_VERSION:-v0.13.1}" \
      --ci --ci-config /.dive-ci --source docker "$tag"
  fi
}

# ---------------------------------------------------------------------------
# run   (reads env, no args)
#
# Required env: NAME DOCKERFILE CONTEXT BUDGET_MB
# Optional env: TARGET TOLERANCE_PCT BASE_DOCKERFILE BASE_CONTEXT OUT_DIR
#               GITHUB_STEP_SUMMARY DOCKER_PERF_GHA_CACHE
# ---------------------------------------------------------------------------
run() {
  : "${NAME:?NAME is required}"
  : "${DOCKERFILE:?DOCKERFILE is required}"
  : "${CONTEXT:?CONTEXT is required}"
  : "${BUDGET_MB:?BUDGET_MB is required}"
  local target="${TARGET:-}"
  local tol="${TOLERANCE_PCT:-0}"
  local out_dir="${OUT_DIR:-.docker-perf}"
  mkdir -p "$out_dir"

  log "==> [${NAME}] building head image from ${DOCKERFILE}"
  local head_tag="docker-perf-${NAME}:head"
  local build_ms current_bytes
  build_ms="$(build_image "$DOCKERFILE" "$CONTEXT" "$target" "$head_tag" head)"
  current_bytes="$(image_size "$head_tag")"

  local base_bytes=0 base_build_ms=0
  if [ -n "${BASE_DOCKERFILE:-}" ] && [ -f "${BASE_DOCKERFILE}" ]; then
    log "==> [${NAME}] building base image from ${BASE_DOCKERFILE}"
    local base_tag="docker-perf-${NAME}:base"
    base_build_ms="$(build_image "$BASE_DOCKERFILE" "${BASE_CONTEXT:-$CONTEXT}" "$target" "$base_tag" base || echo 0)"
    base_bytes="$(image_size "$base_tag" 2>/dev/null || echo 0)"
  else
    log "==> [${NAME}] no base Dockerfile available; skipping delta"
  fi

  local hadolint_status=0
  run_hadolint "$DOCKERFILE" || hadolint_status=$?
  log "==> [${NAME}] hadolint exit status: ${hadolint_status}"

  local dive_status=0
  run_dive "$head_tag" || dive_status=$?
  log "==> [${NAME}] dive exit status: ${dive_status}"

  local exception
  exception="$(detect_exception "$DOCKERFILE")"
  [ -n "$exception" ] && log "==> [${NAME}] documented exception: ${exception}"

  local eval_out rc=0
  eval_out="$(CURRENT_BYTES="$current_bytes" BUDGET_MB="$BUDGET_MB" TOLERANCE_PCT="$tol" \
    DIVE_STATUS="$dive_status" HADOLINT_STATUS="$hadolint_status" EXCEPTION_REASON="$exception" \
    evaluate)" || rc=$?
  printf '%s\n' "$eval_out" >&2

  local verdict
  case "$eval_out" in
    PASS*) verdict="pass" ;;
    EXCEPTION*) verdict="exception" ;;
    *) verdict="fail" ;;
  esac

  jq -n \
    --arg name "$NAME" \
    --arg dockerfile "$DOCKERFILE" \
    --argjson current "$current_bytes" \
    --argjson base "$base_bytes" \
    --argjson build_ms "$build_ms" \
    --argjson base_build_ms "$base_build_ms" \
    --argjson budget_mb "$BUDGET_MB" \
    --argjson tol "$tol" \
    --argjson dive "$dive_status" \
    --argjson hadolint "$hadolint_status" \
    --arg verdict "$verdict" \
    --arg exception "$exception" \
    '{name:$name, dockerfile:$dockerfile, current_bytes:$current, base_bytes:$base,
      build_ms:$build_ms, base_build_ms:$base_build_ms, budget_mb:$budget_mb,
      tolerance_pct:$tol, dive_status:$dive, hadolint_status:$hadolint,
      verdict:$verdict, exception:$exception}' \
    > "$out_dir/metrics-${NAME}.json"

  render_report "$out_dir/metrics-${NAME}.json" > "$out_dir/row-${NAME}.md"

  if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then
    {
      echo "### Dockerfile performance — ${NAME}"
      echo
      echo "| Image | Dockerfile | Size | Δ vs base | Build time | Budget | Status |"
      echo "| --- | --- | --- | --- | --- | --- | --- |"
      cat "$out_dir/row-${NAME}.md"
    } >> "$GITHUB_STEP_SUMMARY"
  fi

  return "$rc"
}

main() {
  local cmd="${1:-run}"
  [ "$#" -gt 0 ] && shift
  case "$cmd" in
    run) run ;;
    evaluate) evaluate ;;
    detect-exception) detect_exception "$@" ;;
    render-report) render_report "$@" ;;
    *) log "unknown subcommand: ${cmd}"; return 2 ;;
  esac
}

main "$@"
