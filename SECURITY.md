# Security notices relating to this template

Please disclose any security issues or vulnerabilities found through
[GitHub security system](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing/privately-reporting-a-security-vulnerability)
or to the maintainers privately.

## Known vulnerabilities

TBD

## Client security events (issue #159)

The frontend emits structured security signals so authentication abuse and client-side
exploitation attempts are visible to monitoring instead of terminating silently in UI state.
Every signal is produced by `src/services/security-events/` and leaves the process through the
observability boundary (`src/services/observability/`), which means it inherits the correlation
IDs, the PII scrubbing pass, and the DSN gate. With an empty `REACT_APP_SENTRY_DSN` the whole
path is a verified no-op.

### Emitted events

| Event                   | Category                 | Raised by                          |
| ----------------------- | ------------------------ | ---------------------------------- |
| `auth_failure`          | `login` / `registration` | a rejected login or registration   |
| `auth_failure_burst`    | `login` / `registration` | a failure past the threshold       |
| `unauthorized_response` | `transport`              | a `401` or `403` REST response     |
| `error_boundary_catch`  | `render`                 | an error boundary catching a crash |

Each event reaches Sentry as a `SecurityEventSignal` exception named `security.<event>`, with
the structured payload in `extra`:

```json
{
  "event": "auth_failure_burst",
  "category": "login",
  "reason": "authentication",
  "severity": "critical",
  "failureCount": 5,
  "windowMs": 60000,
  "threshold": 5,
  "thresholdCrossed": true,
  "X-Correlation-Id": "5e0e…",
  "X-Request-Id": "9c11…"
}
```

### Credential discipline

The payload is credential-free by construction, not by filtering. `reason` is a bounded code in
every case, but the set it is drawn from depends on the event: `auth_failure` and
`auth_failure_burst` use `authentication`, `validation`, `conflict`, `server`, `network`,
`rate_limited` or `unknown`, derived from the auth error kind or the HTTP status;
`unauthorized_response` uses `http_401` or `http_403`; and `error_boundary_catch` uses the
boundary surface (`app` or `auth`). The submitted password, the session token, the email
address, and the user id are never passed to the reporter. `piiScrubber` remains the
second line of defence in Sentry's `beforeSend`. Aborted attempts (navigation away, cancelled
requests) emit nothing, so user-initiated cancellation is not mistaken for abuse.

### Correlation

A per-session `X-Correlation-Id` is generated once at bootstrap and attached to every outbound
REST request, every Apollo operation, and every captured event. The per-request `X-Request-Id`
continues to identify the individual call. Responders join a client session to backend log lines
through the session id, and a single request through the request id. Both are opaque v4 UUIDs.

### Alert threshold

`AuthFailureMonitor` tracks auth failures in a rolling window:

| Variable                                 | Default | Meaning                                  |
| ---------------------------------------- | ------- | ---------------------------------------- |
| `REACT_APP_AUTH_FAILURE_ALERT_THRESHOLD` | `5`     | failures inside the window that escalate |
| `REACT_APP_AUTH_FAILURE_ALERT_WINDOW_MS` | `60000` | length of the rolling window (ms)        |

Crossing the threshold escalates that one observation to `auth_failure_burst` with
`severity: "critical"`. Only the crossing escalates: later failures inside the same breach stay
`auth_failure`, so a sustained attack raises one critical event per breach rather than one per
request. The window has to drain below the threshold before another crossing can escalate again.
A configured threshold above the 1000-failure tracking cap is clamped to the cap, so a large
value cannot silently make the burst unreachable.
Configure the monitoring backend to alert on it — in Sentry, an issue alert on
`message:"security.auth_failure_burst"` (or on the `severity:critical` tag) notifying the
security channel on the first occurrence in a 5-minute window. The client-side counter is a
per-session signal, not an enforcement control: authoritative rate limiting and lockout stay
server-side.
