# Load Test Configuration

## Path Convention

K6 runs inside a Docker container where the host directory `tests/load/`
is mounted as `/loadTests/`. The Makefile variables expect the
**container** path (the `/loadTests/...` form). The HTML output written
to `/loadTests/results/` lands on the host at `tests/load/results/`.

| Where you set it | Path form      | Example                            |
| ---------------- | -------------- | ---------------------------------- |
| Makefile / env   | container path | `/loadTests/homepage.js`           |
| Reading results  | host path      | `tests/load/results/homepage.html` |

## Makefile Variables

Override the defaults (defined in `Makefile`) with container paths:

```bash
K6_TEST_SCRIPT=/loadTests/homepage.js make test-load
K6_RESULTS_FILE=/loadTests/results/homepage.html make test-load
```

Signup scenarios use:

```bash
K6_SIGNUP_SCRIPT=/loadTests/signup.js make test-load-signup
```

## Result Location

After a run, open the HTML on the host:

```text
tests/load/results/
```

The Makefile creates this directory before running K6.
