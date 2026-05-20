# Load Test Configuration

## Makefile Variables

Use existing variables instead of hardcoding script paths:

```bash
K6_TEST_SCRIPT=/loadTests/homepage.js make test-load
K6_RESULTS_FILE=/loadTests/results/homepage.html make test-load
```

Signup scenarios use:

```bash
K6_SIGNUP_SCRIPT=/loadTests/signup.js make test-load-signup
```

## Result Location

Store HTML output in:

```text
tests/load/results/
```

The Makefile creates this directory before running K6.
