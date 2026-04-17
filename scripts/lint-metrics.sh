#!/usr/bin/env sh
# scripts/lint-metrics.sh - rust-code-analysis metrics enforcement for src/
#
# Exit 0 = no hard-fail violations
# Exit 1 = one or more hard-fail violations detected
#
# Review-gate metrics are calculated internally but not printed and do not block CI.
# Hard-fail thresholds are supplied by Makefile so local and CI paths share one
# policy source.

set -eu

RCA_BIN="${RCA_BIN:-./bin/rust-code-analysis-cli}"
RCA_VERSION="${RCA_VERSION:-}"

require_env() {
  name=$1
  value=$2

  if [ -z "$value" ]; then
    printf 'ERROR: %s must be set by Makefile or environment\n' "$name" >&2
    exit 1
  fi

  printf '%s' "$value"
}

# Hard-fail thresholds.
CYCLOMATIC_MAX="$(require_env CYCLOMATIC_MAX "${CYCLOMATIC_MAX:-${CC_MAX:-}}")"
COGNITIVE_MAX="$(require_env COGNITIVE_MAX "${COGNITIVE_MAX:-}")"
ABC_MAGNITUDE_MAX="$(require_env ABC_MAGNITUDE_MAX "${ABC_MAGNITUDE_MAX:-}")"
NARGS_FUNCTION_MAX="$(require_env NARGS_FUNCTION_MAX "${NARGS_FUNCTION_MAX:-}")"
NARGS_CLOSURE_MAX="$(require_env NARGS_CLOSURE_MAX "${NARGS_CLOSURE_MAX:-}")"
NEXITS_MAX="$(require_env NEXITS_MAX "${NEXITS_MAX:-}")"
LLOC_FUNCTION_MAX="$(require_env LLOC_FUNCTION_MAX "${LLOC_FUNCTION_MAX:-}")"
PLOC_FUNCTION_MAX="$(require_env PLOC_FUNCTION_MAX "${PLOC_FUNCTION_MAX:-}")"
SLOC_FUNCTION_MAX="$(require_env SLOC_FUNCTION_MAX "${SLOC_FUNCTION_MAX:-}")"
HALSTEAD_VOLUME_FUNCTION_MAX="$(require_env HALSTEAD_VOLUME_FUNCTION_MAX "${HALSTEAD_VOLUME_FUNCTION_MAX:-}")"
HALSTEAD_BUGS_FUNCTION_MAX="$(require_env HALSTEAD_BUGS_FUNCTION_MAX "${HALSTEAD_BUGS_FUNCTION_MAX:-}")"
NOM_FUNCTIONS_FILE_MAX="$(require_env NOM_FUNCTIONS_FILE_MAX "${NOM_FUNCTIONS_FILE_MAX:-}")"
NOM_CLOSURES_FILE_MAX="$(require_env NOM_CLOSURES_FILE_MAX "${NOM_CLOSURES_FILE_MAX:-}")"
NOM_TOTAL_FILE_MAX="$(require_env NOM_TOTAL_FILE_MAX "${NOM_TOTAL_FILE_MAX:-}")"
LLOC_FILE_MAX="$(require_env LLOC_FILE_MAX "${LLOC_FILE_MAX:-}")"
PLOC_FILE_MAX="$(require_env PLOC_FILE_MAX "${PLOC_FILE_MAX:-}")"
SLOC_FILE_MAX="$(require_env SLOC_FILE_MAX "${SLOC_FILE_MAX:-}")"
HALSTEAD_VOLUME_FILE_MAX="$(require_env HALSTEAD_VOLUME_FILE_MAX "${HALSTEAD_VOLUME_FILE_MAX:-}")"
HALSTEAD_BUGS_FILE_MAX="$(require_env HALSTEAD_BUGS_FILE_MAX "${HALSTEAD_BUGS_FILE_MAX:-}")"
MI_VISUAL_STUDIO_MIN="$(require_env MI_VISUAL_STUDIO_MIN "${MI_VISUAL_STUDIO_MIN:-}")"
CLASS_WMC_MAX="$(require_env CLASS_WMC_MAX "${CLASS_WMC_MAX:-}")"
CLASS_NPM_MAX="$(require_env CLASS_NPM_MAX "${CLASS_NPM_MAX:-}")"
CLASS_NPA_MAX="$(require_env CLASS_NPA_MAX "${CLASS_NPA_MAX:-}")"
CLASS_COA_MAX="$(require_env CLASS_COA_MAX "${CLASS_COA_MAX:-}")"
CLASS_CDA_MAX="$(require_env CLASS_CDA_MAX "${CLASS_CDA_MAX:-}")"
INTERFACE_NPM_MAX="$(require_env INTERFACE_NPM_MAX "${INTERFACE_NPM_MAX:-}")"
INTERFACE_NPA_MAX="$(require_env INTERFACE_NPA_MAX "${INTERFACE_NPA_MAX:-}")"

# Review-gate thresholds.
MI_ORIGINAL_MIN="${MI_ORIGINAL_MIN:-65}"
MI_SEI_MIN="${MI_SEI_MIN:-65}"
CLOC_RATIO_MIN="${CLOC_RATIO_MIN:-0.10}"
CLOC_RATIO_MAX="${CLOC_RATIO_MAX:-0.60}"
BLANK_RATIO_MIN="${BLANK_RATIO_MIN:-0.02}"
BLANK_RATIO_MAX="${BLANK_RATIO_MAX:-0.30}"

HALSTEAD_N1_FUNCTION_MAX="${HALSTEAD_N1_FUNCTION_MAX:-30}"
HALSTEAD_N1_TOTAL_FUNCTION_MAX="${HALSTEAD_N1_TOTAL_FUNCTION_MAX:-80}"
HALSTEAD_N2_FUNCTION_MAX="${HALSTEAD_N2_FUNCTION_MAX:-40}"
HALSTEAD_N2_TOTAL_FUNCTION_MAX="${HALSTEAD_N2_TOTAL_FUNCTION_MAX:-120}"
HALSTEAD_LENGTH_FUNCTION_MAX="${HALSTEAD_LENGTH_FUNCTION_MAX:-180}"
HALSTEAD_ESTIMATED_LENGTH_FUNCTION_MAX="${HALSTEAD_ESTIMATED_LENGTH_FUNCTION_MAX:-160}"
HALSTEAD_VOCABULARY_FUNCTION_MAX="${HALSTEAD_VOCABULARY_FUNCTION_MAX:-70}"
HALSTEAD_DIFFICULTY_FUNCTION_MAX="${HALSTEAD_DIFFICULTY_FUNCTION_MAX:-25}"
HALSTEAD_LEVEL_FUNCTION_MIN="${HALSTEAD_LEVEL_FUNCTION_MIN:-0.03}"
HALSTEAD_EFFORT_FUNCTION_MAX="${HALSTEAD_EFFORT_FUNCTION_MAX:-30000}"
HALSTEAD_TIME_FUNCTION_MAX="${HALSTEAD_TIME_FUNCTION_MAX:-1800}"
HALSTEAD_PURITY_RATIO_FUNCTION_MIN="${HALSTEAD_PURITY_RATIO_FUNCTION_MIN:-0.60}"
HALSTEAD_PURITY_RATIO_FUNCTION_MAX="${HALSTEAD_PURITY_RATIO_FUNCTION_MAX:-1.40}"

HALSTEAD_N1_FILE_MAX="${HALSTEAD_N1_FILE_MAX:-60}"
HALSTEAD_N1_TOTAL_FILE_MAX="${HALSTEAD_N1_TOTAL_FILE_MAX:-400}"
HALSTEAD_N2_FILE_MAX="${HALSTEAD_N2_FILE_MAX:-90}"
HALSTEAD_N2_TOTAL_FILE_MAX="${HALSTEAD_N2_TOTAL_FILE_MAX:-800}"
HALSTEAD_LENGTH_FILE_MAX="${HALSTEAD_LENGTH_FILE_MAX:-1000}"
HALSTEAD_ESTIMATED_LENGTH_FILE_MAX="${HALSTEAD_ESTIMATED_LENGTH_FILE_MAX:-850}"
HALSTEAD_VOCABULARY_FILE_MAX="${HALSTEAD_VOCABULARY_FILE_MAX:-140}"
HALSTEAD_DIFFICULTY_FILE_MAX="${HALSTEAD_DIFFICULTY_FILE_MAX:-40}"
HALSTEAD_LEVEL_FILE_MIN="${HALSTEAD_LEVEL_FILE_MIN:-0.02}"
HALSTEAD_EFFORT_FILE_MAX="${HALSTEAD_EFFORT_FILE_MAX:-250000}"
HALSTEAD_TIME_FILE_MAX="${HALSTEAD_TIME_FILE_MAX:-15000}"
HALSTEAD_PURITY_RATIO_FILE_MIN="${HALSTEAD_PURITY_RATIO_FILE_MIN:-0.60}"
HALSTEAD_PURITY_RATIO_FILE_MAX="${HALSTEAD_PURITY_RATIO_FILE_MAX:-1.40}"

if ! command -v jq >/dev/null 2>&1; then
  printf 'ERROR: jq is required by lint-metrics but was not found in PATH\n' >&2
  exit 1
fi

if [ ! -x "$RCA_BIN" ]; then
  printf 'ERROR: %s not found or not executable\n' "$RCA_BIN" >&2
  exit 1
fi

TMP_JSON=$(mktemp "${TMPDIR:-/tmp}/rca-analysis.XXXXXX")
TMP_FINDINGS=$(mktemp "${TMPDIR:-/tmp}/rca-findings.XXXXXX")
TMP_SUMMARY=$(mktemp "${TMPDIR:-/tmp}/rca-summary.XXXXXX")

cleanup() { rm -f "$TMP_JSON" "$TMP_FINDINGS" "$TMP_SUMMARY"; }
trap cleanup EXIT INT TERM

VER_LABEL=""
if [ -n "$RCA_VERSION" ]; then VER_LABEL=" v${RCA_VERSION}"; fi
printf 'lint-metrics: analyzing src/ with rust-code-analysis%s\n' "$VER_LABEL"

"$RCA_BIN" -m -O json -p src/ \
  -X "**/node_modules/**" \
  -X "**/dist/**" \
  -X "**/coverage/**" \
  -X "**/.storybook/**" \
  -X "**/tests/**" \
  >"$TMP_JSON"

jq -rs -r \
  --argjson cyclomatic_max "$CYCLOMATIC_MAX" \
  --argjson cognitive_max "$COGNITIVE_MAX" \
  --argjson abc_magnitude_max "$ABC_MAGNITUDE_MAX" \
  --argjson nargs_function_max "$NARGS_FUNCTION_MAX" \
  --argjson nargs_closure_max "$NARGS_CLOSURE_MAX" \
  --argjson nexits_max "$NEXITS_MAX" \
  --argjson lloc_function_max "$LLOC_FUNCTION_MAX" \
  --argjson ploc_function_max "$PLOC_FUNCTION_MAX" \
  --argjson sloc_function_max "$SLOC_FUNCTION_MAX" \
  --argjson halstead_volume_function_max "$HALSTEAD_VOLUME_FUNCTION_MAX" \
  --argjson halstead_bugs_function_max "$HALSTEAD_BUGS_FUNCTION_MAX" \
  --argjson nom_functions_file_max "$NOM_FUNCTIONS_FILE_MAX" \
  --argjson nom_closures_file_max "$NOM_CLOSURES_FILE_MAX" \
  --argjson nom_total_file_max "$NOM_TOTAL_FILE_MAX" \
  --argjson lloc_file_max "$LLOC_FILE_MAX" \
  --argjson ploc_file_max "$PLOC_FILE_MAX" \
  --argjson sloc_file_max "$SLOC_FILE_MAX" \
  --argjson halstead_volume_file_max "$HALSTEAD_VOLUME_FILE_MAX" \
  --argjson halstead_bugs_file_max "$HALSTEAD_BUGS_FILE_MAX" \
  --argjson mi_visual_studio_min "$MI_VISUAL_STUDIO_MIN" \
  --argjson class_wmc_max "$CLASS_WMC_MAX" \
  --argjson class_npm_max "$CLASS_NPM_MAX" \
  --argjson class_npa_max "$CLASS_NPA_MAX" \
  --argjson class_coa_max "$CLASS_COA_MAX" \
  --argjson class_cda_max "$CLASS_CDA_MAX" \
  --argjson interface_npm_max "$INTERFACE_NPM_MAX" \
  --argjson interface_npa_max "$INTERFACE_NPA_MAX" \
  --argjson mi_original_min "$MI_ORIGINAL_MIN" \
  --argjson mi_sei_min "$MI_SEI_MIN" \
  --argjson cloc_ratio_min "$CLOC_RATIO_MIN" \
  --argjson cloc_ratio_max "$CLOC_RATIO_MAX" \
  --argjson blank_ratio_min "$BLANK_RATIO_MIN" \
  --argjson blank_ratio_max "$BLANK_RATIO_MAX" \
  --argjson h_n1_function_max "$HALSTEAD_N1_FUNCTION_MAX" \
  --argjson h_N1_function_max "$HALSTEAD_N1_TOTAL_FUNCTION_MAX" \
  --argjson h_n2_function_max "$HALSTEAD_N2_FUNCTION_MAX" \
  --argjson h_N2_function_max "$HALSTEAD_N2_TOTAL_FUNCTION_MAX" \
  --argjson h_length_function_max "$HALSTEAD_LENGTH_FUNCTION_MAX" \
  --argjson h_estimated_function_max "$HALSTEAD_ESTIMATED_LENGTH_FUNCTION_MAX" \
  --argjson h_vocabulary_function_max "$HALSTEAD_VOCABULARY_FUNCTION_MAX" \
  --argjson h_difficulty_function_max "$HALSTEAD_DIFFICULTY_FUNCTION_MAX" \
  --argjson h_level_function_min "$HALSTEAD_LEVEL_FUNCTION_MIN" \
  --argjson h_effort_function_max "$HALSTEAD_EFFORT_FUNCTION_MAX" \
  --argjson h_time_function_max "$HALSTEAD_TIME_FUNCTION_MAX" \
  --argjson h_purity_function_min "$HALSTEAD_PURITY_RATIO_FUNCTION_MIN" \
  --argjson h_purity_function_max "$HALSTEAD_PURITY_RATIO_FUNCTION_MAX" \
  --argjson h_n1_file_max "$HALSTEAD_N1_FILE_MAX" \
  --argjson h_N1_file_max "$HALSTEAD_N1_TOTAL_FILE_MAX" \
  --argjson h_n2_file_max "$HALSTEAD_N2_FILE_MAX" \
  --argjson h_N2_file_max "$HALSTEAD_N2_TOTAL_FILE_MAX" \
  --argjson h_length_file_max "$HALSTEAD_LENGTH_FILE_MAX" \
  --argjson h_estimated_file_max "$HALSTEAD_ESTIMATED_LENGTH_FILE_MAX" \
  --argjson h_vocabulary_file_max "$HALSTEAD_VOCABULARY_FILE_MAX" \
  --argjson h_difficulty_file_max "$HALSTEAD_DIFFICULTY_FILE_MAX" \
  --argjson h_level_file_min "$HALSTEAD_LEVEL_FILE_MIN" \
  --argjson h_effort_file_max "$HALSTEAD_EFFORT_FILE_MAX" \
  --argjson h_time_file_max "$HALSTEAD_TIME_FILE_MAX" \
  --argjson h_purity_file_min "$HALSTEAD_PURITY_RATIO_FILE_MIN" \
  --argjson h_purity_file_max "$HALSTEAD_PURITY_RATIO_FILE_MAX" '
  def row($severity; $file; $scope; $subject; $line; $metric; $value; $limit):
    "\($severity)|\($file)|\($scope)|\($subject)|\($line)|\($metric)|\($value)|\($limit)";
  def gt($severity; $file; $scope; $subject; $line; $metric; $value; $max):
    if (($value // 0) > $max) then row($severity; $file; $scope; $subject; $line; $metric; ($value // 0); "<=\($max)") else empty end;
  def lt($severity; $file; $scope; $subject; $line; $metric; $value; $min):
    if $value == null then empty
    elif ($value < $min) then row($severity; $file; $scope; $subject; $line; $metric; $value; ">=\($min)")
    else empty end;
  def number_or_null($value):
    if ($value | type) == "number" then $value
    elif ($value | type) == "string" then ($value | tonumber? // null)
    else null end;
  def range($severity; $file; $scope; $subject; $line; $metric; $value; $min; $max):
    if $value == null then empty
    elif ($value < $min or $value > $max) then row($severity; $file; $scope; $subject; $line; $metric; $value; "\($min)..\($max)")
    else empty end;
  def ratio($num; $den): if (($den // 0) > 0) then (($num // 0) / $den) else null end;

  .[] as $file |
  (
    ($file | [.. | objects | select(.kind? == "function" or .kind? == "closure")][]?) as $fn |
    ($file.name // "<unknown>") as $path |
    ($fn.name // "<anon>") as $name |
    ($fn.start_line // 0) as $line |
    gt("FAIL"; $path; $fn.kind; $name; $line; "cyclomatic"; $fn.metrics.cyclomatic.sum; $cyclomatic_max),
    gt("FAIL"; $path; $fn.kind; $name; $line; "cognitive"; ($fn.metrics.cognitive as $cognitive | number_or_null($cognitive.sum?) // number_or_null($cognitive) // 0); $cognitive_max),
    gt("FAIL"; $path; $fn.kind; $name; $line; "abc"; $fn.metrics.abc.magnitude; $abc_magnitude_max),
    (if $fn.kind == "closure"
      then gt("FAIL"; $path; "closure"; $name; $line; "nargs_closure"; $fn.metrics.nargs.closures_max; $nargs_closure_max)
      else gt("FAIL"; $path; "function"; $name; $line; "nargs_function"; $fn.metrics.nargs.functions_max; $nargs_function_max)
    end),
    gt("FAIL"; $path; $fn.kind; $name; $line; "nexits"; $fn.metrics.nexits.average; $nexits_max),
    gt("FAIL"; $path; $fn.kind; $name; $line; "lloc_function"; $fn.metrics.loc.lloc; $lloc_function_max),
    gt("FAIL"; $path; $fn.kind; $name; $line; "ploc_function"; $fn.metrics.loc.ploc; $ploc_function_max),
    gt("FAIL"; $path; $fn.kind; $name; $line; "sloc_function"; $fn.metrics.loc.sloc; $sloc_function_max),
    gt("FAIL"; $path; $fn.kind; $name; $line; "halstead_volume_function"; $fn.metrics.halstead.volume; $halstead_volume_function_max),
    gt("FAIL"; $path; $fn.kind; $name; $line; "halstead_bugs_function"; $fn.metrics.halstead.bugs; $halstead_bugs_function_max),
    gt("REVIEW"; $path; $fn.kind; $name; $line; "halstead_n1_function"; $fn.metrics.halstead.n1; $h_n1_function_max),
    gt("REVIEW"; $path; $fn.kind; $name; $line; "halstead_N1_function"; $fn.metrics.halstead.N1; $h_N1_function_max),
    gt("REVIEW"; $path; $fn.kind; $name; $line; "halstead_n2_function"; $fn.metrics.halstead.n2; $h_n2_function_max),
    gt("REVIEW"; $path; $fn.kind; $name; $line; "halstead_N2_function"; $fn.metrics.halstead.N2; $h_N2_function_max),
    gt("REVIEW"; $path; $fn.kind; $name; $line; "halstead_length_function"; $fn.metrics.halstead.length; $h_length_function_max),
    gt("REVIEW"; $path; $fn.kind; $name; $line; "halstead_estimated_program_length_function"; $fn.metrics.halstead.estimated_program_length; $h_estimated_function_max),
    gt("REVIEW"; $path; $fn.kind; $name; $line; "halstead_vocabulary_function"; $fn.metrics.halstead.vocabulary; $h_vocabulary_function_max),
    gt("REVIEW"; $path; $fn.kind; $name; $line; "halstead_difficulty_function"; $fn.metrics.halstead.difficulty; $h_difficulty_function_max),
    lt("REVIEW"; $path; $fn.kind; $name; $line; "halstead_level_function"; $fn.metrics.halstead.level; $h_level_function_min),
    gt("REVIEW"; $path; $fn.kind; $name; $line; "halstead_effort_function"; $fn.metrics.halstead.effort; $h_effort_function_max),
    gt("REVIEW"; $path; $fn.kind; $name; $line; "halstead_time_function"; $fn.metrics.halstead.time; $h_time_function_max),
    range("REVIEW"; $path; $fn.kind; $name; $line; "halstead_purity_ratio_function"; $fn.metrics.halstead.purity_ratio; $h_purity_function_min; $h_purity_function_max)
  ),
  (
    ($file.name // "<unknown>") as $path |
    ($file.metrics.loc.sloc // 0) as $file_sloc |
    gt("FAIL"; $path; "file"; $path; 0; "nom_functions_file"; $file.metrics.nom.functions; $nom_functions_file_max),
    gt("FAIL"; $path; "file"; $path; 0; "nom_closures_file"; $file.metrics.nom.closures; $nom_closures_file_max),
    gt("FAIL"; $path; "file"; $path; 0; "nom_total_file"; (($file.metrics.nom.functions // 0) + ($file.metrics.nom.closures // 0)); $nom_total_file_max),
    gt("FAIL"; $path; "file"; $path; 0; "lloc_file"; $file.metrics.loc.lloc; $lloc_file_max),
    gt("FAIL"; $path; "file"; $path; 0; "ploc_file"; $file.metrics.loc.ploc; $ploc_file_max),
    gt("FAIL"; $path; "file"; $path; 0; "sloc_file"; $file.metrics.loc.sloc; $sloc_file_max),
    gt("FAIL"; $path; "file"; $path; 0; "halstead_volume_file"; $file.metrics.halstead.volume; $halstead_volume_file_max),
    gt("FAIL"; $path; "file"; $path; 0; "halstead_bugs_file"; $file.metrics.halstead.bugs; $halstead_bugs_file_max),
    lt("FAIL"; $path; "file"; $path; 0; "mi_visual_studio"; ($file.metrics.mi // $file.metrics.maintanability_index).mi_visual_studio; $mi_visual_studio_min),
    gt("FAIL"; $path; "file"; $path; 0; "class_wmc"; $file.metrics.wmc.classes_sum; $class_wmc_max),
    gt("FAIL"; $path; "file"; $path; 0; "class_npm"; $file.metrics.npm.classes; $class_npm_max),
    gt("FAIL"; $path; "file"; $path; 0; "class_npa"; $file.metrics.npa.classes; $class_npa_max),
    gt("FAIL"; $path; "file"; $path; 0; "class_coa"; $file.metrics.npm.classes_average; $class_coa_max),
    gt("FAIL"; $path; "file"; $path; 0; "class_cda"; $file.metrics.npa.classes_average; $class_cda_max),
    gt("FAIL"; $path; "file"; $path; 0; "interface_npm"; $file.metrics.npm.interfaces; $interface_npm_max),
    gt("FAIL"; $path; "file"; $path; 0; "interface_npa"; $file.metrics.npa.interfaces; $interface_npa_max),
    lt("REVIEW"; $path; "file"; $path; 0; "mi_original"; ($file.metrics.mi // $file.metrics.maintanability_index).mi_original; $mi_original_min),
    lt("REVIEW"; $path; "file"; $path; 0; "mi_sei"; ($file.metrics.mi // $file.metrics.maintanability_index).mi_sei; $mi_sei_min),
    range("REVIEW"; $path; "file"; $path; 0; "cloc_ratio"; ratio($file.metrics.loc.cloc; $file_sloc); $cloc_ratio_min; $cloc_ratio_max),
    range("REVIEW"; $path; "file"; $path; 0; "blank_ratio"; ratio($file.metrics.loc.blank; $file_sloc); $blank_ratio_min; $blank_ratio_max),
    gt("REVIEW"; $path; "file"; $path; 0; "halstead_n1_file"; $file.metrics.halstead.n1; $h_n1_file_max),
    gt("REVIEW"; $path; "file"; $path; 0; "halstead_N1_file"; $file.metrics.halstead.N1; $h_N1_file_max),
    gt("REVIEW"; $path; "file"; $path; 0; "halstead_n2_file"; $file.metrics.halstead.n2; $h_n2_file_max),
    gt("REVIEW"; $path; "file"; $path; 0; "halstead_N2_file"; $file.metrics.halstead.N2; $h_N2_file_max),
    gt("REVIEW"; $path; "file"; $path; 0; "halstead_length_file"; $file.metrics.halstead.length; $h_length_file_max),
    gt("REVIEW"; $path; "file"; $path; 0; "halstead_estimated_program_length_file"; $file.metrics.halstead.estimated_program_length; $h_estimated_file_max),
    gt("REVIEW"; $path; "file"; $path; 0; "halstead_vocabulary_file"; $file.metrics.halstead.vocabulary; $h_vocabulary_file_max),
    gt("REVIEW"; $path; "file"; $path; 0; "halstead_difficulty_file"; $file.metrics.halstead.difficulty; $h_difficulty_file_max),
    lt("REVIEW"; $path; "file"; $path; 0; "halstead_level_file"; $file.metrics.halstead.level; $h_level_file_min),
    gt("REVIEW"; $path; "file"; $path; 0; "halstead_effort_file"; $file.metrics.halstead.effort; $h_effort_file_max),
    gt("REVIEW"; $path; "file"; $path; 0; "halstead_time_file"; $file.metrics.halstead.time; $h_time_file_max),
    range("REVIEW"; $path; "file"; $path; 0; "halstead_purity_ratio_file"; $file.metrics.halstead.purity_ratio; $h_purity_file_min; $h_purity_file_max)
  )
' "$TMP_JSON" >"$TMP_FINDINGS"

FAIL_COUNT=$(awk -F'|' '$1 == "FAIL" { count++ } END { print count + 0 }' "$TMP_FINDINGS")

jq -rs -r \
  --argjson cyclomatic_max "$CYCLOMATIC_MAX" \
  --argjson cognitive_max "$COGNITIVE_MAX" \
  --argjson abc_magnitude_max "$ABC_MAGNITUDE_MAX" \
  --argjson nargs_function_max "$NARGS_FUNCTION_MAX" \
  --argjson nargs_closure_max "$NARGS_CLOSURE_MAX" \
  --argjson nexits_max "$NEXITS_MAX" \
  --argjson lloc_function_max "$LLOC_FUNCTION_MAX" \
  --argjson ploc_function_max "$PLOC_FUNCTION_MAX" \
  --argjson sloc_function_max "$SLOC_FUNCTION_MAX" \
  --argjson halstead_volume_function_max "$HALSTEAD_VOLUME_FUNCTION_MAX" \
  --argjson halstead_bugs_function_max "$HALSTEAD_BUGS_FUNCTION_MAX" \
  --argjson cloc_ratio_min "$CLOC_RATIO_MIN" \
  --argjson cloc_ratio_max "$CLOC_RATIO_MAX" \
  --argjson blank_ratio_min "$BLANK_RATIO_MIN" \
  --argjson blank_ratio_max "$BLANK_RATIO_MAX" \
  --argjson interface_npa_max "$INTERFACE_NPA_MAX" '
  . as $files |
  def fns: [$files[] | .. | objects | select(.kind? == "function" or .kind? == "closure")];
  def maxv($xs): ($xs | max // 0);
  def minv($xs): ($xs | min // 0);
  def number_or_null($value):
    if ($value | type) == "number" then $value
    elif ($value | type) == "string" then ($value | tonumber? // null)
    else null end;
  "Cyclomatic Complexity|hard|<=\($cyclomatic_max)|\(maxv([fns[] | .metrics.cyclomatic.sum // 0]))",
  "Cognitive Complexity|hard|<=\($cognitive_max)|\(maxv([fns[] | (.metrics.cognitive as $cognitive | number_or_null($cognitive.sum?) // number_or_null($cognitive) // 0)]))",
  "ABC Magnitude|hard|<=\($abc_magnitude_max)|\(maxv([fns[] | .metrics.abc.magnitude // 0]))",
  "Function Arguments|hard|<=\($nargs_function_max)|\(maxv([fns[] | select(.kind == "function") | .metrics.nargs.functions_max // 0]))",
  "Closure Arguments|hard|<=\($nargs_closure_max)|\(maxv([fns[] | select(.kind == "closure") | .metrics.nargs.closures_max // 0]))",
  "Exit Points|hard|<=\($nexits_max)|\(maxv([fns[] | .metrics.nexits.average // 0]))",
  "Function LLOC|hard|<=\($lloc_function_max)|\(maxv([fns[] | .metrics.loc.lloc // 0]))",
  "Function PLOC|hard|<=\($ploc_function_max)|\(maxv([fns[] | .metrics.loc.ploc // 0]))",
  "Function SLOC|hard|<=\($sloc_function_max)|\(maxv([fns[] | .metrics.loc.sloc // 0]))",
  "Function Halstead Volume|hard|<=\($halstead_volume_function_max)|\(maxv([fns[] | .metrics.halstead.volume // 0]))",
  "Function Halstead Bugs|hard|<=\($halstead_bugs_function_max)|\(maxv([fns[] | .metrics.halstead.bugs // 0]))",
  "CLOC Ratio|review|\($cloc_ratio_min)..\($cloc_ratio_max)|\(maxv([$files[] | if ((.metrics.loc.sloc // 0) > 0) then ((.metrics.loc.cloc // 0) / .metrics.loc.sloc) else empty end]))",
  "Blank Ratio|review|\($blank_ratio_min)..\($blank_ratio_max)|\(maxv([$files[] | if ((.metrics.loc.sloc // 0) > 0) then ((.metrics.loc.blank // 0) / .metrics.loc.sloc) else empty end]))",
  "Interface Public Attributes|hard|<=\($interface_npa_max)|\(maxv([$files[] | .metrics.npa.interfaces // 0]))"
' "$TMP_JSON" >"$TMP_SUMMARY"

print_findings() {
  findings_file=$1
  printf '%-7s  %-48s  %-9s  %-28s  %4s  %-42s  %10s  %-12s\n' \
    "GATE" "FILE" "SCOPE" "SUBJECT" "LINE" "METRIC" "VALUE" "LIMIT"
  printf '%0.s-' $(seq 1 176) && printf '\n'
  while IFS='|' read -r severity file scope subject line metric value limit; do
    [ "$severity" = "FAIL" ] || continue
    printf '%-7s  %-48s  %-9s  %-28s  %4s  %-42s  %10s  %-12s\n' \
      "$severity" "$file" "$scope" "$subject" "$line" "$metric" "$value" "$limit"
  done <"$findings_file"
}

append_summary_table() {
  {
    printf '| Metric | Gate | Threshold | Measured |\n'
    printf '|--------|------|-----------|----------|\n'
    while IFS='|' read -r metric gate threshold measured; do
      [ "$gate" = "review" ] && continue
      printf '| %s | %s | `%s` | %s |\n' "$metric" "$gate" "$threshold" "$measured"
    done <"$TMP_SUMMARY"
  } >>"$GITHUB_STEP_SUMMARY"
}

if [ "$FAIL_COUNT" -gt 0 ]; then
  printf '\n'
  printf 'rust-code-analysis: %d hard violation(s) found\n\n' "$FAIL_COUNT"
  print_findings "$TMP_FINDINGS"
  printf '\n'

  if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then
    {
      printf '## rust-code-analysis: %d hard violation(s)\n\n' "$FAIL_COUNT"
      printf '| Gate | File | Scope | Subject | Line | Metric | Value | Limit |\n'
      printf '|------|------|-------|---------|------|--------|-------|-------|\n'
      while IFS='|' read -r severity file scope subject line metric value limit; do
        [ "$severity" = "FAIL" ] || continue
        printf '| %s | `%s` | %s | `%s` | %s | %s | %s | `%s` |\n' \
          "$severity" "$file" "$scope" "$subject" "$line" "$metric" "$value" "$limit"
      done <"$TMP_FINDINGS"
      printf '\n'
    } >>"$GITHUB_STEP_SUMMARY"
  fi

  printf 'lint-metrics FAILED: %d hard violation(s) - fix the above before pushing\n' \
    "$FAIL_COUNT" >&2
  exit 1
fi

printf '\n'
printf 'rust-code-analysis: all hard checks pass\n\n'

printf 'Scope: src/ | hard-fail policy thresholds enforced.\n'

if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then
  {
    printf '## rust-code-analysis: all hard checks pass\n\n'
  } >>"$GITHUB_STEP_SUMMARY"
  append_summary_table
  printf '\nAll hard-fail metrics in `src/` are within policy thresholds.\n' >>"$GITHUB_STEP_SUMMARY"
fi

exit 0
