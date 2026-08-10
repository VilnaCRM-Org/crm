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
