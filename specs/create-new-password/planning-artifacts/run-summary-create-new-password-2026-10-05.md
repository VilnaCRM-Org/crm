---
status: complete
workflowType: autonomous-planning
project_name: crm
date: 2026-10-05
revised: 2026-10-08
issue: https://github.com/VilnaCRM-Org/crm/issues/315
---

# Run summary: create new password

## Bundle

`specs/create-new-password/` — planning artifacts in `planning-artifacts/`, story records in
`implementation-artifacts/`. The local, gitignored `_bmad/config.yaml` points `planning_artifacts`
and `implementation_artifacts` at this bundle so `bmalph implement` reads it.

## Task framing

Plan the **create new password** feature of the `user` module: a person who forgot the password
asks for a reset email, opens the link, sets a new password, and is sent to sign-in. Base the
design on the existing crm architecture (bulletproof-react modules, classes only outside React
components, DI composition roots, type-only files, route registry) and on domain-driven design
vocabulary for the password-recovery subdomain. Use design patterns only where a second
implementation exists or is scheduled. Create a GitHub issue once the chain passes readiness.

## Evidence gathered by the main agent

### Miro: Frontend C4 Architecture VilnaCRM

Board `https://miro.com/app/board/uXjVMG64hTs=/`. Screenshots (viewer captures, 2026-10-05):

- widget `3458764570351803371`: element **Create new password [React component]** — "Allows
  users to create new passwords on VilnaCRM".
- widget `3458764570351764591`: the User/Auth component diagram around it. Elements and edges:
  - `CRM [Container]` → `Sign-In`, `Create new password`, `Reset Password`, `Sign-up`
    `[React component]`.
  - **Reset Password** [React component] "Allows users to reset their passwords on VilnaCRM" →
    `API [Software System]`: edge label **"reset password 1 Restore password"**.
  - **Create new password** → `API`: **"reset password 2 request for sign-in"**.
  - **Create new password** → `Sign-In`: **"reset password 3 redirect to sign-in"**.
  - `Sign-In` → `BFF`: "1 get cookie and token by credential"; → `State`: "2 save JWT token".
  - `Sign-up` → `Onboarding [Module]`: "redirect to Onboarding module".
  - `User profile settings` → `User settings` (initials, email, **changing password**), `2FA`,
    `Social networks`; `User profile` → `BFF`: "Log-out".
  - The `State [Redux]` and `CRM [Container: JavaScript and Angular]` labels predate the current
    stack (React 19; Zustand stores after the chore `zustand-client-state`) and are not
    requirements; the diagrams draw the store as `State [Zustand]`.

The diagram therefore splits recovery into two components: **Reset Password** (ask for the email)
and **Create new password** (set the new password from the emailed link, then redirect to
sign-in). The in-app "changing password" under _User settings_ is a different, authenticated
flow and is out of scope.

Captures were session-scoped and are not kept; re-read the board with `moveToWidget` + a ~12 s wait.
The 2026-10-08 re-read is kept with the planning contract (see "Revision 2026-10-08" below).

### Figma: VilnaCRM (Copy), file `xZ7ccrH6d4QyqLQsayFSEX`, page `Design CRM` (`0:1`)

Section **"Восстановление пароля"** (frames at x 7284–10178):

| Screen                  | Desktop 1440 | Tablet 1024 | Mobile 375  |
| ----------------------- | ------------ | ----------- | ----------- |
| Forgot password (email) | `72:5596`    | `72:5617`   | `72:5638`   |
| Check your email        | `360:11925`  | `360:11937` | `360:11949` |

Forgot password (desktop `72:5596`): app top bar with `‹ На головну сторінку`; centred white card
502 × 360 at y 148; inside: `‹ Назад` (chevron-left 24 + 15 medium), heading **"Забули пароль?"**
(H4 Golos DemiBold 30), body **"Введіть адресу поштової скриньки вашого аккаунту"** (Golos 16/26),
`Input` instance labelled **E-mail**, placeholder `vilnaCRM@gmail.com` (422 × 91 incl. label),
primary pill button **"Підтвердити"** (422 × 62, `Frame 15`); footer desktop.

Check your email (desktop `360:11925`): same chrome, card 502 × 312: `‹ Назад`, heading
**"Проверьте почту"**, body "Мы отправили письмо на электронный адресс `eir*****@gmail.com`.
Проверьте почту и следуйте инструкциям" (masked email), primary button **"К входу"**
(to sign-in). Copy is Russian; the shipped locales are `uk` (main) and `en` (fallback).

Tablet frames: card 636 wide at x 194, same content. Mobile frames: card 363 wide at x 6, button
314 × 50, `footer mobile`.

**Mobile forgot-password `72:5638` diverges from desktop/tablet**: its body reads "Ми надіслали
Вам лист на пошту `f*****dj@gmail.com`" and it adds a resend row **"Надіслати код ще раз 00:34"**
(countdown) under the button — a "sent, resend available" state that desktop and tablet do not
draw.

Variables on the card (`get_variable_defs 72:5599`): `Font/100 #1A1C1E`, `Font/200 #404142`,
`Font/300 (Placeholder) #969B9D`, `Font/400 (Stroke) #D0D4D8`, `Font/500 (Line) #EAECEE`,
`Primary #1EAEFF`, `White #FFFFFF`; type `H4` Golos DemiBold 30/100%, `Body text (16)` Golos
16/26, `15 (medium)` Golos Medium 15/18, `Button` Golos DemiBold 18/100%, `14 medium` Inter 14/18.

**No Figma frame exists for the "set a new password" form** (searched every text node on the page
for парол/password: only "Забули пароль?" on the sign-in card `15:793`, and "Текущий / Новый
пароль" on an in-app _Settings_ page `313:10242`, which is the authenticated change-password flow).
The sign-in design already carries a **"Забули пароль?"** link (`15:793`) — the entry point.

Captures were session-scoped and are not kept; re-read the frames with the Figma MCP.

### Backend contract: user-service

- crm pins `OPENAPI_SPEC_VERSION=v2.8.0` and `GRAPHQL_SCHEMA_VERSION=v2.8.0` (`.env.example`).
  **v2.8.0 has no password-reset operation** (0 matches for "reset").
- user-service `main` (`a95c1e85`, 2026-09-28, 71 commits ahead of v2.8.0, no newer tag) has:
  - REST `POST /api/reset-password` (`request_password_reset`) body `{ email }` (format email,
    max 254) → `204`; `400`, `404 User not found`, `422`, `429` rate limit, `500` problem+json.
  - REST `POST /api/reset-password/confirm` (`confirm_password_reset`) body
    `{ token (max 255), newPassword (8–64, pattern ^(?=.*[0-9])(?=.*[A-Z]).{8,64}$) }` → `204`;
    `400 Invalid or expired token`, `404 token not found`, `422`, `500`.
  - GraphQL `requestPasswordResetUser(input: { email!, clientMutationId })` and
    `confirmPasswordResetUser(input: { token!, newPassword!, clientMutationId })`, payload
    `{ user, clientMutationId }`.
- Email link built by `PasswordResetEmailSentEventSubscriber::createResetUrl`:
  `${API_BASE_URL}/password-reset?token=<urlencoded>` — the **API** base URL, not the SPA origin.
  Token length 32, expires after 1 h; rate limits: 3 requests/h per user, 5/h per IP, confirm
  10/min.
- Open upstream issues touching this flow: #462 (GraphQL `requestPasswordReset` bypasses the per-IP
  limiter), #470 (no per-endpoint limiter on `requestPasswordResetUser`), #469 (GraphQL limiters
  bypassed), #473 (confirmation tokens in cleartext; reset half already hashed). The
  `404 User not found` on the request endpoint is a user-enumeration signal the UI must not
  surface.
- GraphQL behaviour read at the source (user-service `main`, 2026-10-05, for the GraphQL
  revision): both resolvers return `null`, answered as `{ user: null, clientMutationId }` (the
  Behat suite asserts `user` is `null`), and the request handler takes one constant-time path for
  known and unknown addresses, so the request mutation is enumeration-uniform by construction.
  Input violations surface as `<property>: <reason>` GraphQL errors (API Platform validation);
  domain exceptions (token not found, expired, used, mismatched; the per-address limit) are
  normalised by `DomainExceptionNormalizer` into `{ message }` only, translated and with no
  `extensions`; the endpoint limiters answer HTTP `429` problem+json but do not reach the reset
  mutations yet (#462, #469, #470). The per-address limit decorates the request handler, so it
  applies on GraphQL. The newest tag is still v2.8.0, which has no reset mutation.
- The reset declarations of `.github/graphql-spec/spec` arrived on `main` in PR #215 (commit
  `63041e4a`, 2026-01-11) and are unchanged in `f82bbef5` (2026-03-23), the file's latest
  revision on `main` on 2026-10-05; v2.8.0 (2025-08-23) remains the newest tag.

## Subagent Execution Log

- **1. Research** — `analyst` → `research-create-new-password-2026-10-05.md`; rounds: 1.
- **2. Brief** — `create-brief` → `brief-create-new-password-2026-10-05.md`; rounds: 1.
- **3. PRD** — `create-prd` → `prd-create-new-password-2026-10-05.md`; rounds: 3 (FR-24
  revised; four review corrections).
- **4. Architecture** — `create-architecture` + `validate-architecture` →
  `architecture-create-new-password-2026-10-05.md`; rounds: 3 (draft on Fable; lint pass and
  review on Opus after the Fable weekly limit).
- **5. Epics and stories** — `create-epics-stories` → `epics-create-new-password-2026-10-05.md`;
  rounds: 4 (draft; conflict decisions; two readiness correction passes). bmalph parses 4 epics,
  28 stories, 218 acceptance criteria, 0 warnings; five follow-ups sit outside the story grammar.
- **5b. GraphQL revision — iteration 4** — brief, PRD, architecture and epics revised for the
  user's GraphQL-only decision: transport, outcome tables and FRs 7, 9, 12–15, 21, 22, 24–26
  rewritten in GraphQL terms; the API classifies answers by shape and the repository by step;
  `fetchPolicy: 'no-cache'`; the pin bump moved from Follow-up 5.3 to Prerequisite P.1 before
  Epic 1; Follow-up 5.2 made optional; the research gains a dated superseded note. bmalph
  parses 4 epics, 28 stories, 235 acceptance criteria, 0 warnings; P.1 and the four follow-ups
  are not parsed as stories. Readiness left for a fresh check.
- **5c. Mocked-GraphQL revision** — brief, PRD, architecture and epics revised for the user's
  decision to mock the reset mutations in the front end until user-service releases them:
  Prerequisite P.1 retired and returned to Follow-up 5.3 (pin bump plus deleting the pending
  extension); new Story 1.0 (pending schema extension at `src/api/contracts/pending/`, codegen
  schema array, expiry checker in `scripts/codegen.sh`, offline pin tripwire, Apollo mock
  composition with a graphql-js duplicate check, mock resolvers moved out of Story 1.3); Story
  4.1 enables the flag in the dev and test stacks instead of flipping the shipped default (dev
  server renders the runtime block through `rsbuild.config.ts`); new Follow-up 5.6 (production
  enablement, configuration only); architecture §5.14, §5.16, §8, §12–§16 revised; the research
  gains a dated note. bmalph parses 4 epics, 29 stories, 249 acceptance criteria, 0 warnings;
  the six follow-ups are not parsed as stories. Readiness marked stale for a fresh check.
- **6. Readiness** — `implementation-readiness` → `readiness-create-new-password-2026-10-05.md`;
  iterations: 3 (FAIL 2 High, FAIL 1 High, PASS) plus post-verdict corrections; its verdict
  predates iterations 4 and 5c and is re-run by a fresh checker.

Stages 5 and 6 and all correction passes ran on Opus.

## Main-agent decisions

- **2026-10-05, the user's decision: mock GraphQL until user-service releases.** "We will mock it
  to work in the front end as the user service is not released." The frontend is built and
  working now against mocked GraphQL: one pending schema extension, copied verbatim from
  user-service `main`, feeds codegen and the local Apollo mock until the pin bump deletes it.
  GraphQL-only stays; no REST. The shipped `forgotPassword` default stays `false` so production
  never reaches a flow its user-service cannot serve; the test stack enables it. The pin bump is
  Follow-up 5.3 again and production enablement is Follow-up 5.6; neither blocks implementation.
- **2026-10-05, the user's decision: GraphQL only.** Both operations use the
  `requestPasswordResetUser` and `confirmPasswordResetUser` mutations through the container's
  Apollo client; REST (`POST /api/reset-password`, `/confirm`), a REST façade over `HttpsClient`,
  hand-typed REST schemas and `page.route('**/api/reset-password')` mocks are replaced
  everywhere. The contract pin bump became Prerequisite P.1, because the v2.8.0 schema has
  neither mutation and the version check accepts only equal `vX.Y.Z` tags; the mocked-GraphQL
  decision above superseded that the same day. The upstream GraphQL limiter gaps (#462, #469,
  #470) are an accepted dependency, already filed upstream.
- Scope covers both Miro components (Reset Password and Create new password); the signed-in
  Settings change-password flow is out of scope.
- The shared password policy is never weaker than the API and keeps sign-up's lowercase rule.
- Enabling the flag in the test stack intentionally re-baselines `/sign-in`; it lands after both
  routes are registered, and the shipped default stays `false`.
- The pill-styled recovery links take one scoped `color-contrast` entry under issue #276; "Назад"
  renders in `#404142` instead of the failing Figma grey.
- The six follow-ups are kept outside the bmalph story grammar so Ralph never dispatches them.
- The ADR is ADR-019 because open PR #311 claims ADR-018.

## Open questions, warnings, blockers

- Blockers for implementation: none. Implementation can start now against the pending
  extension and the local Apollo mock.
- Waiting on user-service, not blocking: the pin bump that deletes the extension (Follow-up 5.3)
  waits for a release tag carrying both mutations, and production enablement of the flag
  (Follow-up 5.6) waits for that release to be deployed with the link-host fix.
- Upstream: request the release tag (Follow-up 5.3's unblock action) and file Follow-up 5.1
  (reset link built from the API host) together; Follow-up 5.2 (OpenAPI enum and pattern defects) is
  optional since the GraphQL decision. Optional ask: a machine-readable code on GraphQL domain
  errors, which today carry only a translated message.
- Accepted upstream risk: #462, #469 and #470 (GraphQL limiters not applied to the reset
  mutations); the client already handles an HTTP `429` once they are fixed.
- Design owner: set-new-password frame, uk/en copy, mobile masking variant, "Назад" targets and
  colour, pill vs plain link, the resend countdown.
- Product owner: the 60 % completion hypothesis, keeping the lowercase rule, Lighthouse mobile 85
  in the profile vs the 0.84 CI assertion.
- Coordinate merge order with PR #311 (ADR index, a11y allowlist prose).
- Ralph dispatches stories in file order and ignores `Depends on`; the epics keep every dependency
  pointing backwards in file order.
- Mock drift: the extension mirrors user-service `main` as of `f82bbef5`; the pin bump
  (Follow-up 5.3) re-reads the tag's declarations when it deletes the extension.

## Recommended next step

Land the prerequisite chores `typed-boundaries-gate` (#332) and `zustand-client-state` (#334)
first. Then `/fe-sdlc-implement` (or
`bmalph implement`) against this bundle, starting with Wave 1 (Stories 0.1 and 1.1); no upstream
release is needed first. The local `_bmad/config.yaml` already points at it.

## Upstream issues filed (2026-10-05)

- VilnaCRM-Org/user-service#512: build the reset e-mail link from a frontend base URL, not
  `API_BASE_URL` (Follow-up 5.1).
- VilnaCRM-Org/user-service#513: tag a release that includes password reset (unblocks
  Follow-up 5.3).

## Revision 2026-10-08: typed boundaries and the Miro layers

**Trigger.** The user's request: "all data that transferred between layers(classes) should be
strictly typed. Please add the rule that forbid to use plain arrays/anonymous objects - only named
and typed classes/interfaces and update the architecture diagrams, check that your architecture
strictly follows the Miro board architecture. Because we haven't mentioned any services and
controllers in architecture as I remember".

**Evidence.** The board was re-captured on 2026-10-08 with a local headless Chrome (the browser
MCP servers were locked by another session); screenshots and the extraction live in
`crm-worktrees/_planning-shared/` (`miro-layer-contract.md`, `miro/*.png`). Findings:

- The frontend frames use only `[React component]` / `[component]<route>`, React hook,
  `[Data provider]`, `[Transformer]`, `[Repository]`, `Mutation [GraphQL]`, `State`,
  `[Decorator]`, `[type]` (`*DTO`, `*Entity`), `[module]` and `[Software System]`.
- "Controller" appears only in the Structurizr "Internet Banking" sample frame, as server-side
  Spring MVC REST controllers; "service" appears only as backend containers (User service,
  Payment service, Notification service). The user's recollection is correct: the board has no
  frontend controller or service.
- The code-level User module frame already pairs every component with a named `[type]` (`*DTO`,
  `*Entity`), the board's own form of the typed-boundary rule.

**Changes.** NFR-17 (TB-1, TB-2) and NFR-18 (board alignment) joined the PRD; the controllers
became React hooks over a shared `useAbortableSubmit`, the service became the `[Data provider]`,
the API-client layer folded into the `[Repository]` `GraphQLPasswordRecoveryRepository`, and error
translation moved to two `[Transformer]`s; every diagram was redrawn with board stereotypes and a
named type per edge. The independent verification
(`crm-worktrees/_planning-shared/verification-2026-10-08.md`) and the shared User domain
(`ddd-domain-check-2026-10-08.md`: `UserEntity` and the board's DTOs, the `SignInDto` /
`SignUpDto` rename, `RestorePasswordDto`, TB-2) were applied the same day; the bundle then held
35 stories and 351 criteria.

**Simplification 2026-10-08.** The user: "apply all 10" items of
`crm-worktrees/_planning-shared/over-engineering-review-2026-10-08.md`; data access through
GraphQL repositories only; `src/services/*` untouched; the TB-1 gate in a separate chore that
lands first. Result: 23 stories and 277 criteria (5 epics, no warnings); the chore
`crm-worktrees/typed-boundaries-gate/specs/typed-boundaries-gate/` holds 2 stories and 26
criteria. Readiness iteration 8 records the counts and passes.

- The TB-1 gate, its burn-down, `consistent-type-definitions`, the suffix policy and the
  CLAUDE.md section moved to the chore; `explicit-module-boundary-types` and the generated-types
  rule were dropped.
- One `AuthProviderLoader` replaced the proxy, factory and interface; FR-25 and its signal were
  withdrawn; the mock became stateless; `ResetTokenSource` became `useResetToken`; the outcome,
  rule-table and deps types collapsed; `SentView` and `InvalidLinkView` became uses of
  `RecoveryResultView`; the classification lost its 3a/7a slots.
- #315 owns the shared pieces, and the landing order is #315 → #330 → #331 (contract §3.4).

Story ids, old → new: 0.1 and 0.2 → 0.1 (the suffix half of 0.2 → chore 1.1); 0.3 to 0.6 →
chore 1.2; 0.7 → 0.2; 1.0 → 1.1; 1.2, 1.3, 1.4 unchanged; 1.5 → 3.1; 1.6 dropped; 1.7 and 1.8 →
1.5; 2.1, 2.2 and 2.3 → 2.1; 2.4 → 2.2; 2.5 and 2.6 → 2.3; 2.7 → 2.4; 2.8 → 2.5; 3.1 → 3.1; 3.2
and 3.3 → 3.2; 3.4 → 3.3; 3.5 → 3.4; 3.6 → 3.5; 3.7 → 3.6; 4.1 to 4.5 unchanged.

**Open question.** Architecture owner (@kravalg): should the board gain the Sign-In → Reset
Password entry-link edge and code-level `ResetPassword` / `CreateNewPassword` cards? Not
blocking.

## Revision 2026-10-08: client state in Zustand

**Trigger.** The user: "change the react state var to zustand", then "1, but firstly update the
diagrams". Option 1 is a new prerequisite chore, `zustand-client-state` (#334, filed after
this pass). It adds `zustand`, writes an ADR superseding ADR-008, removes the ESLint
`clientStateSelectors` Zustand ban and the Zustand-free assertions of
`tests/unit/tooling/state-architecture-contract.test.ts`, migrates `AuthStateVar`,
`ConnectivityStateVar` and `src/lib/state/` to `useAuthStore` and `useConnectivityStore`, and
measures the paint-path budget. Landing order: chore #332 and chore `zustand-client-state`,
then #315 → #330 → #331.

**Changes.** Diagrams first: architecture §3.2 draws the board's State as `State [Zustand]` with
the `useAuthStore` cylinder and Sign-In's existing "2 save JWT token" edge (`AuthStatePatch`),
and the epics dependency graph draws both chores as prerequisites of Wave 1. Then the text:
every `AuthStateVar` or reactive-var reference names `useAuthStore`, both chores are listed
wherever prerequisites are, and Story 1.5's `stores/index.ts` count is relative to the chore.
No story was added (the chore owns the migration); 23 stories and 277 criteria are unchanged.
TB-1 keeps its frozen "reactive-var state" wording; the PRD and the architecture note that it
now means Zustand store state.
