---
status: complete
workflowType: run-summary
project_name: crm
date: 2026-10-06
feature: two-factor-authentication
issue: https://github.com/VilnaCRM-Org/crm/issues/331
author: 'orchestrator, autonomous run'
inputDocuments:
  - research-two-factor-authentication-2026-10-06.md
  - brief-two-factor-authentication-2026-10-06.md
  - prd-two-factor-authentication-2026-10-06.md
  - architecture-two-factor-authentication-2026-10-06.md
  - epics-two-factor-authentication-2026-10-06.md
  - readiness-two-factor-authentication-2026-10-06.md
---

# Run summary — two-factor authentication

## Task framing

Plan two-factor authentication for the crm `user` module with BMAD, then file the GitHub issues.
Inputs: Miro widgets `3458764570351803366` (2FA component) and `3458764570351863499` (User module
frame), the User/Auth component diagram (widget `3458764570351764591`); Figma
`xZ7ccrH6d4QyqLQsayFSEX` nodes `72:4846`, `72:4882`, `72:4918` (challenge) and the settings frames
found in the same file (`313:10242`, `315:11502` and their tablet and mobile siblings);
user-service `main` at `a95c1e854bf21770b7fc630611a8257b0f9c600b` against the pinned `v2.8.0`.

Bundle directory: `specs/two-factor-authentication/planning-artifacts/` in the worktree
`/home/dima/Desktop/crm-worktrees/2fa-planning` (branch `docs/two-factor-authentication-planning`
from `origin/main` `58099168`). The worktree's local `_bmad/config.yaml` points `planning_artifacts`
and `implementation_artifacts` at this bundle.

## Outcome

- Scope: TOTP authenticator app plus eight recovery codes — the only mechanisms user-service
  implements (no e-mail or SMS code). A public challenge route `/sign-in/two-factor` after a
  flag-on GraphQL `signInUser`, and a 2FA card as one section of the protected `/settings` page
  (enrol with a client-rendered QR code, confirm, recovery codes once, disable, regenerate).
- Backend: every operation exists only on user-service `main`; the frontend mocks them through a
  self-expiring pending schema extension shared with crm #315, behind the `twoFactorAuth` runtime
  flag (off in production, on in the dev and test stacks).
- Stories: 32 in four epics (386 acceptance criteria), plus nine follow-ups; bmalph parses every
  story with no warnings, and every dependency points backwards in file order.
- Decision record: ADR-020 (Deciders: @kravalg).

## Subagent Execution Log

Each line: phase — BMAD command — model — artifact or output.

1. Backend research — `analyst` (input) — Opus — user-service report (job notes).
2. Figma research — `analyst` (input) — Opus — frames, tokens and contrast report.
3. Repository research — `analyst` (input) — Opus — crm current-state map.
4. Research — `analyst` — Opus — research artifact.
5. Product brief — `create-brief` — Opus — brief artifact.
6. PRD — `create-prd` — Opus — PRD artifact.
7. Architecture — `create-architecture` — Opus — architecture artifact.
8. Architecture review — `validate-architecture` — Fable — architecture and PRD edits.
9. Epics and stories — `create-epics-stories` — Opus — epics artifact.
10. Corrections R1–R9 — `correct-course` — Opus — PRD, architecture, epics.
11. Readiness 1 — `implementation-readiness` — Opus — FAIL, 0 C / 1 H / 9 M / 14 L.
12. Corrections — `correct-course` — Opus — all five artifacts.
13. Readiness 2 — `implementation-readiness` — Opus — PASS, 0 C / 0 H / 3 M / 8 L.
14. Corrections — `correct-course` — Opus — all five artifacts.
15. Readiness 3 — `implementation-readiness` — Opus — PASS, 0 C / 0 H / 1 M / 8 L (all applied).
16. Final bundle review — `adversarial-review` — Opus — 0 C / 0 H / 5 M / 8 L, all fixed in
    place: desktop and tablet pin cells corrected to the 64 × 86 that Figma `72:5149` draws; the
    GraphQL sign-in `AuthError` fields and the `LoginResult` alias specified; an impossible home
    baseline criterion corrected; the two new colour tokens named and owned (Story 2.1); wording,
    one wrong path and repeated statements trimmed.

The orchestrator read Miro (Playwright screenshots) and the Figma challenge frames itself, made
every user-surrogate decision, and verified the upstream facts that changed the design directly in
the user-service source (no e-mail OTP; the firewall's transport 401 "Authentication required.";
"Access Denied." over HTTP 200 without a token; untranslated `HttpException` messages; the unused
catalog keys; the real problem+json 401 body).

## Validation rounds per artifact

| Artifact     | Rounds                                                                 |
| ------------ | ---------------------------------------------------------------------- |
| research     | written; readiness 1, 2 and 3 fixes; final review fixes                |
| brief        | written with the user-surrogate decisions; readiness 1, 2 and 3 fixes  |
| prd          | written; review edits; epics and readiness 1, 2, 3 fixes; final review |
| architecture | written; Fable review; epics and readiness 1, 2, 3 fixes; final review |
| epics        | written; R1–R9 fixes; readiness 1, 2 and 3 fixes; final review fixes   |
| readiness    | iterations 1 (FAIL), 2 (PASS), 3 (PASS, final; not edited afterwards)  |
| run summary  | final review                                                           |

The final bundle review (`adversarial-review` with `editorial-structure`, one pass, no further
iteration) re-opened more than 45 references in the worktree, user-service `a95c1e85`, the
ui-toolkit v0.6.0 build and the installed Apollo packages, read the Figma challenge frames
`72:4846` and `72:4918` through the Figma MCP, and applied every finding. Its desktop cell
height (64 × 86) replaces the 64 × 64 that readiness 3's P1 correction text assumes; the readiness
file itself is left as written.

## Coordination with other planning bundles

Superseded by the Simplification 2026-10-08 section: #330 owns every shared piece below, and the
mock reads no token.

A parallel planning session for User Settings (`specs/user-settings`, ADR-021, worktree
`/home/dima/Desktop/crm-worktrees/user-settings-planning`) plans the same `/settings` page. Agreed
and written identically in both bundles: whichever lands first builds the `/settings` route and
shell in `features/settings`, the Bearer link (`SessionLinkFactory`), the shared
`UserServiceErrorNormalizer` and failure types, the render-time `RouteFlagGate`, the mock's token
rule and `mock-expired-token`, the session-ended notice, the `UIForm` footer slot and the
`paletteColors.error.text` token; the second only extends. The toast is owned by User Settings and
unused by 2FA. ADR numbers: 019 (#315), 020 (2FA), 021 (User Settings). The pending-contract
mechanism is shared with crm #315 the same way.

## Open questions, warnings and blockers

Superseded by the Simplification 2026-10-08 section: the controllers, the story ids and the
readiness iteration named below are historical (readiness is now iteration 4).

- Blocker for production only: no user-service release carries sign-in or 2FA (user-service #513,
  release pipeline #458). Follow-up 5.1 bumps the pins and enables the flag after it.
- Design gaps: no frames for the enrolment confirm step, the recovery codes view, disable and
  regenerate confirmations, recovery-code mode and error states; the Figma tablet and mobile
  challenge frames describe an e-mailed code that does not exist; the settings copy is Russian
  (Follow-up 5.5).
- Cross-origin production also waits for user-service#514: CORS allows `Authorization` but rejects
  the `X-Request-Id` / `X-Correlation-Id` headers crm sends on every request.
- Unverified until a real environment exists: the HTTP status of real GraphQL errors (MD-5) and the
  deferred DI chunk size (baseline from 2026-07-20).
- No open question blocks implementation. Readiness is final at iteration 3 (PASS); no further
  readiness iteration is planned.
- Risks to watch during implementation (readiness 3):
  - toolkit selector specificity: the compiled `:focus-visible:not([aria-disabled="true"])` and
    hover rules can outrank the seam's overrides; check the ring and border in a browser while
    Story 2.4 is open (Story 4.2 is the first computed-style proof);
  - concurrent bundles (#315, User Settings, PR #311) touch `ProtectedRoute`, `UIForm`, `di.ts`,
    `stores/index.ts`, the composer, the outlet context, the mock and ADR numbers; the second
    lander re-counts the caps (`di.ts` reaches 14 of 15);
  - "Access Denied." with a token present, or on a transport 401, maps to `session_ended` while
    the token stays, so the card stays silent; re-check in Follow-up 5.1;
  - the settings card's content box on phones and tablets sets the confirm step's cell size and
    its 44 px floor; Stories 3.6 and 4.3 are the first measurements;
  - jscpd (70 tokens, zero tolerance) may flag the two controllers' shared abort, Retry and patch
    shape unless shared pieces are extracted;
  - the deferred auth/DI chunk (317 727 of 400 000 B raw, stale baseline) is measured by Stories
    1.7, 2.5, 2.8 and 3.3.

## Recommended next step

Review the bundle and approve the commit; then implement with `/fe-sdlc-implement` (Ralph runs the
stories in file order).

Filed: crm feature issue VilnaCRM-Org/crm#331; user-service #523 (confirm appends recovery codes
when 2FA is on), #524 (GraphQL 2FA mutations bypass the 2FA rate limiters), #525 (expose
`twoFactorEnabled`); comments on #522 (machine-readable error codes, shared with crm #330), #362
(plaintext TOTP fallback) and #513 (release). None blocks the implementation; #513, #458 and #514
block production enablement only.

## Revision 2026-10-08

At the user's request ("all data that transferred between layers (classes) should be strictly
typed … check that your architecture strictly follows the Miro board architecture"), the bundle
was revised against the shared layer contract (`_planning-shared/miro-layer-contract.md`):

- **Rule added:** TB-1 typed boundaries (PRD NFR-21, verbatim canonical text) and Miro layer
  conformance (PRD NFR-22). The TB-1 gate is built by #315 Epic 0 (Stories 0.1–0.6), which lands
  first; this
  bundle depends on it and adds no selector.
- **Miro findings:** the board has no frontend Controller or Service; "Controller" appears only
  in the Structurizr Internet Banking sample (Spring MVC REST controllers) and "service" only as
  backend containers. The frontend layers are route component → React hook → Data provider ⇄
  Transformer → GraphQL Repository → API, with State and named `[type]` DTOs and Entities.
- **Design changes:** both controllers removed (logic in React hooks over #315's
  `useAbortableSubmit`); `TwoFactorSignInRepository` → `GraphQLSignInRepository` and
  `GraphQLSignInTransformer`; `TwoFactorSettingsRepository` →
  `GraphQLTwoFactorSettingsRepository`, `GraphQLTwoFactorSettingsTransformer` and
  `TwoFactorSettingsProvider`;
  `UserServiceErrorNormalizer` → #315's `UserServiceErrorTransformer`; `TwoFactorCard` →
  `TwoFactorSettings`; board types `TwoFactorDto` (`2FADTO`) and `TwoFactorSettingsEntity`
  (`2FADTOSettingsEntity`); recovery codes cross as `RecoveryCodeSet`. All diagrams redrawn in
  the board's notation (architecture §3 to §5, §19).
- **Epics:** six stories rewritten (1.5, 2.5, 2.8, 2.10, 3.3, 3.4), TB-1 criteria in 25 stories,
  Miro criteria in 12, #315 Epic 0 as the external prerequisite; numbering and waves unchanged.
- **Readiness:** re-checked 2026-10-08 — 67 requirements, 0 traceability differences, PASS
  conditional on #315 Epic 0 (Stories 0.1–0.6). The jscpd risk on the two controllers is gone
  with them; new risks are listed in the readiness revision section.
- **Coordination:** shared names follow the contract's cross-bundle table; "first of #330 and
  #331" still builds the `/settings` shell (`UserProfile` page), `SessionLinkFactory`,
  `RouteFlagGate` with `FeatureFlagSet`, and the `UIForm` `footer`. The `FeatureFlagSet` element
  shape is now settled (`FeatureFlagRef`, see below).

**Independent verification applied (2026-10-08).** The findings of
`_planning-shared/verification-2026-10-08.md` that touch #331 are fixed, and decisions D1 to D10
are adopted as final:

- **F6, D10 (major):** sign-in gets the board's Data provider, `GraphQLSignInProvider`, with
  three `@inject` collaborators and no deps bag; `GraphQLSignInRepository` is transport only;
  the Transformers are called by the provider; the `SignInProvider` Strategy sits at the
  provider role with the REST `AuthRepositoryImpl` as its declared legacy implementation; State
  actions call the provider. L3 §3.3 and sequences §4.1 and §4.2 redrawn, §19 updated and the
  declared sign-in gap removed (the one remaining: State actions → Data provider).
- **F3, D6 (major):** `TwoFactorChallengeActionsDeps` and the Strategy-binding closure are gone;
  the flag choice is a field of the existing `AuthStoreActionsDeps` closure. `UserModuleRegistrar`
  closures 3 today → 4 after #315 → 5 → 6 (cap 6).
- **F4, D1, D2 (major):** #315's single `UserServiceFailure`, its reason union only appended to,
  `FieldViolation { path; reason }`; rules 3a and 7a added (A §6.8, E Story 1.5).
- **Minor:** F7 (refined TB-1 text, sha256 `eb676341…` in PRD and architecture), F10/D7
  (prerequisite named "#315 Epic 0 (Stories 0.1–0.6)"), F11/D3 (`FeatureFlagRef`), F12/D4
  (`settings/routes/user-profile/`), F13/D5 (`AuthStatePatch`, `AuthOkResult<T>`,
  `AuthFailedResult`, `AuthResult<T>`), F14/D9 (`AuthStateActions`, `Feature toggle [module]`,
  `State [Reactive var]` stereotypes, since replaced by `State [Zustand]`), D8 (board names
  recorded), F16 (edge labels), F20 (hook
  split, no view Transformer), F21 (readiness claims corrected).
- **Shared shapes used as #315 declares them:**
  `SignInNoticeProps { notice: ArrivalNotice | null }` (`ArrivalNotice` starts
  `'password_reset'`, #330 appends `'session_ended'`) and
  `AbortableSubmit<TInput, TOutcome>` (`isSubmitting`, `submit`, `retry`).
- **Not applied here:** F1, F2, F5, F8, F9, F15, F17, F18, F19 (other bundles only).
- **Checks:** bmalph 32 stories, 433 criteria, 0 warnings; 67 requirements traced; 14 diagrams
  render with mermaid-cli 11.4.2; Prettier and markdownlint clean; no line over 100 characters.
- **Shared User domain (2026-10-08, later the same day):** prerequisite now #315 Epic 0 (Stories
  0.1–0.7); sign-in uses #315's `SignInDto`; `TwoFactorDto` and `TwoFactorSettingsEntity` move to
  the shared `src/modules/user/types/user/` as plain user-service-shaped interfaces;
  `TwoFactorChallengeDto` → `TwoFactorChallengeInput`; five part and wrapper types deleted; the
  `UserProfile` page passes the entity to `TwoFactorSettings`; TB-2 added beside TB-1 (hash
  unchanged). Checks: bmalph 32 stories, 444 criteria, 0 warnings; all diagrams render; Prettier
  and markdownlint clean.

## Simplification 2026-10-08

The user: "apply all 10" items of `_planning-shared/over-engineering-review-2026-10-08.md`; "we
should use only repositories to access data but with graphql, not the REST, we use only graphql";
`src/services/*` is out of this topic. Prerequisites are now chore #332 (typed-boundaries-gate,
draft PR #333) → #315 Epic 0 (Stories 0.1–0.2) → #330, and the bundles land #315 → #330 → #331,
so this bundle imports every shared piece and builds none.

- **Counts.** New classes 9 (+9 changed) → 7 (+8 changed, 2 deleted); hooks 8 → 8; new named
  types 57 → 40; stories 32 → 23; criteria 444 → 241; follow-ups 9 → 8; DI tokens 7–8 → 6 new
  and 2 removed; registrar closures 1 → 0.
- **Sign-in GraphQL only.** `GraphQLSignInProvider` is the one sign-in Data provider, reached by
  `useSignInSubmit` through #315's loader; only the sign-in path leaves `AuthStoreActions`
  (final check, 2026-10-08, superseding "one call and one branch"). The `SignInProvider`
  Strategy and its legacy implementation are gone; new Story 2.3 removes the REST login
  (`api-config.ts`, `LoginAPI`, `AuthRepositoryImpl.login`, `LoginResponseMapper`, their schema,
  types, tokens, registrations, policy carve-out and tests, the msw REST handler and the REST
  e2e stubs) with a criterion that no REST login remains. Registration already uses the GraphQL
  `createUser` mutation and is untouched.
- **Flag.** `twoFactorAuth` only gates the 2FA section on #330's page; it no longer picks a
  transport or gates the challenge route. The test stack enables it in Story 4.1.
- **Removed or merged.** `TwoFactorChallengeActions` and `AuthStateActions` (the challenge hook
  resolves the provider through #315's `AuthProviderLoader` and writes `useAuthStore`); the
  first-lander stories (Bearer link, route flag gate, error red, `UIForm` props, `AuthCard`,
  generic notices, settings shell); the stateful mock and the expiry checker (FR-2 withdrawn);
  the settings security signal with its deps bag; the 3a/7a slots; `PendingChallenge`, the
  aborted outcomes and twin types; the `busy` flag; one confirmation view for disable and
  regenerate.
- **Not applied as written.** Review item 7 moves the challenge signal into the Data provider,
  which would need a fourth constructor argument (cap 3); the challenge hook records it through
  the same loader instead.

Story ids, old → new: 1.1 and 1.3 → 1.1; 1.2 → 1.2; 1.4 → 1.3; 1.5 → 1.4; 1.6 → 1.5; 1.7 and
1.8 dropped (#330); 2.1 (focus ring and border grey only; the token is #330's) and 2.4 → 2.1;
2.2 → 3.4 (`submitBlockedReason` only); 2.3 dropped (#315); 2.5 and 2.6 → 2.2; new 2.3; 2.7 →
2.4; 2.8 → 2.5; 2.9 → 2.7 (2FA notice keys only); 2.10 → 2.6; 2.11 → 2.7; 2.12 → 2.8; 3.1
dropped (#330; the slot fill → 3.4); 3.2 → 3.1; 3.3 → 3.2; 3.4 → 3.3; 3.5 and 3.6 → 3.4; 3.7 →
3.5; 4.1 to 4.5 unchanged. Follow-up 5.3 (retire REST) is done by Story 2.3; 5.4 to 5.9 become
5.3 to 5.8.

Checks: bmalph 4 epics, 23 stories, 241 criteria, 0 warnings; the 14 Mermaid blocks render with
mermaid-cli 11.4.2; TB-1 and TB-2 hashes unchanged; Prettier and markdownlint clean; no line over
100 characters. Readiness iteration 4: PASS (0 C / 0 H / 1 M / 5 L).

## Zustand client state 2026-10-08

The user: "change the react state var to zustand", then "1, but firstly update the diagrams".
Option 1 is a new prerequisite, chore `zustand-client-state` (#334): it adds `zustand`,
writes an ADR superseding ADR-008, removes the zustand ESLint ban and its contract test, migrates
`AuthStateVar`, `ConnectivityStateVar` and `src/lib/state/*` to Zustand stores and measures the
paint budget. Landing order: chore #332 and chore `zustand-client-state` → #315 → #330 → #331.

- **Diagrams first.** The state cylinder is `useAuthStore [Zustand store]` (the board's
  `State [Redux]` drawn `State [Zustand]`) in the L2 view and both L3 stacks; writes are
  `setState(AuthStatePatch)` and reads `selector: AuthState` in the L3 stacks, sequences 4.1 and
  4.2 and the Bearer read of 4.3; the challenge state machine reads the pending id with a selector
  and lands on a `setState` patch; the epics dependency graph names the new chore.
- **Text.** `AuthStateVar.set` / `get()` / `reset()` became `useAuthStore.setState` /
  `getState()` / the cleared-state reset in the architecture, PRD, epics criteria and file lists,
  readiness and this summary. This feature only adds `AuthState` fields and creates no store; the
  token and pending session id stay memory-only, with no `persist` middleware. Settings still
  reaches the store only through the outlet context, because of the sibling-feature ban.
  DI-constructed classes take the store as `AUTH_TOKENS.AuthStore` (`StoreApi<AuthState>`,
  registered by value by the chore, as in #330); here only #330's `SessionLinkFactory` reads it.
- **Not changed.** No migration story was added; TB-1's frozen "reactive-var state" wording stays
  byte-identical, with a note after it in the PRD and the architecture that it reads as Zustand
  store state; the research and brief keep their
  descriptions of today's code.

Checks: bmalph 4 epics, 23 stories, 243 criteria, 0 warnings; the changed Mermaid blocks render
with mermaid-cli 11.4.2; TB-1 and TB-2 hashes unchanged; Prettier and markdownlint clean; no line
over 100 characters.

## Reconciliation 2026-10-27

The bundle was reconciled, read-only against code, to `feat/331-two-factor-authentication` at
`77f59152`, which carries #315 (PR #340), #330 (PR #354) and #362 (app shell) on `main` with
`#311` and `#333`. No build, test or lint ran. The architecture holds the numbered correction list
(items 1 to 18) and inline `Code facts (reconciled 2026-10-27)` notes and
`> Assumption (reconciliation 2026-10-27)` blocks; the epics, the readiness file and the PRD
carry short notes pointing to it.

- **Stories:** 23 → 25. None deleted; 2.3 split into 2.3 and 2.9; 3.4 split into a new 3.1 and
  3.4; the low-codes notice renumbered 3.1 → 3.6; 1.2, 1.5 and 2.4 rewritten; the two
  `ArrivalNotice` members moved from 2.7 to 2.6; `UIForm` `errorAction` added to 2.1.
- **Before `bmalph implement`:** move `.ralph/@fix_plan.md` (#362's plan, ten completed ids)
  aside, or bmalph carries those ids into the 2FA plan.
- **Open questions for the owner:** whether the challenge shows the sign-in success card before
  redirecting (the plan proceeds directly); how Story 3.1 installs its two packages from this
  worktree; whether the PRD's sign-in texts should replace the shipped `invalid_credentials` and
  `rate_limited` copy (the plan keeps the shipped copy).
