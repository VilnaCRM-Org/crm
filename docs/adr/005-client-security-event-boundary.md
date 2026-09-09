# ADR-005: Client security events leave through the observability boundary, not a second channel

- Status: Approved
- Deciders: [@RudoiDmytro](https://github.com/RudoiDmytro)
- Date: 2026-09-09

**Technical Story**: The single-page application produced no security signal of any kind. Issue
[#159](https://github.com/VilnaCRM-Org/crm/issues/159) asked for client-side detection of
authentication abuse and for a correlation identifier that lets a responder join a browser session
to backend log lines.

## Context and Problem Statement

Credential stuffing against the sign-in form completed without emitting a single client-side
signal. `NoopErrorReporter.report()` was the only `ErrorReporter` bound in the container,
`applyLoginRejection` and `applyRegisterRejection` wrote to UI state and emitted nothing, and no
correlation identifier existed anywhere in the client — every request carried a fresh
`X-Request-Id` and nothing tied those requests to one another. That is OWASP A09:2021, and it also
means an incident responder holding a backend log line has no way to find the browser session that
produced it.

Adding detection is easy; adding it _without_ creating a second, unreviewed egress path for user
data is the actual problem. The repository already has exactly one sanctioned telemetry boundary
(ADR-adjacent work under issue #115): `src/services/observability/`, which owns the Sentry
lifecycle, the DSN gate that makes an unconfigured deployment a verified no-op, the
`piiScrubber` `beforeSend` pass, and the identity policy of "a random opaque session id, never
PII". A security-event channel that bypassed it would bypass all four.

Two further constraints bound the design:

- **The auth page has no paint budget to spare.** Its mobile Lighthouse floor is met only because
  the sign-in path never loads tsyringe or the composition root. Anything the sign-in form can
  reach has to work container-free.
- **A security payload is the worst possible place to leak a credential.** Whatever is emitted on
  a failed login attempt must not be able to carry the password, the token, the email or a user
  id — and "must not" needs to be structural, not a filter someone can forget to apply.

## Decision Drivers

- One telemetry egress path, so the DSN gate, the PII scrubber and the identity policy are applied
  to every signal by construction rather than by discipline.
- The sign-in render path must stay free of tsyringe and of the Sentry SDK.
- Telemetry failure must never break a user flow — a security event is diagnostic, not functional.
- The repository's DI convention (issue #130) requires a class's behavioural collaborators to
  arrive through the container, never through a value import.
- Detection thresholds are a deployment concern, so they belong in the environment rather than in
  a constant.

## Considered Options

1. **A standalone security-event client** — its own transport, its own configuration, emitting
   directly to a monitoring endpoint.
2. **A boundary layered on observability** — security events are modelled as a distinct signal
   type and leave as an error through `observabilityCore.report`.
3. **Inline reporting at the call sites** — each of `AuthStoreActions`, `HttpErrorResponseParser`
   and the error boundaries calls the observability service directly with an ad-hoc payload.

## Decision Outcome

Chosen option: **"A boundary layered on observability"**.

`src/services/security-events/` mirrors the two-layer shape observability established, for the
same reason:

- **Container-free layer.** `securityEventCore` (`export default new SecurityEventCore()`) is a
  module singleton that composes `authFailureMonitor` and `securityEventConfig` and reports
  through `observabilityCore`. The sign-in path reaches it without loading tsyringe.
  `security-event-core.ts` and `auth-failure-monitor.ts` are listed in
  `EXEMPT_RENDER_PATH_FILES` in `config/di-collaborator-policy.js`, which is the carve-out the
  issue-#130 gate provides for exactly this case — neither is `@injectable()`.
- **Container layer.** `SecurityEventReporter` is the `@injectable()` adapter bound to
  `SECURITY_EVENT_TOKENS.SecurityEventReporter`. The core is _also_ registered, by value, under
  `SECURITY_EVENT_TOKENS.SecurityEventCore`, so container-resolved classes —
  `SecurityEventReporter`, `HttpErrorResponseParser` — inject the very instance the render path
  already holds instead of value-importing it. That is what satisfies issue #130 without a second
  copy of the rolling-failure window.

Every signal leaves as a `SecurityEventSignal` error through `observabilityCore.report`, so it
inherits the correlation identifiers, the `piiScrubber` pass and the DSN gate. With
`REACT_APP_SENTRY_DSN` empty the whole path is a verified no-op.

Emitters and their events:

| Call site                                | Event                                 |
| ---------------------------------------- | ------------------------------------- |
| `AuthSecuritySignals` (login)            | `auth_failure` / `auth_failure_burst` |
| `AuthSecuritySignals` (registration)     | `auth_failure` / `auth_failure_burst` |
| `HttpErrorResponseParser` (401 / 403)    | `unauthorized_response`               |
| `AppErrorBoundary` / `AuthErrorReporter` | `error_boundary_catch`                |

**The payload is credential-free by construction.** `reason` is a bounded `AuthFailureReason`
union derived from the `AuthError` kind (or `rate_limited` for HTTP 429), joined by a category, a
severity and the rolling counters. There is no field a password, token, email or user id could
occupy. Aborted attempts — navigation away, a cancelled request — emit nothing, so user-initiated
cancellation is never mistaken for abuse.

**Two correlation identifiers, with different lifetimes.** The per-request `X-Request-Id`
(`correlationIdProvider`) is regenerated per REST request and per Apollo operation and answers
"which call was this". The per-session `X-Correlation-Id` (`sessionCorrelation`) is generated once
at module load and rides **every** outbound REST request, every Apollo operation and every
captured event, and answers "which browser session was this". Both are opaque v4 UUIDs carrying
no user data. `sessionCorrelation` is registered by value under
`OBSERVABILITY_TOKENS.SessionCorrelation` and injected into `HttpRequestConfigBuilder` and
`ApolloLinkFactory`, for the same #130 reason as the security-event core.

**Thresholds are deployment configuration.** `REACT_APP_AUTH_FAILURE_ALERT_THRESHOLD` (default 5)
and `REACT_APP_AUTH_FAILURE_ALERT_WINDOW_MS` (default 60 000) are optional, validated by
`EnvSchema`, and read through `securityEventConfig`. Reaching the threshold inside the window
escalates `auth_failure` to `auth_failure_burst` with `severity: 'critical'` and stamps
`thresholdBreached: true` — that is the event a monitoring backend alerts on.

## Positive Consequences

- One egress path. A new signal type cannot accidentally skip the DSN gate, the PII scrubber or
  the identity policy, because there is nowhere else for it to go.
- The sign-in page still paints without tsyringe and without the Sentry SDK, so the mobile
  Lighthouse floor is unaffected.
- A responder can join a browser session to backend log lines with `X-Correlation-Id`, and a
  single call with `X-Request-Id`, without either identifier carrying user data.
- `AuthRepositoryImpl` catches everything and returns `{ ok: false, error }`, so a rejected
  password never reaches `applyLoginRejection`. Instrumenting `loginSettled` / `registerSettled`
  as well as `loginFailed` / `registerFailed` covers the path that actually runs, not only the
  throw path the issue named.

## Negative Consequences

- Detection is client-side, so it is advisory. An attacker driving the API directly never loads
  the bundle and emits nothing; the burst counter is per browser session and resets on reload.
  This layer raises the cost of naive form-driven abuse and gives responders correlation — it is
  not a rate limiter and must not be mistaken for one. Server-side enforcement remains the control.
- Modelling a security event as an `Error` through `observabilityCore.report` means Sentry groups
  it with application errors. The `event` field distinguishes them, but a dashboard that counts
  raw error volume will see security events in the total.
- Two identifiers on every request is two extra headers on every call, and a backend that logs
  headers verbatim now stores them. Both are opaque, so the exposure is a correlation handle
  rather than user data.
- The rolling window lives in memory in one `AuthFailureMonitor` instance, capped at 1000 tracked
  failures so a sustained burst cannot grow unbounded. That cap is a memory guard, not a policy
  decision — a burst longer than the cap still escalates, it just stops counting precisely.

## Pros and Cons of the Options

### Option 1 — a standalone security-event client

Its own transport and configuration, emitting directly to a monitoring endpoint.

#### Good (Option 1)

- Security signals are separable from application errors in the backend by construction.
- No coupling to the Sentry lifecycle or its DSN gate.

#### Bad (Option 1)

- A second egress path with its own scrubbing, its own identity policy and its own failure mode —
  every guarantee issue #115 established would have to be re-established and re-reviewed.
- The auth paint path would carry a second transport.
- An unconfigured deployment would need its own no-op gate, or it would emit into the void.

### Option 2 — a boundary layered on observability

A distinct signal type that leaves through the existing telemetry boundary.

#### Good (Option 2)

- Inherits the DSN gate, the PII scrubber, the correlation identifiers and the identity policy.
- Reuses the two-layer paint-safe shape already proven for observability.
- One place to review when the egress policy changes.

#### Bad (Option 2)

- Security events are grouped with application errors at the destination.
- Adds a second container-free singleton family that the issue-#130 policy has to carve out by
  explicit path rather than infer.

### Option 3 — inline reporting at the call sites

Each emitter calls the observability service directly with an ad-hoc payload.

#### Good (Option 3)

- No new module; the smallest possible diff.

#### Bad (Option 3)

- The payload shape is re-invented per call site, so "credential-free by construction" becomes
  "credential-free if every author remembers".
- The rolling failure window has nowhere to live, so `auth_failure_burst` could not exist.
- Scatters telemetry calls across feature modules, which the observability boundary exists to
  prevent.

## Links

- [Issue #159: emit client security events](https://github.com/VilnaCRM-Org/crm/issues/159)
- [`SECURITY.md`](../../SECURITY.md) — the backend alert rule that consumes `auth_failure_burst`
- [`config/di-collaborator-policy.js`](../../config/di-collaborator-policy.js) — the issue-#130
  carve-out that lists the container-free render-path singletons
- [ADR-003: Browser support matrix and polyfill strategy](./003-browser-support-matrix.md)
