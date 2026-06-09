# Bats Suite

Use the Bats suite to validate Makefile shell flows and the `scripts/ci` helpers without running
the full end-to-end stack:

```bash
make test-bats
```

For CI-friendly output:

```bash
make test-bats BATS_FORMATTER=tap
```

When you add or rename a public Make target:

1. Update `tests/bats/make-target-coverage.tsv`.
2. Add or adjust direct Bats coverage for uncovered shell behavior, or point the manifest at the
   pull-request workflow that already executes the target end to end.
