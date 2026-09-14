# Load Test Usage Guide

## Quick Start

### Run All Signup Tests

```bash
make test-load-signup
```

This command runs all four signup test suites in sequence:

1. ✅ **Positive tests** (`positive.js`) - Normal registration flow
2. 🛡️ **Negative tests** (`negative.js`) - Validation & security
3. ⏱️ **Rate limit tests** (`ratelimit.js`) - Abuse protection
4. 🔗 **Integration tests** (`integration.js`) - End-to-end flows

## Scenario Selection

Use the single `test-load-signup` Make target and select scenarios with environment variables.
The Makefile target reads these env vars before invoking k6:

- `run_smoke=true`
- `run_average=true`
- `run_stress=true`
- `run_spike=true`
- `run_ratelimit=true`

Example:

```bash
run_smoke=true run_average=false run_stress=false run_spike=false make test-load-signup
```

## Test Results

Results are saved as a single HTML report in `tests/load/results/signup.html`.

View results by opening the HTML files in a browser:

```bash
open tests/load/results/signup.html
```

## Environment Variables

Control which scenarios run using environment variables:

```bash
# Run only smoke tests
run_smoke=true make test-load-signup

# Run only average load tests
run_average=true make test-load-signup

# Run only stress tests
run_stress=true make test-load-signup

# Run only spike tests
run_spike=true make test-load-signup

# Run multiple scenarios
run_smoke=true run_average=true run_ratelimit=true make test-load-signup
```

If no environment variables are set, all scenarios run.

## Test Output

Each test suite provides:

- ✅ Success indicators with emojis
- 📊 Detailed performance metrics (avg, min, med, max, p95, p99)
- 📈 Real-time web dashboard
- 📄 HTML summary report

Example output:

```bash
🧪 Running signup positive tests...
✅ Positive tests completed!

🧪 Running signup negative tests...
✅ Negative tests completed!

🧪 Running signup rate limit tests...
✅ Rate limit tests completed!

🎉 All signup load tests completed successfully!
```

## Configuration

Tests use configuration from `tests/load/config.json` or `tests/load/config.json.dist`.

The signup endpoint can have custom host/port settings:

```bash
{
  "endpoints": {
    "signup": {
      "host": "mockoon",
      "port": "8080",
      "setupTimeoutInMinutes": 10,
      "smoke": {},
      "average": {}
    }
  }
}
```

> **Note:** The default `host: "mockoon"` points to the mock server used in CI.
> Replace `endpoints.signup.host` (and `port`) with your real backend hostname
> (e.g., `"localhost"` for local testing or your production hostname) when you
> want load tests to target the actual service instead of the mock.

## Performance Thresholds (issue #148)

Every budget in `config.json.dist` and in the fallback tables of
`utils/thresholds-builder.js` is derived from a measured baseline, not from a worst case the
CI runner might one day produce. The gate the `load testing` workflow enforces is
`http_req_duration{scenario:X}: p(99) < threshold`, plus a failure-rate ceiling and a
check-pass-rate floor per scenario.

### Measured baseline

Five consecutive green `load testing` runs on `ubuntu-latest` (2026-09-10 → 2026-09-13,
runs 34497185012, 34602625713, 34607556757, 34611954209, 34757289572), each against the local
`prod` (`serve`) container and the Mockoon fixture, ~6 200 homepage and ~155 signup
iterations per run. `p(99)` is the per-scenario value k6 printed for the threshold;
`max` is the highest single request k6 reported for the suite.

| Endpoint | Scenario | p(99) range | Failures | Checks | Highest `max` seen |
| -------- | -------- | ----------- | -------- | ------ | ------------------ |
| homepage | smoke    | 2.1–2.7 ms  | 0.00 %   | 100 %  | < 60 ms            |
| homepage | average  | 2.2–2.7 ms  | 0.00 %   | 100 %  | < 60 ms            |
| homepage | stress   | 2.0–2.4 ms  | 0.00 %   | 100 %  | < 60 ms            |
| homepage | spike    | 1.8–2.4 ms  | 0.00 %   | 100 %  | < 60 ms            |
| signup   | smoke    | 4.9–9.4 ms  | 0.00 %   | 100 %  | 50 ms              |
| signup   | average  | 8.9–12.5 ms | 0.00 %   | 100 %  | 50 ms              |
| signup   | stress   | 5.3–14.8 ms | 0.00 %   | 100 %  | 50 ms              |
| signup   | spike    | 7.0–20.2 ms | 0.00 %   | 100 %  | 50 ms              |

### Budgets and their rationale

| Endpoint | Scenario | p(99) budget | Failures | Checks | Why                              |
| -------- | -------- | ------------ | -------- | ------ | -------------------------------- |
| homepage | smoke    | 1 000 ms     | 0 %      | 99 %   | gate: static-page SLO, 400× base |
| homepage | average  | 1 500 ms     | 1 %      | 99 %   | gate: 15 rps sustained, 550×     |
| homepage | stress   | 3 000 ms     | 5 %      | 95 %   | capacity: 75 rps, 1 200×         |
| homepage | spike    | 5 000 ms     | 10 %     | 90 %   | capacity: 0→150 rps ramp, 2 000× |
| signup   | smoke    | 1 500 ms     | 0 %      | 99 %   | gate: 3 rps, 160×                |
| signup   | average  | 2 000 ms     | 0 %      | 99 %   | gate: 10 rps, 160×               |
| signup   | stress   | 4 000 ms     | 2 %      | 95 %   | capacity: 50 rps, 270×           |
| signup   | spike    | 6 000 ms     | 5 %      | 90 %   | capacity: 0→100 rps ramp, 300×   |

The two tiers are deliberate:

- **Gate scenarios (smoke, average)** run at low, stable virtual-user counts and are what a
  regression must fail. Their latency budgets are the user-facing SLO for a cached static
  page or a single API call — low seconds, not the 15–44 s a shared runner might survive —
  and their failure ceiling is zero (homepage smoke, signup smoke and average) or one percent
  (homepage average). The baseline is 0.00 % across every run; a failed request here is a
  defect, not noise. The check floor is 99 % rather than 100 % because a scenario runs a few
  hundred checks and one transient connection reset on a shared runner must not fail an
  unrelated pull request; two would.
- **Capacity scenarios (stress, spike)** still gate — the same workflow fails on them — but
  with budgets that measure capacity rather than latency: hundreds of times the baseline,
  a failure ceiling that tolerates transient connection resets under a 75–150 rps burst on a
  shared runner (2–10 %), and a 90–95 % check floor. They exist to catch a regression that
  only shows under load (an event-loop stall, a connection leak), not to assert an SLO the
  runner cannot promise.

The signup endpoint's negative tests send deliberately invalid payloads; the mock answers
them with the expected status codes and `checkResponse` asserts on those, so the measured
failure rate is 0.00 % and the old 15–30 % tolerance had no basis. Any new tolerance needs a
measured reason recorded in this table.

Every value here is guarded by the gate ratchet (`config/gate-thresholds.manifest.json`):
raising a latency budget, raising a failure ceiling, or lowering a check floor is a relaxation
that the `gate ratchet` check surfaces for review. Tighten by editing `config.json.dist`
(per-endpoint values) or the fallback tables in `utils/thresholds-builder.js` (every endpoint
that does not override them), and update this table in the same change.

### Targeting a deployed environment

The suite reads two environment variables, passed through the k6 compose service:

- `LOAD_TARGET_URL` — the SPA origin, used by every endpoint that inherits the top-level
  `host` of the config (today: `homepage`).
- `LOAD_TARGET_URL_SIGNUP` — the API origin for the `signup` endpoint. An endpoint that
  declares its own `host` in the config is a different service, so it is never repointed by
  the generic variable; it needs its own `LOAD_TARGET_URL_<ENDPOINT>`.

```bash
LOAD_TARGET_URL=https://staging.vilnacrm.example make test-load
LOAD_TARGET_URL_SIGNUP=https://api-staging.vilnacrm.example make test-load-signup
```

Values must be an absolute `http(s)` origin with an optional path prefix — no credentials, query
string, fragment, or whitespace (a trailing slash is stripped); anything else aborts the run
before the first request. Plain `http://` is accepted only for `localhost`, `127.x` and
single-label container hosts (`prod`, `mockoon`): the signup flow posts generated credentials, so
a remote target must be `https://` or the run aborts. The Makefile targets stay the entry points
and still boot the local `prod` and Mockoon containers (the k6 service depends on a healthy
`prod`), so a remote run costs one local build. Budgets were measured against the local stack: a deployed
origin adds real network latency, so treat a first remote run as a baseline to record here
before tightening anything for that environment. Wiring the remote mode into the sandbox
delivery flow belongs to the CD pipeline work in issue #139.

## Prerequisites

- Docker and Docker Compose installed
- Production environment running (automatically started by make commands)
- K6 load testing tool (runs via Docker)

## Troubleshooting

### Tests don't start

Ensure production service is healthy:

```bash
make start-prod
make wait-for-prod-health
```

### Results directory missing

Create it manually:

```bash
mkdir -p tests/load/results
```

### Rate limiting not detected

Check warnings in test output. You may need to:

- Implement or adjust rate limiting in your API
- Configure appropriate thresholds
- Check whether the application under test has rate limiting enabled

## CI/CD Integration

Run in CI pipelines:

```bash
# GitHub Actions example
- name: Run signup load tests
  run: make test-load-signup
```

## Next Steps

After running tests, review:

1. HTML reports for detailed metrics
2. Console warnings for missing protections
3. Error rates and response times
4. Rate-limiting effectiveness

For more information, see `README-IMPROVEMENTS.md`.
