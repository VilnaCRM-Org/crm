# ADR-009: Runtime resilience: request deadlines, bounded retry, offline state, chunk recovery

- Status: Approved
- Deciders: [@RudoiDmytro](https://github.com/RudoiDmytro)
- Date: 2026-09-18

**Technical Story**: ADR-007 gave every failure a recoverable classification and a boundary to
render it, but every recovery was still a human clicking a button. Issue
[#147](https://github.com/VilnaCRM-Org/crm/issues/147) asks for the automatic half — a deadline
on every request, retry with backoff for transient failures, honest offline handling, and a
chunk-load recovery that does not dead-end — and inherits one rule ADR-007 fixed in advance:
never reload a protected route automatically, because the auth token is memory-only.

## Context and Problem Statement

`FetchHttpsClient` issued one `fetch` per call, forwarded the caller's `AbortSignal`, and
nothing else. A backend that accepted the connection and never answered held the submit
spinner forever; the only deadline in the system was the browser's own socket timeout. The
`retryable` flag that `ErrorHandler` and `AuthErrorFactory` compute was consumed by exactly one
thing, the registration view's manual **Retry** button. `navigator.onLine` was read nowhere, so a
form submitted from an offline laptop failed the same way a dead backend does and told the user
the same thing. And a lazy page chunk that failed to load — the ordinary aftermath of a deploy
that rotated hashed asset names under an open tab — reached `RouteError` with the `reload`
strategy and stopped there, waiting for the user to press **Reload the page**.

Three constraints shape the answer. The auth paint path stays container-free
(`tests/unit/tooling/paint-path-graph.test.ts`, `no-paint-path-import-di-bridge`), so whatever the
forms read to know they are offline cannot resolve anything from tsyringe. `AbortSignal.any` is
outside the Baseline 2023 floor ([ADR-003](./003-browser-support-matrix.md)) and `compat/compat`
cannot see it, so signal composition has to be done by hand. And both auth submissions are
`POST /api/users` — the login and the registration alike are creates from the transport's point
of view — so "retry whatever is `retryable`" would, on a lost response, register the same user
twice.

## Decision Drivers

- A stalled request must fail in bounded time, and a retried request must not multiply that
  bound: the whole attempt sequence lives inside one budget.
- A retry must never repeat a non-idempotent create. The policy has to be safe by default and
  explicit where a POST is known to be idempotent.
- Offline is a state the user can see and act on, not an error the request produces. It must be
  announced by assistive technology and must not paint anything while online, or every recorded
  visual baseline changes.
- A chunk that is missing after a deploy is recovered without the user noticing on a public
  page, and without ever signing the user out on a protected one.
- Repository conventions: class-only non-React `.ts` with approved suffixes (issue #129), the
  #130 collaborator gate (`config/di-collaborator-policy.js`), `src/lib/**` for container-free
  logic, `*Var` + `useReactiveVar` for client state ([ADR-008](./008-frontend-state-architecture.md)),
  and `no-await-in-loop` at `error`.

## Considered Options

1. **`AbortSignal.timeout` / `AbortSignal.any`** for the deadline, composed at the call site.
2. **A hand-composed `RequestDeadline`** — one `AbortController`, a timer, and a forwarded caller
   abort — created by a factory the client injects.
3. **Retry every `retryable` error** at the repository layer, driven by the existing flag.
4. **Retry inside the HTTP client, idempotent methods by default, explicit opt-in otherwise**, and
   no automatic retry for GraphQL mutations at all.
5. **Retry the GraphQL mutation too**, relying on `clientMutationId` for idempotency.
6. **Offline as a request error** (map the failed fetch to an "offline" message).
7. **Offline as client state** — a container-free reactive var fed by the browser's events, read
   by the forms, which disable their submit and show a notice.
8. **Auto-reload every failed chunk** versus **retry once, then reload public routes only**.

## Decision Outcome

Chosen: **options 2, 4, 7, and "retry once, then reload public routes only".**

**The deadline.** `src/lib/reliability/request-deadline.ts` (`RequestDeadline`, the new
`*Deadline` suffix — "time-bounded abort scope of one request", the gRPC / Go context idiom)
owns an `AbortController`, arms a timer for `timeoutMs`, and forwards the caller's abort into the
same signal. `timedOut` is the deadline's own state, never an exception name: a body read that
the timer cuts short and a caller abort both surface as `AbortError` from `fetch`, and only the
flag tells them apart. A caller abort stops the timer, so the deadline can never be reported as
expired afterwards; `release()` clears the timer and nothing else, so an abort that arrives
while the body is still streaming still cancels it. `RequestDeadlineFactory` carries the default
(`REACT_APP_REQUEST_TIMEOUT_MS`, 10 000 ms when unset, validated by `EnvSchema`) and is
registered by value under `HTTP_TOKENS.RequestDeadlineFactory`. `FetchHttpsClient` runs every
attempt under one, releasing in `finally` after the response is processed, and classifies the
failure in a fixed order: an `HttpError` the response processor already produced wins (a 4xx
whose body read outlived the deadline is still that 4xx, not a retryable timeout), then an
`AbortError` raised by the expired deadline becomes
`HttpError({ status: 0, message: 'Request timed out' })` — which the existing factories already
classify as the retryable network error — a caller abort passes through untouched, and any other
transport failure is the network error. `HttpResponseProcessor` rethrows an `AbortError` from a
body read instead of swallowing it, so a 200 whose body was cut short by the deadline surfaces
as the timeout rather than as a malformed body. `DeadlineFetchAdapter` gives Apollo's `HttpLink`
a `fetch` bounded from the first byte to the last: the headers are awaited under the deadline,
and the body is re-streamed through it — released once the last chunk is read or the consumer
cancels, and turned into the same timeout when the expired deadline cuts a read short — so a
peer that answers the headers and then stalls cannot hang the GraphQL consumer either.

**The retry.** `src/services/resilience/` is a new infra area with its own `tokens.ts` and
`di.ts`. `TransientErrorDetector` names the retryable statuses — `0`, `408`, `500`, `502`, `503`,
`504` — and refuses an `AbortError` and a `429` (a cooldown is not a fault).
`ExponentialBackoffStrategy` waits `250 · 2^(n−1)` ms capped at 2 s with equal jitter.
`RequestRetryService.execute(operation, { budgetMs, signal })` runs up to three attempts
recursively (no `await` in a loop), hands each attempt the budget that is left, gives up when the
next wait would leave under 250 ms, turns a caller abort during the wait into an `AbortError` at
once, and detaches its abort listener when the wait ends so a long-lived signal retains nothing.
`FetchHttpsClient` retries `GET`, `PUT` and `DELETE` by default and a `POST`/`PATCH` only with
`RequestConfig.retry: true`; `LoginAPI` opts in, because issuing a token creates nothing.
`RegistrationAPI` gets the deadline and no retry: API Platform only echoes `clientMutationId`,
so a second `createUser` after a lost response is a second user or a conflict. Its **Retry**
button stays the user's decision.

**Offline.** `ConnectivityStateVar` (`src/lib/connectivity/`) is a `*Var` over the ADR-008
primitive; `BrowserConnectivityAdapter.attach(window)` in `src/index.tsx` seeds it from
`navigator.onLine` and follows the `online` / `offline` events; `useConnectivity()` is the hook.
`UIForm` reads it, disables the submit while offline, and mounts `UIOfflineNotice` after the
heading and inside the `<form>` — the registration overlay is `position: absolute; inset: 0`
over the form, and the `<h1>` lives inside it, so nothing outside the form is guaranteed to stay
visible. The notice is an always-mounted `role="status"` region whose text toggles: a region
created and filled in one commit is dropped by most screen readers, a text change in an
existing one is announced. It shows the offline copy while offline, "connection restored" for
five seconds after an observed reconnection, and nothing otherwise, so an online form renders
exactly what it rendered before and the visual baselines stand. No Figma surface exists for
this notice; it is built from the palette tokens (`background.subtle`, `border.default`, the
`#1B2327` text ink) and is flagged for design review rather than invented as a component.

**Chunk recovery.** `ChunkRetryLoader` (`src/lib/reliability/`) memoizes one dynamic `import()`,
forgets a failed one, and absorbs exactly one failure that `ChunkLoadErrorDetector` recognises
by importing again; any other error and a second chunk failure reach the caller. It replaces
the auth feature's `LazyModuleLoader` for the registration notification and wraps
`DeferredAuthActions.load()`, so the DI graph — a lazy chunk like any page — is retried before
the user sees the load-failure error. `ReloadingChunkLoader` adds the last resort for **public
routes only**: when the retry also fails it asks `ReloadOnceGuard` — a per-key flag in
`sessionStorage`, refusing when storage is unavailable — and, if allowed, calls
`pageReloadNavigator.reload()` and leaves React suspended on the fallback while the document is
replaced. A second miss in the same session, and every miss on a protected route, is rethrown to
the route's `errorElement`, whose `reload` strategy offers **Reload the page** as a button.
`RouteMapper` chooses the loader from `route.guard`; a successful load resets the flag so the
next deploy may reload again.

## Positive Consequences

- Every REST request and GraphQL operation now fails within `REACT_APP_REQUEST_TIMEOUT_MS`, and a
  retried request spends at most that same budget across all attempts and waits — a stalled
  backend costs one timeout, not three plus backoff.
- Transient login failures (a dropped connection, a 5xx) recover without the user seeing an
  error; a permanent failure (`401`, `404`, `429`) still surfaces on the first answer.
- No automatic retry can create a duplicate: the default policy is idempotent methods only, the
  opt-in is per request and reviewed, and the GraphQL create has none.
- An offline user is told so, in the form, before they submit, and the submit cannot fire.
- A stale-deploy chunk failure on `/sign-in`, `/sign-up` or the catch-all route heals with one
  reload the user does not have to ask for; on a protected route it never signs the user out.
- The paint path is unchanged: `src/lib/connectivity/**` and the loaders import nothing from the
  container, and `tests/unit/tooling/paint-path-graph.test.ts` still passes.

## Negative Consequences

- A retried login can take up to one full budget to fail; the busy state covers it, but a user
  on a dead backend waits ~10 s before the banner instead of ~1 s.
- `navigator.onLine` is a lower bound on connectivity: `true` means "has an interface", not
  "can reach the API". A captive portal is online by this measure and fails as a request error.
- Retries are not reported anywhere: only the final failure reaches the observability boundary,
  so a backend that succeeds on the third attempt every time is invisible in telemetry.
- The reload-once flag is per browsing session and per route key; a deploy that rotates chunks
  twice inside one session shows the manual fallback the second time.
- The bounded GraphQL body is a re-streamed `Response`: `status`, `statusText` and `headers`
  are carried over, but `url`, `redirected` and `type` are not, which Apollo's `HttpLink` does
  not read.
- `ReloadOnceGuard` fails closed without `sessionStorage`, so a browser that blocks storage gets
  the manual fallback on the first miss.

## Pros and Cons of the Options

### Option 1 — `AbortSignal.timeout` / `AbortSignal.any`

Compose the deadline from the platform primitives at each call site.

#### Good (Option 1)

- No code to own; the browser cancels the request and the body read alike.

#### Bad (Option 1)

- `AbortSignal.any` sits above the Baseline 2023 floor, `compat/compat` does not model it, and
  detecting a timeout means inspecting `error.name`, which a caller abort shares.

### Option 2 — a hand-composed `RequestDeadline`

One controller, one timer, a forwarded caller abort, and a `timedOut` flag the client reads.

#### Good (Option 2)

- Runs on every supported browser; the timeout is the deadline's own state; one class, one
  factory, one token, fully testable with fake timers.

#### Bad (Option 2)

- A few dozen lines the platform would eventually provide, and a new naming suffix.

### Option 3 — retry every `retryable` error at the repository layer

Let `AuthRepositoryImpl` loop on `retryable === true`.

#### Good (Option 3)

- Reuses the flag the error factories already compute.

#### Bad (Option 3)

- The flag is a display concern ("may the user try again"), not a transport guarantee; it would
  retry the registration create and cannot see the remaining deadline.

### Option 4 — retry in the HTTP client, idempotent by default, opt-in otherwise

`FetchHttpsClient` decides from the method and `RequestConfig.retry`, inside one budget.

#### Good (Option 4)

- Safe by construction; the opt-in is one reviewed line; every REST consumer inherits it.

#### Bad (Option 4)

- A caller has to know its POST is idempotent to opt in; GraphQL gets no retry at all.

### Option 5 — retry the GraphQL mutation with `clientMutationId`

Treat the Relay-style id as an idempotency key and retry `createUser`.

#### Good (Option 5)

- Registration would recover from a dropped response like login does.

#### Bad (Option 5)

- API Platform echoes `clientMutationId`; it does not deduplicate on it. A retry after a lost
  response creates a second user or returns a conflict the user did not cause.

### Option 6 — offline as a request error

Map a failed fetch to an "offline" message when `navigator.onLine` is false.

#### Good (Option 6)

- No new state, no UI while online.

#### Bad (Option 6)

- The user learns they are offline only after submitting; the submit still fires; the message
  lands in the error banner, which steals focus for a condition the user did not cause.

### Option 7 — offline as client state

A `*Var` fed by the browser events, read by the forms.

#### Good (Option 7)

- Told before submitting, submit disabled, announced through a live region; the pattern ADR-008
  prescribes; container-free.

#### Bad (Option 7)

- One more region in the form; `navigator.onLine` is a lower bound.

### Option 8 — reload every failed chunk

Reload the document whenever a chunk fails, on every route.

#### Good (Option 8)

- Simplest recovery; every stale deploy heals itself.

#### Bad (Option 8)

- Signs the user out on a protected route (memory-only token) and discards the registration
  result; a chunk that is still missing after the reload loops forever without a guard.

## Links

- [Issue #147: runtime resilience](https://github.com/VilnaCRM-Org/crm/issues/147)
- [ADR-007: Reliability model](./007-reliability-model.md) — the recoverable-error contract, the
  `reload` strategy the route boundary renders, and the never-reload-a-protected-route rule
- [ADR-008: Frontend state architecture](./008-frontend-state-architecture.md) — the reactive var
  the connectivity state is built on
- [ADR-003: Browser support matrix](./003-browser-support-matrix.md) — why `AbortSignal.any` is
  not used
- [`config/di-collaborator-policy.js`](../../config/di-collaborator-policy.js) — the render-path
  carve-out the registration-notification loader keeps
