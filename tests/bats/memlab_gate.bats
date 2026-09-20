#!/usr/bin/env bats

load './test_helper.bash'

setup() {
  setup_memlab_test_env
}

healthy_scenario() {
  cat <<'SCENARIO'
module.exports = {
  url: () => 'http://localhost:3001/',
  action: async () => {},
  back: async () => {},
};
SCENARIO
}

@test "memlab runner exits 0 when scenarios run and no leak is detected" {
  write_memlab_scenario_file 'healthy.js' "$(healthy_scenario)"

  FAKE_MEMLAB_LEAKS='[]' run_memlab_runner
  [ "$status" -eq 0 ]
  assert_output_contains '1 scenario(s) executed with no unallowlisted leaks'
}

@test "memlab runner exits 1 when a leak is detected" {
  write_memlab_scenario_file 'healthy.js' "$(healthy_scenario)"

  FAKE_MEMLAB_LEAKS='[{"node":{"value":"[Detached <div id=\"reg-form-0\">](native) @124147"}}]' run_memlab_runner
  [ "$status" -eq 1 ]
  assert_output_contains '✗ Memory leak in scenario default'
  assert_output_contains 'Detached <div id="reg-form-0">'
  assert_output_contains '✗ Scenario default leaked'
  assert_output_contains '1 unallowlisted memory leak(s) detected'
  [[ "$output" != *'✅ Completed scenario'* ]]
}

@test "memlab runner does not waive an unrelated leak from a partial allowlist entry" {
  write_memlab_scenario_file 'healthy.js' "$(healthy_scenario)"
  write_memlab_allowlist \
    '{ "leaks": [{ "trace": "Detached <div id=", "reason": "partial trace must not match" }] }'

  FAKE_MEMLAB_LEAKS='[{"node":{"value":"[Detached <div id=\"other-el\">](native) @9]"}}]' run_memlab_runner
  [ "$status" -eq 1 ]
  assert_output_contains '1 unallowlisted memory leak(s) detected'
}

@test "memlab runner does not waive a leak whose motifs are only partly allowlisted" {
  write_memlab_scenario_file 'healthy.js' "$(healthy_scenario)"
  write_memlab_allowlist \
    '{ "leaks": [{ "trace": "Detached <div id=\"a\">", "reason": "only one of two motifs" }] }'

  FAKE_MEMLAB_LEAKS='[{"node":{"value":"[Detached <div id=\"a\">](native) @1"},
    "retainer":{"value":"[Detached <span id=\"b\">](native) @2"}}]' run_memlab_runner
  [ "$status" -eq 1 ]
  assert_output_contains 'Detached <span id="b">'
  assert_output_contains '1 unallowlisted memory leak(s) detected'
}

@test "memlab runner exits 0 when every detected leak is allowlisted" {
  write_memlab_scenario_file 'healthy.js' "$(healthy_scenario)"
  write_memlab_allowlist \
    '{ "leaks": [{ "trace": "Detached <div id=\"reg-form-0\">", "reason": "upstream MUI retention" }] }'

  FAKE_MEMLAB_LEAKS='[{"node":{"value":"[Detached <div id=\"reg-form-0\">](native) @124147"}}]' run_memlab_runner
  [ "$status" -eq 0 ]
  assert_output_contains 'Allowlisted leak in scenario default'
  assert_output_contains '1 scenario(s) executed with no unallowlisted leaks'
}

@test "memlab runner exits 1 when the scenario directory is empty" {
  FAKE_MEMLAB_LEAKS='[]' run_memlab_runner
  [ "$status" -eq 1 ]
  assert_output_contains 'No memory leak scenarios were executed'
}

@test "memlab runner exits 1 when a scenario file exports no scenario" {
  write_memlab_scenario_file 'healthy.js' "$(healthy_scenario)"
  write_memlab_scenario_file 'zz-empty.js' 'module.exports = {};'

  FAKE_MEMLAB_LEAKS='[]' run_memlab_runner
  [ "$status" -eq 1 ]
  assert_output_contains 'zz-empty.js exports no valid memory leak scenario'
}

@test "memlab runner discovers scenarios in nested folders and non-.js module extensions" {
  mkdir -p "$MEMLAB_RUNNER_DIR/tests/flows"
  write_memlab_scenario_file 'flows/nested.cjs' "$(healthy_scenario)"
  write_memlab_scenario_file 'top.js' "$(healthy_scenario)"

  FAKE_MEMLAB_LEAKS='[]' run_memlab_runner
  [ "$status" -eq 0 ]
  assert_output_contains '2 scenario(s) executed with no unallowlisted leaks'
}

@test "memlab runner exits 1 when the leak allowlist is malformed" {
  write_memlab_scenario_file 'healthy.js' "$(healthy_scenario)"
  write_memlab_allowlist '{ "leaks": [{ "trace": "Detached <div id=" }] }'

  FAKE_MEMLAB_LEAKS='[]' run_memlab_runner
  [ "$status" -eq 1 ]
  assert_output_contains 'needs a non-empty "reason" string'
}

@test "memlab runner uses run leaks once and retains every named scenario and analysis" {
  write_memlab_scenario_file 'healthy.js' "$(healthy_scenario)
module.exports.second = { ...module.exports };"

  FAKE_MEMLAB_LEAKS='[]' run_memlab_runner
  [ "$status" -eq 0 ]
  [ "$(printf '%s\n' "$output" | grep -c '^MEMLAB_RUN$')" -eq 2 ]
  [ "$(printf '%s\n' "$output" | grep -c '^MEMLAB_ANALYZE$')" -eq 2 ]
  [ "$(printf '%s\n' "$output" | grep -c '^MEMLAB_CLEANUP$')" -eq 2 ]
  assert_output_contains '2 scenario(s) executed with no unallowlisted leaks'
  assert_output_contains '[memlab] before scenario rssMiB='
  assert_output_contains '[memlab] after scenario rssMiB='
}

@test "memlab runner cleans results and fails when string analysis throws" {
  write_memlab_scenario_file 'healthy.js' "$(healthy_scenario)"

  FAKE_MEMLAB_ANALYZE_ERROR=1 run_memlab_runner
  [ "$status" -eq 1 ]
  assert_output_contains 'analysis failed'
  assert_output_contains 'MEMLAB_CLEANUP'
  [[ "$output" != *'✅ Completed scenario'* ]]
}

@test "memlab runner fails without a success verdict when browser setup throws" {
  write_memlab_scenario_file 'healthy.js' "$(healthy_scenario)"

  FAKE_MEMLAB_RUN_ERROR=1 run_memlab_runner
  [ "$status" -eq 1 ]
  assert_output_contains 'scenario failed'
  [[ "$output" != *'MEMLAB_ANALYZE'* ]]
  [[ "$output" != *'✅ Completed scenario'* ]]
}

@test "memlab workers have fresh PIDs and workdirs and exit before the next worker starts" {
  write_memlab_scenario_file 'healthy.js' "$(healthy_scenario)
module.exports.second = { ...module.exports };
module.exports.third = { ...module.exports };"
  export FAKE_MEMLAB_EVENTS="$BATS_TEST_TMPDIR/events.jsonl"

  run_memlab_runner
  [ "$status" -eq 0 ]
  assert_output_contains '3 scenario(s) executed with no unallowlisted leaks'
  assert_output_contains '[memlab] worker pid='
  node - "$FAKE_MEMLAB_EVENTS" <<'NODE'
const assert = require('node:assert/strict');
const fs = require('node:fs');
const events = fs.readFileSync(process.argv[2], 'utf8').trim().split('\n').map(JSON.parse);
assert.deepEqual(events.map(({event}) => event), [
  'start', 'cleanup', 'exit', 'start', 'cleanup', 'exit', 'start', 'cleanup', 'exit',
]);
assert.equal(new Set(events.map(({pid}) => pid)).size, 3);
assert.equal(new Set(events.map(({workDir}) => workDir)).size, 3);
NODE
}

@test "memlab aggregates all workers after an early scenario error" {
  write_memlab_scenario_file 'a-failing.js' "$(healthy_scenario)
module.exports.workerError = true;"
  write_memlab_scenario_file 'b-healthy.js' "$(healthy_scenario)
module.exports.second = { ...module.exports };"

  run_memlab_runner
  [ "$status" -eq 1 ]
  [ "$(printf '%s\n' "$output" | grep -c '^MEMLAB_RUN$')" -eq 3 ]
  [ "$(printf '%s\n' "$output" | grep -c '^MEMLAB_ANALYZE$')" -eq 2 ]
  assert_output_contains 'Completed scenario: second'
  assert_output_contains '1 worker failure(s)'
  [[ "$output" != *'executed with no unallowlisted leaks'* ]]
}

@test "memlab fails closed when worker exits zero without a completion verdict" {
  write_memlab_scenario_file 'healthy.js' "$(healthy_scenario)
module.exports.workerExit = 0;"

  run_memlab_runner
  [ "$status" -eq 1 ]
  assert_output_contains '1 worker failure(s)'
  [[ "$output" != *'executed with no unallowlisted leaks'* ]]
}

@test "memlab fails closed when a worker is terminated by a signal" {
  write_memlab_scenario_file 'healthy.js' "$(healthy_scenario)
module.exports.workerSignal = 'SIGKILL';"

  run_memlab_runner
  [ "$status" -eq 1 ]
  assert_output_contains 'Worker terminated by SIGKILL'
  [[ "$output" != *'executed with no unallowlisted leaks'* ]]
}

@test "memlab fails closed when result cleanup throws" {
  write_memlab_scenario_file 'healthy.js' "$(healthy_scenario)"

  FAKE_MEMLAB_CLEANUP_ERROR=1 run_memlab_runner
  [ "$status" -eq 1 ]
  assert_output_contains 'cleanup failed'
  [[ "$output" != *'✅ Completed scenario'* ]]
}

@test "memlab collects leak verdicts from every worker rather than stopping after first leak" {
  write_memlab_scenario_file 'healthy.js' "$(healthy_scenario)
module.exports.second = { ...module.exports };"

  FAKE_MEMLAB_LEAKS='[{"node":{"value":"unexpected retention"}}]' run_memlab_runner
  [ "$status" -eq 1 ]
  [ "$(printf '%s\n' "$output" | grep -c '^MEMLAB_ANALYZE$')" -eq 2 ]
  assert_output_contains '2 unallowlisted memory leak(s) detected across 2 scenario(s)'
}

@test "memlab discovers an ESM default as well as CJS default and named exports" {
  write_memlab_scenario_file 'esm.mjs' \
    'export default { url: "http://localhost:3001/", action: async () => {} };'
  write_memlab_scenario_file 'cjs.js' "$(healthy_scenario)
module.exports.named = { ...module.exports };"

  run_memlab_runner
  [ "$status" -eq 0 ]
  assert_output_contains '3 scenario(s) executed with no unallowlisted leaks'
  [ "$(printf '%s\n' "$output" | grep -c '^MEMLAB_ANALYZE$')" -eq 3 ]
}

@test "memlab failure exits despite a retained event-loop handle" {
  write_memlab_scenario_file 'a-failing.js' "$(healthy_scenario)
module.exports.workerOpenHandle = true;
module.exports.workerError = true;"
  write_memlab_scenario_file 'b-healthy.js' "$(healthy_scenario)"

  cd "$MEMLAB_SANDBOX"
  run timeout 10 node tests/memory-leak/run-memlab-tests.js
  [ "$status" -eq 1 ]
  assert_output_contains 'selected scenario failed'
  assert_output_contains 'Completed scenario: default'
  assert_output_contains '1 worker failure(s)'
}
