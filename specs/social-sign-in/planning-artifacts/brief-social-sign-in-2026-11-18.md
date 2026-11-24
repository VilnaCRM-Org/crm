---
status: 'complete'
workflowType: 'product-brief'
bmadCommand: 'create-brief'
project_name: 'crm'
date: '2026-11-18'
revised: '2026-11-20'
iteration: 5
revisionPasses:
  - '2026-11-19 GraphQL only, no ADR'
  - '2026-11-19 review: stale REST passages corrected'
  - '2026-11-19 review: GraphQL field names and scope aligned'
  - '2026-11-20 after #331 merged: 2FA hand-off to the challenge'
slug: 'social-sign-in'
inputDocuments:
  - 'specs/social-sign-in/planning-artifacts/research-social-sign-in-2026-11-18.md'
---

# Product Brief: Social Sign-In

Predecessor: [research](research-social-sign-in-2026-11-18.md).

## 1. Problem

The `/sign-in` and `/sign-up` pages show Google, GitHub, Facebook and Twitter/X buttons that do
nothing useful: they open a non-existent URL in a new tab. Users who expect one-click sign-in
hit a dead end, and the team has no way to exercise the user-service social OAuth flow that
already exists on its `main` branch. Developers also have no local recipe for testing the flow
with real provider credentials.

## 2. Target users

| User                               | Need                                                                                        |
| ---------------------------------- | ------------------------------------------------------------------------------------------- |
| New CRM user                       | Create an account without inventing a password                                              |
| Returning user                     | Sign in with the provider they used before, landing on the page they were heading to        |
| User with 2FA enabled              | Be asked for the second factor after the provider step, never bypass it                     |
| Frontend developer (the requester) | Verify the whole loop on a laptop: fully mocked, and with their own Google/GitHub keys      |
| CI                                 | Deterministic E2E coverage of success and every documented failure, no network to providers |

## 3. Value proposition

One click on a provider button signs the user in (or creates the account) through
user-service, in the same tab, with the existing memory-only session model, accessible error
recovery, and zero regression to the auth page's performance budget.

## 4. Scope

> Revision 2026-11-19: the SPA uses GraphQL only. Sign-in runs through two pending user-service
> mutations (`initiateSocialSignInUser`, `completeSocialSignInUser`) that the Apollo mock answers
> locally; Mockoon hosts only the mock consent page. No ADR is written for the feature.

### In

- Wire all four buttons to an in-app navigation to `/auth/callback/<provider>`, which calls the
  `initiateSocialSignInUser` GraphQL mutation and sends the same tab to the returned
  authorization URL.
- A public callback route that checks the returned `state`, calls `completeSocialSignInUser`
  with `code`/`state` and finishes sign-in, hands a 2FA account to the existing 2FA challenge
  (`/sign-in/two-factor`, #331) and then to its destination, or shows a localized, recoverable
  error (PRD D6).
- Preserve the intended destination across the provider round trip (issue #150 behaviour).
- Stateful Apollo mock resolvers for both mutations, plus a Mockoon-hosted mock consent page
  with one link per outcome, so every state is reachable locally and in CI.
- A "real provider consent" local mode: the Apollo mock returns the **real** Google/GitHub
  authorization URL for a provider whose client ID is set; the mock still answers the
  completion, so no client secret is needed.
- A step-by-step local verification guide: creating the Google Cloud and GitHub OAuth clients,
  the exact redirect URIs, the `.env` keys and the commands.

### Out

- Linking/unlinking providers in settings (user-service #520; separate feature).
- Backend changes in user-service: it has to add the two mutations (declared here as a pending
  contract), which is tracked as an upstream dependency, not built in this repository.
- Any REST call from the SPA; social sign-in runs over GraphQL only.
- Refresh-token persistence (deferred by the 2FA bundle; unchanged here).
- Production enablement (blocked on user-service #468 and a released contract tag).
- New visual design: no Figma frame exists for the callback states (see PRD assumption A4).

## 5. Success criteria

- A user clicking Google on `/sign-in` with Mockoon running ends signed in on `/` (or on their
  original protected destination) in the same tab, without seeing a JSON page.
- Every documented `error_code` plus provider-side `access_denied` renders a specific,
  localized message with a working recovery action, verified by E2E.
- With their own Google client ID, the developer sees the real Google consent screen and
  returns signed in, following only the local guide.
- Mobile Lighthouse on `/sign-in` stays at or above the current floor; all `quality.*` gates
  stay at their shipped values.

## 6. Constraints

- Contract pin `v2.8.0` lacks the endpoints; the newest user-service tag is still `v2.8.0`.
- The auth paint path is container-free and budget-bound (ADR-011, ADR-017).
- No `data-testid`, no suppressions, classes-only non-React code, type-only files,
  DI-delivered collaborators, 100% coverage and mutation score.

## 7. Risks (carried from research)

Contract pin, StrictMode double callback, `code`/`state` leakage, missing 2FA route, and
developer confusion between modes. Each has a mitigation owned by the PRD and architecture.
