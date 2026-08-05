---
name: make-target-maintenance
description: Update bats assertions and make-target-coverage.tsv when adding new make targets to prevent CI check failures
---

## When to Use

Use this skill whenever you add a new make target to the `Makefile` or related make configuration. Failing to sync the supporting test artifacts will cause the `bats` CI check to fail.

## The Pattern

When you add a new make target, you must update three artifacts:

### 1. Bats Test Assertions

Edit `test/bats/makefile_targets.bats` and `test/bats/issue_78_contract.bats`:

- Update the `CI_LINT_TARGETS` list in the assertions to include the new target
- Update the `CI_TARGETS` list if the target should run in CI workflows
- Add a new assertion if the target has specific test-worthy behavior

### 2. Make-Target Coverage Manifest

Edit `make-target-coverage.tsv`:

- Add a new row for the target with its name, category, and description
- Ensure all TSV columns are populated correctly
- This manifest is consumed by the coverage assertions in the bats tests

### 3. Test Helper (if applicable)

Edit `test/bats/test_helper.bash`:

- Add a direct-command test for the target if it's user-facing or CI-gating
- Add a sandbox stub to simulate the target's behavior in test isolation
- This prevents the actual target from running during test execution

## Verification

Run these commands locally before pushing to ensure all artifacts are in sync:

```bash
make lint        # Lints all files, including bats and test helpers
bats test/bats   # Runs the bats test suite (or use your project's runner)
```

All bats tests must pass (typically 16/16). In CI, the `bats` check will fail if these artifacts are out of sync with the actual Makefile targets.

## Example (from issue #112)

When adding the `check-env-sync` target:

1. Updated the `CI_LINT_TARGETS` array in `makefile_targets.bats`
2. Added a row to `make-target-coverage.tsv` with target metadata
3. Added a test case and sandbox stub in `test_helper.bash`
4. Ran `make lint` and bats tests locally — all 16 tests passed
5. Pushed with confidence that the bats CI check would pass

## Root Cause

The bats tests use hardcoded lists and a manifest to verify that the `Makefile` correctly declares all targets. When a new target is added without updating these artifacts, the assertions fail, catching the gap during CI.
