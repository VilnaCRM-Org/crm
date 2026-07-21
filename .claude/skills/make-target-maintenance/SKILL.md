---
name: make-target-maintenance
description: Keep the Bats make-target contract in sync when adding or renaming a Makefile target so the bats CI check stays green
---

## When to Use

Use this skill whenever you add or rename any non-dot `Makefile` target. The `bats` CI check
enforces a hard contract that every target is accounted for; skipping the sync below fails CI
(and the local pre-push hook).

## The Contract

`tests/bats/issue_78_contract.bats` asserts two things:

1. **Manifest completeness** — the set of targets in `tests/bats/make-target-coverage.tsv`
   must exactly `diff`-match the set of targets declared in the `Makefile`. A new target with
   no manifest row (or a manifest row for a removed target) fails the check.
2. **Evidence exists** — every manifest row's `evidence` file must exist, and for rows whose
   `coverage` column is `bats`, the target name must appear in that evidence Bats file.

## What to Update

### 1. Coverage manifest (always)

Add a row to `tests/bats/make-target-coverage.tsv`. It is a tab-separated file whose columns,
in order, are `target`, `coverage`, `evidence`, and `details`:

- `target` — the exact target name as declared in the `Makefile`.
- `coverage` — how the target is verified (e.g. `bats`, or a CI workflow reference).
- `evidence` — a repo-relative path that must exist (e.g. `tests/bats/makefile_targets.bats`).
- `details` — a short human note on what the coverage proves.

### 2. Bats shell-out assertion (when adding testable behavior)

If the target has shell behavior worth pinning, add or extend an assertion in
`tests/bats/makefile_targets.bats`, and use the sandbox stubs in `tests/bats/test_helper.bash`
so the real command never runs during the test. For a `bats`-covered manifest row the target
name must appear in the referenced Bats file, so the manifest and the assertion stay linked.

Alternatively, if an existing pull-request workflow already runs the target end to end, point the
manifest `evidence`/`coverage` at that workflow instead of adding a Bats assertion.

## Verification

Run the suite locally before pushing:

```bash
make test-bats
```

For CI-friendly TAP output:

```bash
make test-bats BATS_FORMATTER=tap
```

The `bats` CI check fails if the manifest and the actual `Makefile` targets drift, or if a
`bats`-covered target has no matching evidence.

## Root Cause

The contract exists because the `Makefile` is the source of truth for developer and CI commands,
but nothing else guarantees each target is documented and exercised. The manifest plus the
`issue_78_contract.bats` diff turn "someone forgot to cover the new target" from a silent gap
into a failing check.
