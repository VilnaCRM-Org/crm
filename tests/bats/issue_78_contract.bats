#!/usr/bin/env bats

load './test_helper.bash'

@test "make target coverage manifest accounts for every Makefile target" {
  local manifest_path="$PROJECT_ROOT/tests/bats/make-target-coverage.tsv"
  local expected_targets="$BATS_TEST_TMPDIR/expected-targets.txt"
  local manifest_targets="$BATS_TEST_TMPDIR/manifest-targets.txt"

  [ -f "$manifest_path" ]

  awk -F: '/^[A-Za-z0-9_.-]+:/{ if ($1 !~ /^\./) print $1 }' \
    "$PROJECT_ROOT/Makefile" \
    | sort -u > "$expected_targets"

  tail -n +2 "$manifest_path" | cut -f1 | sort -u > "$manifest_targets"

  run diff -u "$expected_targets" "$manifest_targets"
  [ "$status" -eq 0 ]
}

@test "every Bats-covered target points at an existing test file" {
  local manifest_path="$PROJECT_ROOT/tests/bats/make-target-coverage.tsv"

  [ -f "$manifest_path" ]

  while IFS=$'\t' read -r target coverage evidence details; do
    [ -n "$target" ] || continue
    [ "$target" != "target" ] || continue

    [ -f "$PROJECT_ROOT/$evidence" ]

    if [ "$coverage" = "bats" ]; then
      run awk -v target="$target" '
        BEGIN { found = 0 }
        {
          for (i = 1; i <= NF; i++) {
            if ($i == target) {
              found = 1
            }
          }
        }
        END { exit(found ? 0 : 1) }
      ' FS='[^A-Za-z0-9_.-]+' "$PROJECT_ROOT/$evidence"
      [ "$status" -eq 0 ]
    fi
  done < "$manifest_path"
}

@test "CI helper scripts only call existing Makefile targets" {
  local expected_targets="$BATS_TEST_TMPDIR/known-targets.txt"
  local hard_coded_targets="$BATS_TEST_TMPDIR/script-targets.txt"
  local missing_targets="$BATS_TEST_TMPDIR/missing-targets.txt"

  awk -F: '/^[A-Za-z0-9_.-]+:/{ if ($1 !~ /^\./) print $1 }' \
    "$PROJECT_ROOT/Makefile" \
    | sort -u > "$expected_targets"

  grep -RhoE 'make [A-Za-z0-9_.-]+' "$PROJECT_ROOT/scripts/ci" \
    | awk '{ print $2 }' \
    | sort -u > "$hard_coded_targets"

  comm -23 "$hard_coded_targets" "$expected_targets" > "$missing_targets"

  run test ! -s "$missing_targets"
  [ "$status" -eq 0 ]
}

@test "a pull request workflow runs make test-bats with explicit read-only permissions" {
  local workflows_with_bats="$BATS_TEST_TMPDIR/workflows-with-bats.txt"
  local workflow_path

  grep -RFl 'make test-bats' "$PROJECT_ROOT/.github/workflows" > "$workflows_with_bats"
  run test -s "$workflows_with_bats"
  [ "$status" -eq 0 ]

  while IFS= read -r workflow_path; do
    run grep -F 'pull_request:' "$workflow_path"
    [ "$status" -eq 0 ]

    run grep -F 'contents: read' "$workflow_path"
    [ "$status" -eq 0 ]

    run grep -F 'contents: write' "$workflow_path"
    [ "$status" -ne 0 ]
  done < "$workflows_with_bats"
}

@test "repository docs explain how to run and maintain the Bats suite" {
  run grep -F 'make test-bats' "$PROJECT_ROOT/README.md"
  [ "$status" -eq 0 ]

  run grep -F 'make-target-coverage.tsv' "$PROJECT_ROOT/CONTRIBUTING.md"
  [ "$status" -eq 0 ]
}
