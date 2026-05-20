---
name: load-testing
description: Use when creating, running, or debugging K6 load tests for frontend flows.
---

# Load Testing

## Commands

```bash
make test-load
make test-load-signup
```

Both targets start the production service, wait for health, prepare result
directories, and run K6 through Docker Compose.

## Scenario Rules

- Keep scripts deterministic enough to compare runs.
- Use realistic user journeys, not isolated implementation details.
- Clean or isolate generated test data when a scenario creates accounts.
- Store result artifacts under `tests/load/results/`.
- Prefer smoke or focused signup scenarios before heavier load.

## Configuration

Use the existing K6 variables in the Makefile:

- `K6_TEST_SCRIPT`
- `K6_RESULTS_FILE`
- `K6_SIGNUP_SCRIPT`
- `K6_SIGNUP_RESULTS_FILE`

## Verification

Run the smallest scenario that exercises the changed flow, then inspect the K6
summary and generated HTML result.

## Supporting Files

- [examples/homepage-flow.js](examples/homepage-flow.js): minimal page-load K6
  example.
- [examples/signup-flow.js](examples/signup-flow.js): signup page flow example.
- [reference/configuration.md](reference/configuration.md): Makefile variables
  and result paths.
- [reference/troubleshooting.md](reference/troubleshooting.md): health, output,
  and failure-rate troubleshooting.
