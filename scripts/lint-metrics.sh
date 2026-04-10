#!/usr/bin/env sh
# scripts/lint-metrics.sh — rust-code-analysis metrics enforcement for src/
#
# Environment variables (all optional; defaults match spec thresholds):
#   RCA_BIN          path to rust-code-analysis-cli binary
#   RCA_VERSION      version string used in output messages
#   CC_MAX           cyclomatic complexity maximum (default 20)
#   COGNITIVE_MAX    cognitive complexity maximum (default 24)
#   NARGS_MAX        function argument count maximum (default 5)
#   NEXITS_MAX       exit/return point maximum (default 15)
#   MI_MIN           maintainability index minimum (default 40)
#   SLOC_MAX         source lines of code maximum (default 157)
#
# Exit 0 = all metrics pass
# Exit 1 = one or more violations detected (all collected before exit)

set -eu

RCA_BIN="${RCA_BIN:-./bin/rust-code-analysis-cli}"
RCA_VERSION="${RCA_VERSION:-}"
CC_MAX="${CC_MAX:-20}"
COGNITIVE_MAX="${COGNITIVE_MAX:-24}"
NARGS_MAX="${NARGS_MAX:-5}"
NEXITS_MAX="${NEXITS_MAX:-15}"
MI_MIN="${MI_MIN:-40}"
SLOC_MAX="${SLOC_MAX:-157}"

# ---------------------------------------------------------------------------
# Dependency checks
# ---------------------------------------------------------------------------

if ! command -v jq >/dev/null 2>&1; then
  printf 'ERROR: jq is required by lint-metrics but was not found in PATH\n' >&2
  exit 1
fi

if [ ! -x "$RCA_BIN" ]; then
  printf 'ERROR: %s not found or not executable\n' "$RCA_BIN" >&2
  exit 1
fi

# ---------------------------------------------------------------------------
# Temp files — cleaned up on all exit paths
# ---------------------------------------------------------------------------

TMP_JSON=$(mktemp /tmp/rca-analysis.XXXXXX)
TMP_VIOLATIONS=$(mktemp /tmp/rca-violations.XXXXXX)

cleanup() { rm -f "$TMP_JSON" "$TMP_VIOLATIONS"; }
trap cleanup EXIT INT TERM

# ---------------------------------------------------------------------------
# Analysis
# ---------------------------------------------------------------------------

VER_LABEL=""
if [ -n "$RCA_VERSION" ]; then VER_LABEL=" v${RCA_VERSION}"; fi
printf 'lint-metrics: analyzing src/ with rust-code-analysis%s\n' "$VER_LABEL"

# rust-code-analysis-cli outputs NDJSON: one JSON object per file per line
"$RCA_BIN" -m -O json -p src/ >"$TMP_JSON"

# ---------------------------------------------------------------------------
# Violation extraction via jq
#
# -rs slurps NDJSON into a JSON array so .[] iterates files.
# For each file, [.. | objects | select(.kind?)] recursively finds all
# function/closure spaces.
# Output format (pipe-delimited): file|function|line|metric|value|threshold|dir
# ---------------------------------------------------------------------------

jq -rs \
  --argjson cc_max      "$CC_MAX"        \
  --argjson cog_max     "$COGNITIVE_MAX" \
  --argjson nargs_max   "$NARGS_MAX"     \
  --argjson nexits_max  "$NEXITS_MAX"    \
  --argjson mi_min      "$MI_MIN"        \
  --argjson sloc_max    "$SLOC_MAX"      '
  .[] |
  . as $file |
  [.. | objects | select(.kind? == "function" or .kind? == "closure")] |
  .[] |
  . as $fn |
  ($fn.metrics.cyclomatic.sum // 0)                                         as $cc     |
  ($fn.metrics.cognitive.sum  // $fn.metrics.cognitive // 0)                as $cog    |
  ($fn.metrics.nargs.functions_max // 0)                                    as $nargs  |
  ($fn.metrics.nexits.average // 0)                                         as $nexits |
  ($fn.metrics.mi.mi_original // 100)                                       as $mi     |
  ($fn.metrics.loc.sloc // 0)                                               as $sloc   |
  (
    (if $cc     > $cc_max     then "\($file.name)|\($fn.name // "<anon>")|\($fn.start_line // 0)|cc|\($cc)|\($cc_max)|<=" else empty end),
    (if $cog    > $cog_max    then "\($file.name)|\($fn.name // "<anon>")|\($fn.start_line // 0)|cognitive|\($cog)|\($cog_max)|<=" else empty end),
    (if $nargs  > $nargs_max  then "\($file.name)|\($fn.name // "<anon>")|\($fn.start_line // 0)|nargs|\($nargs)|\($nargs_max)|<=" else empty end),
    (if $nexits > $nexits_max then "\($file.name)|\($fn.name // "<anon>")|\($fn.start_line // 0)|nexits|\($nexits)|\($nexits_max)|<=" else empty end),
    (if $mi     < $mi_min     then "\($file.name)|\($fn.name // "<anon>")|\($fn.start_line // 0)|mi|\($mi)|\($mi_min)|>=" else empty end),
    (if $sloc   > $sloc_max   then "\($file.name)|\($fn.name // "<anon>")|\($fn.start_line // 0)|sloc|\($sloc)|\($sloc_max)|<=" else empty end)
  )
' "$TMP_JSON" >"$TMP_VIOLATIONS"

VIOLATION_COUNT=$(wc -l <"$TMP_VIOLATIONS" | awk '{print $1}')

MEASURED_CC=$(jq -rs '[.. | objects | select(.kind? == "function" or .kind? == "closure") | .metrics.cyclomatic.sum // 0] | max // 0' "$TMP_JSON")
MEASURED_COGNITIVE=$(jq -rs '[.. | objects | select(.kind? == "function" or .kind? == "closure") | (.metrics.cognitive.sum // .metrics.cognitive // 0)] | max // 0' "$TMP_JSON")
MEASURED_NARGS=$(jq -rs '[.. | objects | select(.kind? == "function" or .kind? == "closure") | .metrics.nargs.functions_max // 0] | max // 0' "$TMP_JSON")
MEASURED_NEXITS=$(jq -rs '[.. | objects | select(.kind? == "function" or .kind? == "closure") | .metrics.nexits.average // 0] | max // 0' "$TMP_JSON")
MEASURED_MI=$(jq -rs '[.. | objects | select(.kind? == "function" or .kind? == "closure") | .metrics.mi.mi_original // 100] | min // 100' "$TMP_JSON")
MEASURED_SLOC=$(jq -rs '[.. | objects | select(.kind? == "function" or .kind? == "closure") | .metrics.loc.sloc // 0] | max // 0' "$TMP_JSON")

# ---------------------------------------------------------------------------
# Report and exit
# ---------------------------------------------------------------------------

if [ "${VIOLATION_COUNT:-0}" -gt 0 ]; then
  printf '\n'
  printf 'rust-code-analysis: %d violation(s) found\n\n' "$VIOLATION_COUNT"
  printf '%-60s  %-28s  %4s  %-10s  %8s  %-10s\n' \
    "FILE" "FUNCTION" "LINE" "METRIC" "VALUE" "LIMIT"
  printf '%0.s-' $(seq 1 120) && printf '\n'

  while IFS='|' read -r file fn line metric value threshold direction; do
    printf '%-60s  %-28s  %4s  %-10s  %8s  %s%s\n' \
      "$file" "$fn" "$line" "$metric" "$value" "$direction" "$threshold"
  done <"$TMP_VIOLATIONS"

  printf '\n'

  if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then
    {
      printf '## rust-code-analysis: %d violation(s) found\n\n' "$VIOLATION_COUNT"
      printf '| File | Function | Line | Metric | Value | Limit |\n'
      printf '|------|----------|------|--------|-------|-------|\n'
      while IFS='|' read -r file fn line metric value threshold direction; do
        printf '| `%s` | `%s` | %s | %s | %s | `%s%s` |\n' \
          "$file" "$fn" "$line" "$metric" "$value" "$direction" "$threshold"
      done <"$TMP_VIOLATIONS"
      printf '\n'
    } >>"$GITHUB_STEP_SUMMARY"
  fi

  printf 'lint-metrics FAILED: %d violation(s) — fix the above before pushing\n' \
    "$VIOLATION_COUNT" >&2
  exit 1
fi

# All passing
printf '\n'
printf 'rust-code-analysis: all checks pass\n\n'
printf 'Scope: src/ | Thresholds: CC<=%s | Cognitive<=%s | NArgs<=%s | NExits<=%s | MI>=%s | SLOC<=%s\n\n' \
  "$CC_MAX" "$COGNITIVE_MAX" "$NARGS_MAX" "$NEXITS_MAX" "$MI_MIN" "$SLOC_MAX"
printf 'All functions in src/ are within policy thresholds.\n'

if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then
  {
    printf '## rust-code-analysis: all checks pass\n\n'
    printf '| Metric | Threshold |\n'
    printf '|--------|-----------|\n'
    printf '| Cyclomatic Complexity | <=%s (measured %s) |\n'  "$CC_MAX" "$MEASURED_CC"
    printf '| Cognitive Complexity  | <=%s (measured %s) |\n'  "$COGNITIVE_MAX" "$MEASURED_COGNITIVE"
    printf '| Function Arguments    | <=%s (measured %s) |\n'  "$NARGS_MAX" "$MEASURED_NARGS"
    printf '| Exit Points           | <=%s (measured %s) |\n'  "$NEXITS_MAX" "$MEASURED_NEXITS"
    printf '| Maintainability Index | >=%s (measured %s) |\n'  "$MI_MIN" "$MEASURED_MI"
    printf '| Source Lines of Code  | <=%s (measured %s) |\n'  "$SLOC_MAX" "$MEASURED_SLOC"
    printf '\nAll functions in `src/` are within policy thresholds.\n'
  } >>"$GITHUB_STEP_SUMMARY"
fi

exit 0
