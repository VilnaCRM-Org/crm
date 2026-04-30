#!/usr/bin/env sh
# scripts/lint-metrics.sh - rust-code-analysis metrics enforcement for src/
#
# Exit 0 = no hard-fail violations
# Exit 1 = one or more hard-fail violations detected
#
# Review-gate metrics are calculated internally but not printed and do not block CI.
# Hard-fail thresholds are read from METRICS_POLICY (JSON config file) so the policy
# is kept in a single versioned source with schema validation.

set -eu

if ! command -v jq >/dev/null 2>&1; then
  printf 'ERROR: jq is required by lint-metrics but was not found in PATH\n' >&2
  exit 1
fi

RCA_BIN="${RCA_BIN:-./bin/rust-code-analysis-cli}"
RCA_VERSION="${RCA_VERSION:-}"

if [ -z "${METRICS_POLICY:-}" ]; then
  printf 'ERROR: METRICS_POLICY must be set to the path of the JSON policy file\n' >&2
  exit 1
fi

if [ ! -f "$METRICS_POLICY" ]; then
  printf 'ERROR: METRICS_POLICY file not found: %s\n' "$METRICS_POLICY" >&2
  exit 1
fi

if ! jq empty "$METRICS_POLICY" 2>/dev/null; then
  printf 'ERROR: METRICS_POLICY is not valid JSON: %s\n' "$METRICS_POLICY" >&2
  exit 1
fi

METRICS_POLICY_SCHEMA="${METRICS_POLICY_SCHEMA:-config/metrics-policy.schema.json}"

if [ ! -f "$METRICS_POLICY_SCHEMA" ]; then
  printf 'ERROR: METRICS_POLICY_SCHEMA file not found: %s\n' "$METRICS_POLICY_SCHEMA" >&2
  exit 1
fi

if ! jq empty "$METRICS_POLICY_SCHEMA" 2>/dev/null; then
  printf 'ERROR: METRICS_POLICY_SCHEMA is not valid JSON: %s\n' "$METRICS_POLICY_SCHEMA" >&2
  exit 1
fi

schema_errors=$(
  jq -r --slurpfile policy "$METRICS_POLICY" '
    . as $schema | $policy[0] as $p |
    [
      ( $p | keys[] as $k | select($schema.properties[$k] == null)
        | "unknown top-level key: \($k)" ),
      ( $schema.required[]? as $req | select(($p | has($req)) | not)
        | "missing required top-level key: \($req)" ),
      ( $schema.properties | to_entries[] as $section
        | $p[$section.key] as $block
        | select($block != null)
        | if (($block | type) != "object") then
            "non-object section: \($section.key): got \($block | type)"
          else
            ( ( $section.value.required[]? as $req
                | select(($block | has($req)) | not)
                | "missing required key: \($section.key).\($req)" ),
              ( $block | keys[] as $k
                | select($section.value.properties[$k] == null)
                | "unknown key: \($section.key).\($k)" ),
              ( $block | to_entries[] as $e
                | $section.value.properties[$e.key] as $prop
                | select($prop != null)
                | ( select(($e.value | type) != "number")
                    | "non-numeric value for \($section.key).\($e.key): got \($e.value | type)" ),
                  ( select(($e.value | type) == "number")
                    | ( select($prop.minimum != null and $e.value < $prop.minimum)
                        | "\($section.key).\($e.key)=\($e.value) below minimum \($prop.minimum)" ),
                      ( select($prop.maximum != null and $e.value > $prop.maximum)
                        | "\($section.key).\($e.key)=\($e.value) above maximum \($prop.maximum)" )
                  )
              )
            )
          end
      )
    ] | .[]
  ' "$METRICS_POLICY_SCHEMA"
)

if [ -n "$schema_errors" ]; then
  printf 'ERROR: METRICS_POLICY does not satisfy schema (%s):\n' "$METRICS_POLICY_SCHEMA" >&2
  printf '%s\n' "$schema_errors" | sed 's/^/  - /' >&2
  exit 1
fi

threshold_assignments=$(
  jq -re '
    def hard_number($key):
      .hard[$key] | if type == "number" then . else error("missing or non-numeric key .hard." + $key) end;
    def review_number($key; $default):
      (.review[$key] // $default) | if type == "number" then . else error("non-numeric key .review." + $key) end;

    [
      "CYCLOMATIC_MAX=\(hard_number("cyclomatic_max") | @sh)",
      "COGNITIVE_MAX=\(hard_number("cognitive_max") | @sh)",
      "ABC_MAGNITUDE_MAX=\(hard_number("abc_magnitude_max") | @sh)",
      "NARGS_FUNCTION_MAX=\(hard_number("nargs_function_max") | @sh)",
      "NARGS_CLOSURE_MAX=\(hard_number("nargs_closure_max") | @sh)",
      "NEXITS_MAX=\(hard_number("nexits_max") | @sh)",
      "LLOC_FUNCTION_MAX=\(hard_number("lloc_function_max") | @sh)",
      "PLOC_FUNCTION_MAX=\(hard_number("ploc_function_max") | @sh)",
      "SLOC_FUNCTION_MAX=\(hard_number("sloc_function_max") | @sh)",
      "HALSTEAD_VOLUME_FUNCTION_MAX=\(hard_number("halstead_volume_function_max") | @sh)",
      "HALSTEAD_BUGS_FUNCTION_MAX=\(hard_number("halstead_bugs_function_max") | @sh)",
      "NOM_FUNCTIONS_FILE_MAX=\(hard_number("nom_functions_file_max") | @sh)",
      "NOM_CLOSURES_FILE_MAX=\(hard_number("nom_closures_file_max") | @sh)",
      "NOM_TOTAL_FILE_MAX=\(hard_number("nom_total_file_max") | @sh)",
      "LLOC_FILE_MAX=\(hard_number("lloc_file_max") | @sh)",
      "PLOC_FILE_MAX=\(hard_number("ploc_file_max") | @sh)",
      "SLOC_FILE_MAX=\(hard_number("sloc_file_max") | @sh)",
      "HALSTEAD_VOLUME_FILE_MAX=\(hard_number("halstead_volume_file_max") | @sh)",
      "HALSTEAD_BUGS_FILE_MAX=\(hard_number("halstead_bugs_file_max") | @sh)",
      "MI_VISUAL_STUDIO_MIN=\(hard_number("mi_visual_studio_min") | @sh)",
      "CLASS_WMC_MAX=\(hard_number("class_wmc_max") | @sh)",
      "CLASS_NPM_MAX=\(hard_number("class_npm_max") | @sh)",
      "CLASS_NPA_MAX=\(hard_number("class_npa_max") | @sh)",
      "CLASS_COA_MAX=\(hard_number("class_coa_max") | @sh)",
      "CLASS_CDA_MAX=\(hard_number("class_cda_max") | @sh)",
      "INTERFACE_NPM_MAX=\(hard_number("interface_npm_max") | @sh)",
      "INTERFACE_NPA_MAX=\(hard_number("interface_npa_max") | @sh)",
      "MI_ORIGINAL_MIN=\(review_number("mi_original_min"; 65) | @sh)",
      "MI_SEI_MIN=\(review_number("mi_sei_min"; 65) | @sh)",
      "CLOC_RATIO_MIN=\(review_number("cloc_ratio_min"; 0.10) | @sh)",
      "CLOC_RATIO_MAX=\(review_number("cloc_ratio_max"; 0.60) | @sh)",
      "BLANK_RATIO_MIN=\(review_number("blank_ratio_min"; 0.02) | @sh)",
      "BLANK_RATIO_MAX=\(review_number("blank_ratio_max"; 0.30) | @sh)",
      "HALSTEAD_N1_FUNCTION_MAX=\(review_number("halstead_n1_function_max"; 30) | @sh)",
      "HALSTEAD_N1_TOTAL_FUNCTION_MAX=\(review_number("halstead_n1_total_function_max"; 80) | @sh)",
      "HALSTEAD_N2_FUNCTION_MAX=\(review_number("halstead_n2_function_max"; 40) | @sh)",
      "HALSTEAD_N2_TOTAL_FUNCTION_MAX=\(review_number("halstead_n2_total_function_max"; 120) | @sh)",
      "HALSTEAD_LENGTH_FUNCTION_MAX=\(review_number("halstead_length_function_max"; 180) | @sh)",
      "HALSTEAD_ESTIMATED_LENGTH_FUNCTION_MAX=\(review_number("halstead_estimated_length_function_max"; 160) | @sh)",
      "HALSTEAD_VOCABULARY_FUNCTION_MAX=\(review_number("halstead_vocabulary_function_max"; 70) | @sh)",
      "HALSTEAD_DIFFICULTY_FUNCTION_MAX=\(review_number("halstead_difficulty_function_max"; 25) | @sh)",
      "HALSTEAD_LEVEL_FUNCTION_MIN=\(review_number("halstead_level_function_min"; 0.03) | @sh)",
      "HALSTEAD_EFFORT_FUNCTION_MAX=\(review_number("halstead_effort_function_max"; 30000) | @sh)",
      "HALSTEAD_TIME_FUNCTION_MAX=\(review_number("halstead_time_function_max"; 1800) | @sh)",
      "HALSTEAD_PURITY_RATIO_FUNCTION_MIN=\(review_number("halstead_purity_ratio_function_min"; 0.60) | @sh)",
      "HALSTEAD_PURITY_RATIO_FUNCTION_MAX=\(review_number("halstead_purity_ratio_function_max"; 1.40) | @sh)",
      "HALSTEAD_N1_FILE_MAX=\(review_number("halstead_n1_file_max"; 60) | @sh)",
      "HALSTEAD_N1_TOTAL_FILE_MAX=\(review_number("halstead_n1_total_file_max"; 400) | @sh)",
      "HALSTEAD_N2_FILE_MAX=\(review_number("halstead_n2_file_max"; 90) | @sh)",
      "HALSTEAD_N2_TOTAL_FILE_MAX=\(review_number("halstead_n2_total_file_max"; 800) | @sh)",
      "HALSTEAD_LENGTH_FILE_MAX=\(review_number("halstead_length_file_max"; 1000) | @sh)",
      "HALSTEAD_ESTIMATED_LENGTH_FILE_MAX=\(review_number("halstead_estimated_length_file_max"; 850) | @sh)",
      "HALSTEAD_VOCABULARY_FILE_MAX=\(review_number("halstead_vocabulary_file_max"; 140) | @sh)",
      "HALSTEAD_DIFFICULTY_FILE_MAX=\(review_number("halstead_difficulty_file_max"; 40) | @sh)",
      "HALSTEAD_LEVEL_FILE_MIN=\(review_number("halstead_level_file_min"; 0.02) | @sh)",
      "HALSTEAD_EFFORT_FILE_MAX=\(review_number("halstead_effort_file_max"; 250000) | @sh)",
      "HALSTEAD_TIME_FILE_MAX=\(review_number("halstead_time_file_max"; 15000) | @sh)",
      "HALSTEAD_PURITY_RATIO_FILE_MIN=\(review_number("halstead_purity_ratio_file_min"; 0.60) | @sh)",
      "HALSTEAD_PURITY_RATIO_FILE_MAX=\(review_number("halstead_purity_ratio_file_max"; 1.40) | @sh)"
    ] | .[]
  ' "$METRICS_POLICY"
) || {
  printf 'ERROR: failed to read threshold values from %s\n' "$METRICS_POLICY" >&2
  exit 1
}
eval "$threshold_assignments"

RCA_SCOPE="${RCA_SCOPE:-src/}"
if [ -z "${RCA_EXCLUDES:-}" ]; then
  printf 'ERROR: RCA_EXCLUDES must be set by Makefile or environment\n' >&2
  exit 1
fi

if [ ! -x "$RCA_BIN" ]; then
  printf 'ERROR: %s not found or not executable\n' "$RCA_BIN" >&2
  exit 1
fi

TMP_JSON=$(mktemp "${TMPDIR:-/tmp}/rca-analysis.XXXXXX")
TMP_FINDINGS=$(mktemp "${TMPDIR:-/tmp}/rca-findings.XXXXXX")
TMP_SUMMARY=$(mktemp "${TMPDIR:-/tmp}/rca-summary.XXXXXX")

trap 'rm -f "$TMP_JSON" "$TMP_FINDINGS" "$TMP_SUMMARY"' EXIT INT TERM

VER_LABEL=""
if [ -n "$RCA_VERSION" ]; then VER_LABEL=" v${RCA_VERSION}"; fi
printf 'lint-metrics: analyzing %s with rust-code-analysis%s\n' "$RCA_SCOPE" "$VER_LABEL"

set -- -m -O json -p "$RCA_SCOPE"
set -f
for exclude_pattern in $RCA_EXCLUDES; do
  set -- "$@" -X "$exclude_pattern"
done
set +f

"$RCA_BIN" "$@" >"$TMP_JSON"

if [ ! -s "$TMP_JSON" ] || ! jq -e -s 'length > 0 and all(.[]; type == "object")' "$TMP_JSON" >/dev/null 2>&1; then
  printf 'ERROR: rust-code-analysis produced no JSON output objects; check %s and the analyzer invocation\n' "$TMP_JSON" >&2
  exit 1
fi

jq -rs \
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

jq -rs \
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
  printf '%*s\n' 176 '' | tr ' ' '-'
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
      if [ "$gate" = "review" ]; then
        continue
      fi
      printf "| %s | %s | \`%s\` | %s |\n" "$metric" "$gate" "$threshold" "$measured"
    done <"$TMP_SUMMARY"
  } >>"$GITHUB_STEP_SUMMARY"
}

print_summary_stdout() {
  printf '%-28s  %-6s  %-16s  %s\n' "METRIC" "GATE" "THRESHOLD" "MEASURED"
  printf '%*s\n' 78 '' | tr ' ' '-'
  while IFS='|' read -r metric gate threshold measured; do
    if [ "$gate" = "review" ]; then
      continue
    fi
    printf '%-28s  %-6s  %-16s  %s\n' "$metric" "$gate" "$threshold" "$measured"
  done <"$TMP_SUMMARY"
}

if [ "$FAIL_COUNT" -gt 0 ]; then
  printf '\n'
  printf 'rust-code-analysis: %d hard violation(s) found\n\n' "$FAIL_COUNT"
  printf 'Selected measured metrics:\n\n'
  print_summary_stdout || true
  printf '\nViolations:\n\n'
  print_findings "$TMP_FINDINGS" || true
  printf '\n'

  if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then
    {
      printf '## rust-code-analysis: %d hard violation(s)\n\n' "$FAIL_COUNT"
      printf '| Gate | File | Scope | Subject | Line | Metric | Value | Limit |\n'
      printf '|------|------|-------|---------|------|--------|-------|-------|\n'
      while IFS='|' read -r severity file scope subject line metric value limit; do
        [ "$severity" = "FAIL" ] || continue
        printf "| %s | \`%s\` | %s | \`%s\` | %s | %s | %s | \`%s\` |\n" \
          "$severity" "$file" "$scope" "$subject" "$line" "$metric" "$value" "$limit"
      done <"$TMP_FINDINGS"
      printf '\n'
    } >>"$GITHUB_STEP_SUMMARY" || true
  fi

  printf 'lint-metrics FAILED: %d hard violation(s) - fix the above before pushing\n' \
    "$FAIL_COUNT" >&2
  exit 1
fi

printf '\n'
printf 'rust-code-analysis: all hard checks pass\n\n'
print_summary_stdout || true
printf '\n'

printf 'Scope: %s | selected hard-fail policy thresholds shown; all hard-fail thresholds enforced.\n' "$RCA_SCOPE"

if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then
  {
    printf '## rust-code-analysis: all hard checks pass\n\n'
  } >>"$GITHUB_STEP_SUMMARY" || true
  append_summary_table || true
  printf "\nAll hard-fail metrics in \`%s\` are within policy thresholds.\n" "$RCA_SCOPE" >>"$GITHUB_STEP_SUMMARY" || true
fi

exit 0
