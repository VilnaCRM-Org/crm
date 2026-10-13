---
status: complete
workflowType: product-brief
stepsCompleted: [1, 2, 3, 4, 5, 6]
project_name: crm
date: 2026-10-05
revised: 2026-10-08
feature: create-new-password
issue: https://github.com/VilnaCRM-Org/crm/issues/315
author: 'analyst (Mary), autonomous run'
inputDocuments:
  - specs/create-new-password/planning-artifacts/run-summary-create-new-password-2026-10-05.md
  - specs/create-new-password/planning-artifacts/research-create-new-password-2026-10-05.md
---

# Product Brief: password recovery for the `user` module (create new password)

Predecessors: [run summary](./run-summary-create-new-password-2026-10-05.md) (task framing,
Miro, Figma and contract evidence) and
[research](./research-create-new-password-2026-10-05.md) (current state, contract analysis,
design gaps, gate constraints). Every figure below comes from those two documents. Decisions this
stage fixed on its own are marked `> Assumption:`; the PRD and architecture stages may overturn
them with a recorded reason.

## 1. Executive Summary

A VilnaCRM user who forgets the password has no way back in. The sign-in card already carries a
"Забули пароль?" link, hidden behind the `forgotPassword` runtime flag, pointing at a route that
nothing renders. This brief defines the flow that closes that gap, as the Miro component diagram
splits it:

- **Reset Password** — the user enters an e-mail and is told, in every case, to check the inbox.
- **Create new password** — the user opens the e-mailed link, sets and confirms a new password,
  and is sent to sign-in with a one-time success notice.

The flow ships behind the existing flag. Its shipped default stays off, so production users never
reach a flow the deployed user-service cannot serve; the test stack turns it on once both
routes exist and are covered by the browser suites. It talks to user-service over GraphQL only —
the `requestPasswordResetUser` and `confirmPasswordResetUser` mutations of the user graph — never
retries automatically, never reveals whether an e-mail is registered, and keeps the reset token
out of the address bar, history and telemetry.

The mutations exist on user-service `main` only (PR #215, commit `63041e4a`); the newest tag,
v2.8.0, which crm pins, has neither. The feature is therefore built and working now against
mocked GraphQL: one pending schema extension, copied verbatim from user-service `main`, gives
codegen and the local Apollo mock both mutations until the pin moves to a release that declares
them. Two upstream changes remain, and neither blocks implementation: a
user-service release tag carrying both mutations, which the later pin bump and the production
enablement of the flag wait for, and an e-mail link on the SPA host, which real e-mails need to
reach the app.

> Assumption: mocked GraphQL until user-service releases is the user's decision of 2026-10-05
> ("We will mock it to work in the front end as the user service is not released"). It replaces
> the earlier plan of a prerequisite pin bump before any story; the pin bump becomes a follow-up.
>
> Assumption: GraphQL is the only transport for both operations. This is the user's decision of
> 2026-10-05 and overrides the research's REST recommendation (research §3.3); the REST endpoints,
> a REST façade over `HttpsClient` and hand-typed REST schemas are not used anywhere.

## 2. Core Vision

### Problem Statement

Account recovery is a baseline expectation of any authenticated product. Today a user who cannot
sign in has no self-service path: the link is hidden, the route is unregistered, and the only
alternative is a support request that an operator cannot fulfil from the UI either. The cost is
lost users at the moment they most want to come back, support load for a task the backend can
already perform, and an inert flag plus an allowlisted route key that advertise unfinished work
in the contract tests, the route-coverage manifest and the feature-flag docs.

### Why Existing Pieces Fall Short

The sign-in link, the route key, the flag and the backend mutations exist; nothing joins them. The
pinned user-service contract (v2.8.0) predates the reset mutations, so without a pending schema
extension codegen cannot type an operation document for them and the local Apollo mock cannot
answer them, and the e-mail the backend sends links to the API host rather than the app.

### Proposed Solution

Two public screens inside the existing auth experience — same page chrome, card, fields and
submit button as sign-in — one for requesting the link and one for setting the new password.
Uniform "check your e-mail" outcome, user-initiated retry only, redirect to sign-in on success.
Both screens are lazy chunks, so the auth paint path pays nothing for them.

## 3. Target Users and Jobs to Be Done

| User                 | Job to be done                                                   |
| -------------------- | ---------------------------------------------------------------- |
| Locked-out CRM user  | Regain access from the sign-in page without contacting anyone    |
| Mobile user          | Complete the same flow by touch, with the e-mail app in between  |
| Support / operations | Point a user at a self-service path instead of resetting by hand |
| Deployment admin     | Enable the flow per environment with one runtime flag            |
| Design owner         | Review two screens built from the existing design language       |
| Contributor          | Land the feature without weakening a single repository gate      |

### User Journey

1. On `/sign-in` the user taps "Забули пароль?" and lands on `/password-recovery`.
2. Enters the e-mail, submits, and reads "check your e-mail" with the address masked.
3. Opens the inbox, follows the link, lands on `/password-reset`.
4. Enters and confirms a new password, submits.
5. Arrives on `/sign-in` with a success notice and signs in with the new password.

## 4. The Two-Component Flow

The numbers are the edge labels on the Miro User/Auth component diagram (widget
`3458764570351764591`); the Create new password element is widget `3458764570351803371`.

### Reset Password component (`/password-recovery`)

| Step | What happens                                                         | Edge |
| ---- | -------------------------------------------------------------------- | ---- |
| R1   | Request form: heading, e-mail field, "Підтвердити" (Figma `72:5596`) | —    |
| R2   | Submit sends the reset request to the API                            | 1    |
| R3   | Sent step: "check your e-mail" + masked address (Figma `360:11925`)  | —    |
| R4   | "К входу" → `/sign-in`; "Назад" → request form (resend path)         | —    |

> Assumption: `/password-recovery` stays the request-plus-sent route and `/password-reset` is
> added for the token link, matching the path user-service already builds into the e-mail so the
> upstream fix only has to change the host (main-agent decision; research §8.2).

### Create new password component (`/password-reset`)

| Step | What happens                                                        | Edge |
| ---- | ------------------------------------------------------------------- | ---- |
| C1   | Link opens `/password-reset?token=…`; token to memory, URL stripped | —    |
| C2   | New + confirm password fields, "Підтвердити"; submit confirms       | 2    |
| C3   | Success redirects to `/sign-in` with a one-time success notice      | 3    |
| C4   | Invalid or expired link: one action, request a new link             | —    |

> Assumption: the success notice travels to `/sign-in` in router navigation state, the way the
> existing arrival-focus marker does, not in a new store (main-agent decision; research Q4).

### Outcomes the user can see

| GraphQL answer                     | Request step                 | Confirm step                 |
| ---------------------------------- | ---------------------------- | ---------------------------- |
| Mutation resolved                  | Sent step, any address       | Redirect to sign-in + notice |
| Input violation (field)            | Field error on e-mail        | Field error on new password  |
| Domain refusal (message-only)      | Banner: per-address limit    | Invalid-link view            |
| Rate limited (HTTP `429`)          | Banner, form stays, no retry | Banner, form stays, no retry |
| No response, timeout, server error | Banner with Retry button     | Banner with Retry button     |

User-service answers the request mutation identically for known and unknown addresses (its
resolver returns no user and its handler takes one constant-time path), so the REST `404` that
used to need folding does not exist on this transport. A domain refusal is a GraphQL error that
carries only a translated message; on the request step the only one user-service raises is the
per-address rate limit, on the confirm step every one is a token rejection (unknown, expired,
used or mismatched).

> Assumption: scope is the whole recovery flow as the user experiences it, mapped to the two Miro
> components above. The authenticated change-password form under User settings is a different
> flow and is out of scope (main-agent decision on the research's §2 mapping).

## 5. Goals and Success Metrics

### Goals

1. The whole flow works today in the test stack against the mocked mutations, and a
   user recovers access end to end in production once user-service tags the mutations, the tag
   is deployed and the link is fixed.
2. The flow leaks nothing: no account enumeration, no token in URL, history or telemetry.
3. Both screens meet the accessibility, performance and quality floors the repository enforces.
4. The `forgotPassword` flag ships off, is on in the test stack, is enabled in
   production by configuration once its user-service serves the mutations, and is scheduled for
   deletion per the documented lifecycle.

### Success Metrics

| Metric                                    | Target            | Measured by              |
| ----------------------------------------- | ----------------- | ------------------------ |
| Reset completion (confirmed / requested)  | ≥ 60% in month 1  | user-service logs        |
| Request outcome, known vs unknown address | identical         | e2e asserts same DOM     |
| Token in URL after landing                | 0 occurrences     | e2e on `/password-reset` |
| Token in captured telemetry               | 0 occurrences     | scrubber unit test       |
| axe violations (WCAG 2.1 AA), both routes | 0 in 3 engines    | `make test-a11y`         |
| Keyboard-only completion of both forms    | pass              | keyboard contract spec   |
| Mobile Lighthouse performance, `/sign-in` | ≥ 0.84, unchanged | `make lighthouse-mobile` |
| Eager entrypoint growth                   | 0 bytes           | bundle-size PR report    |
| Coverage, mutation score, i18n parity     | 100 / 100 / clean | existing CI gates        |
| Manifest rows for both route keys         | e2e + visual rows | route-coverage gate      |

> Assumption: the frontend ships no product analytics, so the completion rate is a backend
> metric owned by user-service. The 60% target is a starting hypothesis for the product
> owner to confirm.

## 6. Scope

### In scope (v1)

- Request screen and sent step on `/password-recovery` (desktop, tablet, mobile readings of
  Figma `72:5596` / `72:5617` / `72:5638` and `360:11925` / `360:11937` / `360:11949`).
- New-password screen with confirm field and invalid-link view on `/password-reset`.
- GraphQL transport for both operations through the existing Apollo client the DI container
  builds; no automatic retry; a user-initiated Retry on transient failures; a rate limit shown
  as a banner.
- New-password policy never weaker than the API: 8–64 characters, at least one digit and one
  ASCII uppercase letter (the existing lowercase rule stays).
- Masked e-mail on the sent step; uniform outcome for known and unknown addresses.
- Token read once from the query string, held in memory, stripped from the URL; a telemetry
  scrubber rule for `token=` strings.
- Success notice on `/sign-in` via navigation state; focus moves to the new heading on every
  step change; all controls keyboard-operable with ≥ 24 px targets.
- `uk` (main) and `en` (fallback) copy for every string, written by us from the Russian Figma
  text; merged catalog regenerated.
- Unit, integration, e2e (`page.route('**/graphql')` mocks keyed on the operation name), a11y,
  mobile-touch and visual lanes for both routes; manifest rows replacing the `passwordRecovery`
  allowlist entry.
- A pending schema extension holding both mutations, copied verbatim from user-service `main`,
  read by codegen and by a stateless local Apollo mock.
- `forgotPassword` on in the test stack no earlier than the route registration, after
  both routes are registered, in its own release story; the shipped default stays `false`. An
  ADR recording the GraphQL transport, the pending extension, uniform response, token handling
  and retry policy.

> Assumption: the password policy for sign-up is not changed here. Registration hits the same
> user-service rules, so the recommendation to the PRD and architecture stages is one shared
> password policy for both forms; whether sign-up adopts it is their decision (research Q3).

### Out of scope (v1)

- The authenticated change-password form under User settings (Figma `313:10242`).
- The mobile resend row with countdown ("Надіслати код ще раз 00:34", Figma `72:5638`) —
  follow-up; "Назад" on the sent step is the resend path under the API's 3/h quota.
- Automatic sign-in after a successful reset (the API issues no session).
- REST transport for either operation (`POST /api/reset-password`, `/confirm`): replaced by
  GraphQL on the user's decision of 2026-10-05.
- Adding the new routes to the Lighthouse URL list (shared chrome; budgets measured on
  `/sign-in`).
- The contract pin bump to a user-service release with both mutations, which deletes the pending
  extension, and enabling the flag in production: both wait for that release.
- Deleting the `forgotPassword` flag (lifecycle stage 3, a later change).

> Assumption: the mobile resend countdown is excluded from v1 because no desktop or tablet frame
> draws it, the request frame conflates two states, and the API's 3/h per-user quota makes an
> unguarded resend a foot-gun (main-agent decision; research §4.3).

## 7. Constraints

### Repository gates

Every gate in `CLAUDE.md` binds unchanged: classes only outside React components, type-only
files, approved class-name suffixes, DI collaborators through tokens, the auth feature carved out
of the component DI bridge, module shape, rust-code-analysis metrics, zero jscpd clones, 100%
coverage and mutation, i18n parity, route-coverage manifest, ADR drift, console gate, and the
flag-contract test that permits `forgotPassword: true` only once a route contract registers the
route. The committed flag default under `src/config/runtime/` does not change.

> Revision 2026-10-08 (the user's request): the feature also adds gates, none relaxed. Every value
> that crosses a layer is a named type (TB-1, PRD NFR-17), and the design follows the Miro
> board's layers, which have no frontend Controller or Service (PRD NFR-18). The prerequisite
> chore `typed-boundaries-gate` ships the TB-1 gate and the suffix policy; this feature adds the
> `data-providers/` and `transformers/` folders, so its one ADR-drift significant path is
> `.dependency-cruiser.js`.

### Performance of the auth paint path

Both screens are lazy page chunks that load the MUI theme in parallel, as `/sign-in` does.
Nothing on the eager path may import the DI container, Apollo, zod or Sentry; the flag is read
through the container-free bridge. The mobile Lighthouse floor on `/sign-in` (0.84) has no
headroom and must not move.

### Security

Uniform outcome on the request step: user-service answers every address alike, the operation
document selects no `user` field, and the data-access layer maps every resolved request to one
outcome, so no caller can tell addresses apart; token in memory and removed from the URL before
anything else runs; no token in titles, logs, the Apollo cache or Sentry context; no automatic
retry of either mutation (a request consumes the 3/h per-address quota and sends mail, a confirm
consumes a single-use token); a rate limit — HTTP `429` or the per-address refusal — surfaced as
a banner; `autocomplete="email"` and
`autocomplete="new-password"`; the existing CSP, referrer and framing headers already cover the
page.

### Accessibility and design

WCAG 2.1 AA is the binding floor (axe in jsdom and in three engines) with the 2.2 24 px target
size applied to the in-card "Назад" control. The mandatory Figma gate runs for every screen; for
the new-password form it records the composition decision below instead of a frame match.

> Assumption: no Figma frame exists for the new-password form, so v1 composes it from the
> existing auth card and form primitives in the request screen's design language (same heading,
> body, field and button styles). The design owner is asked for a frame; the request is an open
> question, not a planning blocker (main-agent decision; research §4.3 gap 1).

## 8. Risks and Dependencies

- **No user-service tag carries the reset mutations** (no longer blocking implementation). The
  pinned v2.8.0 schema lacks them, and `scripts/check-contract-versions.sh` accepts only equal
  `vX.Y.Z` pins, not a commit SHA. Handling: build against a pending schema extension copied
  verbatim from user-service `main` and answered by the local Apollo mock (the user's decision of
  2026-10-05); ask user-service for a release tag carrying both mutations; the contract pin bump
  (`.env.example` pins, `Mockoon.Dockerfile` pin and checksum, deleting the extension and its
  wiring, `make codegen`, reviewed `make contract-diff` approvals) is a follow-up (epics
  Follow-up 5.3).
- **The mock drifts from the real contract.** Handling: the extension copies the upstream
  declarations exactly (names, nullability, `clientMutationId`) and the mock answers in the
  upstream error shapes, so the switch to the released schema is a no-op for the client; the
  production flag stays off until that release is deployed.
- **E-mail link host is the API origin**, so real e-mails never reach the app. Handling: upstream
  user-service issue 1 — build the link on the SPA origin.
- **GraphQL domain errors carry only a translated message** (user-service's
  `DomainExceptionNormalizer` emits `{ message }` and no `extensions`), so the client cannot read
  a machine code for a token rejection or the per-address limit. Handling: classify by the
  operation (a message-only error on confirm is always a token rejection, on request always the
  per-address limit) and ask user-service for a machine-readable code (open question).
- **Missing Figma frame for the new-password form.** Handling: composition decision recorded in
  §7; frame requested from the design owner.
- **Russian copy on the sent screen and the "аккаунту" spelling.** Handling: uk/en copy written
  by us; design owner confirms (open question).
- **Validator mismatch** (`\p{Lu}` on the client vs `[A-Z]` in the API) lets a Cyrillic
  password pass locally and fail upstream. Handling: one shared policy for the new password
  and sign-up, never weaker than the API.
- **Token leakage through telemetry `url` strings.** Handling: scrubber pattern plus stripping
  the URL before anything else runs.
- **Enabling the flag in the test stack changes the `/sign-in` baselines.** Handling: it lands
  no earlier than the route registration, after both routes exist; the runtime-config contract
  test forbids a shipped `true` or a test stack enabling the flag while no route is registered.
- **Visual baselines** for two pages × 13 sizes × 3 engines; local production containers go
  stale. Handling: baselines taken from CI artifacts only.
- **Upstream GraphQL limiter bypasses** (#462, #469, #470: the per-IP and per-endpoint limiters
  do not reach the GraphQL mutations today). Handling: accepted upstream dependency, already
  filed upstream, no new issue; the per-address 3/h limit still applies on GraphQL, and the
  client presents an HTTP `429` from the limiters the moment upstream enforces them.

## 9. Open Questions

For the product owner:

1. Is a 60% request-to-confirm completion rate in the first month the right starting target, and
   will user-service expose the counts?
2. Should the shared password policy (ASCII uppercase + digit, 8–64) also govern sign-up in this
   release, or in a follow-up?
3. Does requesting a second reset invalidate the first token upstream? This decides the resend
   copy on the sent step.
4. Who asks user-service for a release tag carrying both reset mutations and files the link-host
   issue, and when is that release expected?

For the design owner:

1. Will a frame for the new-password form be provided, or is the composition decision above
   accepted as the design of record?
2. Confirm the uk/en copy replacing the Russian sent-screen text and the "акаунту" spelling.
3. Confirm the "Назад" targets: sign-in from the request form, the request form from the sent
   step.
4. Accept the in-card "Назад" in `Font/200 #404142` instead of the Figma placeholder grey
   `#969B9D` (about 2.8:1 on white, below WCAG 1.4.3), an accessibility override of the token.
5. Is the mobile resend countdown wanted at all, and if so with what quota feedback?

## 10. Next Step

Hand this brief to `create-prd`: functional requirements per screen and step, the error-outcome
table as acceptance criteria, non-functional requirements from §5 and §7, the pending schema
extension with its stateless mock as the first deliverable, and the contract pin bump
carried forward as a follow-up that no story waits for.
