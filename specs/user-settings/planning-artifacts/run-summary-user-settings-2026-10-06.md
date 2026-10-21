---
status: complete
workflowType: autonomous-planning
project_name: crm
date: 2026-10-06
revised: 2026-10-21
feature: user-settings
issue: https://github.com/VilnaCRM-Org/crm/issues/330
---

# Run summary: user settings

## Bundle

`specs/user-settings/` — planning artifacts in `planning-artifacts/`, story records in
`implementation-artifacts/`. The worktree's local, gitignored `_bmad/config.yaml` points
`planning_artifacts` and `implementation_artifacts` at this bundle, so `bmalph implement` reads
it. Worktree `/home/dima/Desktop/crm-worktrees/330-user-settings`, branch
`feat/330-user-settings`, stacked on PR #340's head `f8ff83c7` (crm #315 implemented, unmerged)
over PR #333 (`db3db0f6` on `main`). Until the 2026-10-16 reconciliation it lived in the worktree
`/home/dima/Desktop/crm-worktrees/user-settings-planning`, branch `docs/user-settings-planning`,
based on `origin/main` `58099168`.

## Task framing

Plan the **User Settings** feature of the crm `user` module, but only the parts user-service has
a backend for. Inputs: the Miro board (widget `3458764570351803375` and the User/Auth diagram
`3458764570351764591`) and the Figma section `6242:41691` (frame `313:10242` and its variants).
The plan follows the crm architecture: bulletproof-react modules, classes outside React
components, DI composition roots, type-only files and the route registry. It is GraphQL-only
against user-service. A GitHub issue is created once the chain passes readiness, and the
user-service gaps are filed as separate issues.

User decisions carried into the run:

- Plan only what has a backend.
- Every success toast gets an error counterpart.
- The settings password block is also the design of record for crm #315's new-password field,
  so the two features share one field and one policy.
- After the bundle is finished, one Opus review pass runs over it, with no further readiness
  iteration after it.

## Evidence gathered by the main agent

- **Figma.** Section `6242:41691` holds one settings page at desktop, tablet and mobile, with
  these variants: 2FA setup, 2FA connected, social accounts linked with success toasts, collapsed
  sidebar, and e-mail not confirmed. It has no error toast, avatar dialog, validation, loading or
  e-mail-change states. Tokens and contrast were checked; the greeting `#969B9D` (2.81:1) and the
  resend link `#1EAEFF` (2.46:1) need overrides.
- **Miro.** Widget `…803375` is "User settings [React component]", described as "user initials,
  changing email, changing password". Its parent, "User profile settings", fans out to User
  settings, 2FA and Social networks. At code level, `UserProfileSettings` links to
  `RestorePassword`.
- **user-service.** The pinned v2.8.0 already has `user(id)`, `users`, `updateUser` and
  `resendEmailToUser`, and they are byte-identical on `main` (`a95c1e85`). v2.8.0 has no
  authentication; owner-scoped security and Bearer JWT exist on unreleased `main` only. Avatar
  storage and social link/list/unlink exist nowhere.
- **crm.** No route, toast, avatar or `Authorization` header exists, and the client never learns
  the user id. The `no-cross-feature-imports` rule blocks reuse of `@auth` internals from a sibling
  feature.
- **Coordination.** The 2FA planning session (crm #331) agreed:
  - shared `/settings` shell ownership: whichever bundle lands first builds it;
  - the 2FA card lives inside `features/settings`;
  - the Bearer link (shared); the toast is built and used by settings alone (R16);
  - the 401 sign-out rule, with rule (a) refined by R21;
  - the mock's context-function 401 (R20, 2FA MD-25) and the shared normalizer, mock and msw
    names (R22);
  - agreed after readiness iteration 3 (R23, 2FA architecture §6.8): the normalizer carries no
    `@injectable()` (withdrawn 2026-10-16: #315 shipped it `@injectable()` in the gated
    `src/modules/user/transformers/`), and the literal-equality test is written by whichever
    bundle first has both literals;
  - one shared upstream error-code issue.

## Subagent Execution Log

| Phase                 | BMAD command               | Model | Artifact / output                   |
| --------------------- | -------------------------- | ----- | ----------------------------------- |
| Input: backend        | `analyst`                  | Opus  | user-service v2.8.0 vs `main` diff  |
| Input: Miro           | `analyst`                  | Opus  | Miro report (screenshots)           |
| Input: crm state      | `analyst`                  | Opus  | crm current-state report            |
| Research              | `analyst`                  | Opus  | research artifact                   |
| Product brief         | `create-brief`             | Opus  | brief artifact                      |
| PRD                   | `create-prd`               | Opus  | PRD artifact                        |
| Architecture          | `create-architecture`      | Opus  | architecture artifact               |
| Architecture review   | `validate-architecture`    | Opus  | claims checked, design trimmed      |
| Epics                 | `create-epics-stories`     | Opus  | epics artifact: 4 epics, 34 stories |
| Readiness, iter. 1    | `implementation-readiness` | Opus  | FAIL 0/1/6/14 (C/H/M/L)             |
| Correction pass       | `correct-course`           | Opus  | H1, M1-M6, L1-L14, R18, R19         |
| Readiness iteration 2 | `implementation-readiness` | Opus  | PASS 0/0/3/6                        |
| Correction pass 2     | `correct-course`           | Opus  | N1–N9                               |
| Readiness iteration 3 | `implementation-readiness` | Opus  | FAIL 0/1/1/5                        |
| Correction pass 3     | `correct-course`           | Opus  | T1–T7                               |
| Final review          | `validate-*`               | Opus  | PASS 0/0/1/12 found, all fixed      |
| Revision 2026-10-08   | `correct-course`           | Opus  | Miro layers, TB-1, 35 stories       |
| Verification 10-08    | `correct-course`           | Opus  | F3-F5, F7, F9-F12, F15-F18, F21     |
| Simplification 10-08  | `correct-course`           | Opus  | review items 1-10, 25 stories       |

## Decision register

Every artifact cites these ids. `U` ids are binding user decisions, `D` ids are the main agent's
decisions, `R` ids amend the `D` ids they name after research, review or agreement with the 2FA
planning session, `P` ids settle the product questions research §8.2 raised, and `M` ids record
the 2026-10-08 Miro layer contract (M2 is rule TB-1).

| Id   | Decision                                                                                                            |
| ---- | ------------------------------------------------------------------------------------------------------------------- |
| U1   | Plan only what user-service has a backend for; GraphQL only, never REST                                             |
| U2   | Every success toast has an error counterpart with the same layout                                                   |
| U3   | The settings "Пароль" block is #315's design of record: one password field, one policy                              |
| U4   | Mock only operations that exist verbatim upstream; mock errors carry `extensions.code`                              |
| U5   | Superseded by R28: flag off in production, on in the test stack (dev keeps the block)                               |
| U6   | Secret-bearing mutations: `no-cache`, minimal selection, abort check, no automatic retry                            |
| U7   | crm conventions: classes, type-only files, DI tokens, approved suffixes, rca caps                                   |
| U8   | Plain DDD vocabulary; GoF names only with a second implementation; no catalogue                                     |
| U9   | Prefer existing components; every repo claim carries a checked `path:line`                                          |
| U10  | ADR-021; Deciders @kravalg (superseded 2026-10-16: README decisions, no ADR, `[no-adr]`)                            |
| U11  | Accessibility overrides design: text under 4.5:1 is overridden, not copied                                          |
| D1   | v1 scope: `/settings` profile card (name, e-mail + resend, password), toasts, 2FA slot                              |
| D2   | No avatar upload and no social networks section (no backend); decorative monogram                                   |
| D2a  | 2026-10-21: the social networks card renders UI-only with no actions; linking stays out (G6)                        |
| D3   | No app-shell navigation; one flag-gated home link to `/settings`, shared with 2FA                                   |
| D4   | Current user from `users(first: 1)`; its IRI `id` addresses both mutations                                          |
| D5   | No pending schema extension: every operation used is in pinned v2.8.0                                               |
| D6   | Current password on every Save; only changed fields; e-mail by normalised diff                                      |
| D7   | One success toast per changed aspect; the form adopts the returned user                                             |
| D8   | Errors become crm field errors or toasts; never server text verbatim                                                |
| D9   | New `src/components/ui-toast`: polite success, alert errors, max 3                                                  |
| D10  | Bearer header on GraphQL; automatic sign-out only under the shared 401 rule                                         |
| D11  | New `settings` feature; #315's shared pieces move out of `@auth`; prerequisite P.1                                  |
| D12  | Superseded by R28: #330 owns route, shell and link; the mock keeps no auth rule                                     |
| D13  | Flag `userSettings` declared everywhere a flag must be                                                              |
| D14  | Copy translated to `uk` and `en`; real subtitle; sections named for content                                         |
| D15  | Superseded for the greeting 2026-10-21 (D15a): contrast overrides: greeting `#57595B`, resend link `#0074B5`        |
| D15a | 2026-10-21: the greeting keeps `#969B9D` under a scoped `#settings-greeting` exception; resend link stays `#0074B5` |
| D16  | Withdrawn 2026-10-08 (R28): no security signal for a rejected current password                                      |
| D17  | Password change revokes other sessions upstream (main); no client logic depends on it                               |
| D18  | Page-level skeleton while loading; read failure shows a retry                                                       |
| R1   | Fence languages `text`, `ts`, `mermaid`, `json`, `bash` (MD040 rejects `graphql`)                                   |
| R2   | Upstream cited as `M:`/`T:` base + path + `#L` anchor                                                               |
| R3   | Wrong current password recognised by its en and uk message, never by `extensions.code`                              |
| R4   | The Bearer link does not grow `src/modules/user/config/di.ts` beyond its function cap                               |
| R5   | The scaffolder writes `USER_TOKENS`; the scaffold story fixes the wiring by hand                                    |
| R6   | Flags are read at render time, never while the router is built                                                      |
| R7   | The page owns its load state; `UIAsyncSection` does not fit                                                         |
| R8   | Field-error text contrast fixed at its source token                                                                 |
| R9   | 2FA reports outcomes in its card; settings is the toast's only consumer                                             |
| R10  | Mock answers a tokenless settings call with "Access Denied." and `FORBIDDEN`                                        |
| R11  | Bearer link `SessionLinkFactory` in `@auth/repositories`, composed in the module `di.ts`                            |
| R12  | 2FA status travels in `ProtectedOutletContext`; settings adds nothing to it                                         |
| R13  | Superseded by R28: the mock reads no token (was: one mock token rule)                                               |
| R14  | Eager growth is the route declaration and gate only; no toast auto-dismisses                                        |
| R15  | Superseded by R28: no mock token, no `mock-expired-token` (was: 2FA agreed R13)                                     |
| R16  | The toast is built and used by settings only                                                                        |
| R17  | Superseded by R28: scalar `flag` + `RouteFlagGate`; shared failure types; link session end                          |
| R18  | One `access_denied` reason; "Access Denied." tested with no extensions and with status 403                          |
| R19  | Shared pieces keep one name and behaviour; normalizer rows append-only; `error.text` token                          |
| R20  | Superseded by R28: no mock expired-token 401 (the mock reads no token)                                              |
| R21  | Superseded by R28: a transport 401 alone ends the session (was: link rule (a))                                      |
| R22  | Superseded by R28: a transport 401 alone ends the session; shared mock and msw names                                |
| R23  | ~~Undecorated normalizer~~ (withdrawn 2026-10-16); status-less 401 is no session end; equality test once both exist |
| R24  | Superseded by R25: the two-class Data provider box is withdrawn (verification F5)                                   |
| R25  | Superseded by R28: one `ProfileProvider`, three `@inject`, no deps bag or closure                                   |
| R26  | #315's one `UserServiceFailure`, `FieldViolation` path and reason; members only appended                            |
| R27  | Superseded by R28: settings adds no registrar closure; the link's `SessionLinkDeps` adds one (4 of 6)               |
| R28  | Simplification 2026-10-08: one owner per shared piece; no signal; one Transformer; scalar                           |
|      | `flag`; transport 401 alone ends a session; stateless mock; no glue hook or queue class                             |
| M1   | Miro board layers only: route, component, hook, Data provider ⇄ Transformer, Repository                             |
| M2   | TB-1: named types at every layer boundary; collections as `*Set`; gate in chore #332                                |
| M3   | Client state in Zustand stores (`useAuthStore`); chore `zustand-client-state` lands first                           |
| P1   | v1 accepts the current password for a name-only change (G4 asks upstream)                                           |
| P2   | No special handling for OAuth-created users in v1                                                                   |
| P3   | Password success toast uses the design copy only                                                                    |
| P4   | Resend is disabled only while in flight; client throttling is a follow-up                                           |
| P5   | Wrong-password classification matches en and uk text; no request-language pinning                                   |
| P6   | Superseded by R28: the mock reads no token                                                                          |

## GitHub issues

"Prod" means the issue blocks production enablement only; nothing upstream blocks implementation.

| Issue          | What it asks                                            | Blocks |
| -------------- | ------------------------------------------------------- | ------ |
| crm #330       | This feature: 25 stories in four epics, 13 follow-ups   | n/a    |
| us #513 (note) | Release `main`'s authentication surface (G1)            | Prod   |
| us #514        | CORS must allow `X-Request-Id` and `X-Correlation-Id`   | Prod   |
| us #515        | A `me` query (G2)                                       | no     |
| us #516        | Own unchanged e-mail rejected by `updateUser` (G3)      | no     |
| us #517        | Current password checked against the new-password rules | no     |
| us #518        | Profile changes without the password; social-only users | no     |
| us #519        | Avatar storage and upload (G5)                          | no     |
| us #520        | Link, list and unlink social providers (G6)             | no     |
| us #521        | GraphQL `updateUser` and `deleteUser` skip the limiters | no     |
| us #522        | Stable `extensions.code` on GraphQL errors (G8, 2FA)    | no     |

`us` is VilnaCRM-Org/user-service. Prerequisites for implementation: P.2: PR #333 merged
(chores #332, #334); P.1: this branch stacked on PR #340 (crm #315 implemented).

## Revision 2026-10-08

**Why.** The user asked: "all data that transferred between layers(classes) should be strictly
typed. Please add the rule that forbid to use plain arrays/anonymous objects - only named and
typed classes/interfaces and update the architecture diagrams, check that your architecture
strictly follows the Miro board architecture. Because we haven't mentioned any services and
controllers in architecture as I remember". The shared contract
`crm-worktrees/_planning-shared/miro-layer-contract.md` records the board extraction, the layer
map, the per-bundle dispositions, the canonical TB-1 text and the diagram conventions for the
crm bundles #315, #330 and #331.

**What changed.**

- PRD: NFR-14 (TB-1, verbatim, with acceptance) and NFR-15 (Miro layer alignment); P.2; the
  requirements that named a repository as the deciding layer now name the Data provider.
- Architecture: §1.1 Miro alignment, §1.2 TB-1, §3 L1 to L4 diagrams in the board's style, §4
  sequences with stereotypes and a named type on every message, §6 and §6.1 rewritten so no
  inline object, tuple, bare array, `Record` or inline derived type crosses a layer, §7 hooks in
  place of the controller, §17 Miro conformance.
- Epics: Story 1.7 extends #315's `UserServiceErrorTransformer`, 1.9 adds a key to #315's
  `SignInNotice`, 2.5 builds `ProfileFailureTransformer`, 2.6 `GraphQLProfileRepository` and
  `GraphQLProfileTransformer`, the new 2.7 `ProfileProvider` with `ProfileFailureProvider`, 3.4
  the hooks `useUserProfileSettings`, `useProfileSave` and `useEmailResend`; TB-1 criteria on
  every story that adds a type crossing a layer; P.2 on the stories that need the gate.
- Research: three statements aligned (suffixes, feature folders, where 401s are decided). Brief:
  unchanged.

**Miro findings.** The board's frontend frames use `[component]<route>`, `[component]`, React
hook, `[Data provider]`, `[Transformer]`, `[Repository]`, `Mutation [GraphQL]`, State and
`[type]` boxes only. "Controller" appears only in the Structurizr Internet Banking sample, as
server-side Spring MVC REST controllers; "service" appears only as backend containers (User
service, Notification service). The code-level User module frame supplies the names
`UserProfile`, `UserProfileSettings`, `RestorePassword`, `UserEntity` and
`RestorePasswordDTO`.

**Deviations from the contract and new risks** are listed in the readiness report's 2026-10-08
section: the component-level `PasswordRuleViewSet` and the dependency on #315's Epic 0
(Stories 0.1–0.6) and shared names. The first pass also had a two-class Data provider (R24)
and open element names; the verification pass below removed both.

**Verification pass (same day).** An independent verification
(`crm-worktrees/_planning-shared/verification-2026-10-08.md`) found 6 major and 15 minor
findings across the three bundles; this bundle applied every one attributed to #330, with
decisions D1 to D10 adopted as final:

- **F5 (major).** One `ProfileProvider` with a named `ProfileProviderDeps` (Repository, both
  settings Transformers, `UserServiceErrorTransformer`, `SecurityEventRecorder`) from one
  `useFactory` closure; `ProfileFailureProvider`, `settle<TData>` and `settlement.ts` are gone,
  so there is no Provider → Provider edge and no generic Data-provider method (R25; A §3.3, §4,
  §5.1, §5.11, §6, §6.1, §8, §10, §12, §13, §14, §17; E 2.7).
- **F3 / D6 (major).** Registrar arithmetic stated once and identically: closures 3 → 4 (#315)
  → 5 (#331) → 6 (#330), the cap (R27; P NFR-2, A §6, E AR-4); every story criterion now states
  the closures it adds (E 1.7, 1.8, 2.5, 2.7) instead of an absolute count.
- **F4 / D1 / D2 (major).** #315's one `UserServiceFailure` interface and
  `UserServiceFailureReason` union, `FieldViolation` (`path`, `reason`) with `'other'` from
  #315 and `'taken'` appended; the `http` and `graphql` variants and `UpstreamReason` are gone;
  rules 3a (transport 401) and 7a (message table) and rule 6's appends are added to #315's
  rules 1 to 9 (R26; A §5.4, §5.5, §6.1, §13; E 1.7, 1.8, 2.5). Rule 7a sits between #315's
  rules 7 and 8, because a row after rule 8 never sees "Access Denied." with status 403; the
  #315 owners are told (E "Points" 18).
- **F9.** The phantom DI-policy prerequisite is removed: the Transformer's import is admitted
  once `transformers/` joins `LOGIC_SOURCE_GLOBS` (A §5.2; readiness risks).
- **F10 / D7.** The prerequisite named everywhere (P, A, E, R, S); since the simplification pass
  it reads "chore #332 (typed-boundaries gate) → #315 Epic 0 (Stories 0.1–0.2)", and since the
  client-state pass it also names the chore `zustand-client-state`.
- **F11 / D3, F12 / D4.** `FeatureFlagRef` (`name`) beside `FeatureFlag` and the page at
  `settings/routes/user-profile/` stated as decided, not "first lander fixes" (A §5.6, §6.1; E
  1.5; readiness D-3).
- **F15, F16.** Sequences 4.3 and 4.4 route through the Repository, 4.1 and 4.2 show the
  failure path, page-local `ProfileFormState` and the toast queue leave the State cylinder, and
  every L2, L3 and L4 edge is labelled with a named type (A §3, §4).
- **F7.** The refined TB-1 block copied byte-identically into P NFR-14 and A §1.2.
- **F17, F18, F21.** `Factory` in NFR-15's suffix list; the `PasswordRuleView` comment says
  "new component-level types"; the readiness claims on variants and registrar counts corrected.
- **Shared shapes.** `SignInNoticeProps` (`notice: ArrivalNotice | null`) with `session_ended`
  appended (A §5.5, E 1.9); `useAbortableSubmit` members taken from #315 §6.4 and §6.5 (A §7.3,
  E 3.4); the D5 names listed under P.1 (settings uses none).

Not applied here, because they belong to the other bundles: F1, F2 (cited as a #315 Story 0.2
dependency), F6, F8, F13, F14, F19, F20.

**Shared User domain pass (same day).** The user asked to apply the shared domain model "but also
do not over-engineer, its just front-end features without any logic, its all in the back-end
side", and gave the board's `RestorePasswordDTO` to #315's forgotten-password flow. Applied
from contract §3.5 and TB-2 and `ddd-domain-check-2026-10-08.md` (R330-1 to R330-6):
`UserEntity` is imported from #315 Story 0.7 and P.2 ends at Story 0.7; the `UserProfile` page
loads it and passes it to `UserProfileSettings` as itself; the password section is
`ChangePassword` over the plain `PasswordChange`; `UserNodeDto` is `UserNode`; TB-2 sits beside
the unchanged TB-1 (P NFR-14, A §1.2); A §2.4 lists the board types, §17.3 adds G-5 and C-5;
13 TB-2 criteria land in E. Details and checks: the readiness report's last section.

## Simplification 2026-10-08

**Why.** The over-engineering review
(`crm-worktrees/_planning-shared/over-engineering-review-2026-10-08.md`) found glue, invented
telemetry and "build if absent" branches. The user: "apply all 10"; "we should use only
repositories to access data but with graphql, not the REST, we use only graphql"; "do not
over-engineer, its just front-end features without any logic, its all in the back-end side";
`src/services/*` is the bulletproof-react layout and not part of this topic; the TB-1 gate is
chore #332 (draft PR #333, branch `chore/typed-boundaries-gate`), which lands first.

**What changed (R28).**

- Prerequisites: chore #332 (typed-boundaries gate) → #315 Epic 0 (Stories 0.1–0.2), then #315
  merged. The landing order #315 → #330 → #331 gives every shared piece one owner; this bundle
  builds the shell, route, gate, link, notice, `UIForm` props, `error.text` token and home link,
  and imports #315's pieces.
- Data path: `ProfileProvider` with three `@inject` collaborators, one `GraphQLProfileTransformer`
  (with `invalid` and `failed`) beside #315's `UserServiceErrorTransformer`, and the GraphQL
  Repository; no deps bag and no registrar closure. #330 appends the `401` status row, its input
  properties with `taken`, and the first exact-message step ("Access Denied." and the two
  wrong-password rows) to #315's classifier.
- Gone: FR-23 and the `profile_update` signal, `ProfileFailureTransformer`, `ToastQueueStore`,
  `useUserProfileSettings`, the `ToastRequest` mapping, the aborted and per-operation failure
  types, `FeatureFlagSet` (now a scalar `flag`), the link's rule (b) and body reading, the
  stateful mock with its token rule, the msw literal test and the drift register, and the dev
  compose flag (no dev flag transform exists after #315's simplification).
- Counts: classes 7 → 5, hooks 6 → 5, named types 69 → 47, stories 35 → 25, criteria 366 →
  251, DI tokens 5 (+1) → 3 (+1), closures 1 → 0.

**Story ids** (old → new): 1.1 to 1.7 keep their ids; 1.8 and 1.9 → 1.8; 1.10 and 1.11 → 1.9;
1.12 withdrawn (its scrubber in 2.3); 2.1 and 2.2 → 2.1; 2.4 to 2.6 → 2.2; 2.7 → 2.3; 2.3 →
3.3; 3.1 and 3.2 keep their ids; 3.4 → 3.3; 3.3, 3.5 and 3.6 → 3.4; 3.7 → 3.5; 3.8 → 3.6; 3.9
→ 3.7; 4.1 to 4.5 keep their ids; 4.6 and 4.7 → 4.6.

**Not applied as the review wrote it:** `ClearButton` stays a child component (it needs
`UIForm`'s form context); the `session_ended` notice stays with #330, whom the contract and the
two-factor bundle name as its owner. Checks: the readiness report's last section.

## Client state 2026-10-08

**Why.** The user: "change the react state var to zustand", then "1, but firstly update the
diagrams". Option 1 is a new prerequisite chore, `zustand-client-state` (#334): it adds
`zustand`, records an ADR superseding ADR-008 (it landed as ADR-002's "Current rules"), removes the zustand ESLint ban and its contract
test, replaces `AuthStateVar`, `ConnectivityStateVar` and `src/lib/state/*` with Zustand stores
and measures the paint budget. Landing order: the chores #332 and `zustand-client-state`, then
crm #315, #330 and #331.

**What changed (M3).**

- Diagrams first: State is drawn `State [Zustand]` (`useAuthStore`, a Zustand store) in A §3.2,
  and the session end is `SessionLinkFactory` → `useAuthStore.setState(AuthStatePatch)` in A
  §4.1 and §4.4; E's dependency graph root names both chores.
- Text: P, A, E, the readiness report and this summary name the new chore beside #332 and
  replace every reactive-var reference. `SessionLinkFactory` injects `AUTH_TOKENS.AuthStore`
  (`useAuthStore` by value, typed `StoreApi<AuthState>`), reads `getState().token` and writes a
  module-private signed-out `AuthStatePatch`; Story 1.8's criteria follow. The token stays
  memory-only with no `persist`; the toast queue stays a local reducer. No migration story.

Checks: the readiness report's last section.

## 2026-10-16 reconciliation

**Why.** The bundle was written on 2026-10-06 and revised on 2026-10-08 against `origin/main`
`58099168` and against the plans of crm #315 and the Zustand chore, not their code. Both now
exist: PR #333 (the chores #332 and #334) is merged as `db3db0f6`, and #315 is implemented on PR
#340 (head `f8ff83c7`, unmerged). The bundle now lives in the worktree
`/home/dima/Desktop/crm-worktrees/330-user-settings`, branch `feat/330-user-settings`, stacked on
that head. Three read-only inventories (pieces #315 built, claims about `main`, bmalph structure)
compared every story, criterion, file list and architecture section with the branch; this pass
applied them. The user, the same day: ADR content "can be written in a README or nowhere";
landing order #315 → #330 → #331 with ownership unchanged; no further readiness iteration;
"2fa have its own page" (Figma `72:4846`).

**What changed, by cause.**

- **No ADR.** PR #333 deleted every ADR from 003 up. FR-30, NFR-13, Story 1.2 (now "Record the
  User Settings decisions in the user module README"), Story 4.6, Follow-ups 5.1 to 5.3 and A §14
  record the decisions as a `## User Settings decisions` section of `src/modules/user/README.md`
  after #315's `## Password recovery decisions`, with a `[no-adr]` line in the pull-request body
  for `make check-adr-drift`. Every ADR-008/016/017/019/020/021/022 reference now names ADR-002
  "Current rules", `docs/ui-toolkit.md`, the eager-MUI walk of `performance-serving.test.ts`,
  #315's README section, #331's bundle or CLAUDE.md "Typed boundaries"; U10 is superseded.
- **P.1 and P.2 are real.** P.2 says PR #333 merged; P.1 says the branch stacks on PR #340 and
  lists #315's pieces under their real paths and signatures. The "correct-course pass if #315
  changes" rule now applies only if #340 changes before it merges.
- **Story 1.1.** Lists #315's real shape: `FormField` already has `describedBy` (ids keep #315's
  order), `PasswordPolicyRules` evaluates and translates itself, `ServerFieldError` delegates to
  `@auth/hooks/use-server-field-error.ts`, `password-policy-rules-styles.ts`, the story-coverage
  `EXEMPT` entry, `createChecklistGate`, and the full caller and test list. The `password_policy.*`
  keys leave #315's lazy recovery catalog for a lazy catalog the moved component owns.
- **Story 1.4.** No flag exists (`FeatureFlag = never`, issue #309); `userSettings` is the first,
  and the compose `:-true` must-fail is new rather than copied.
- **Story 1.6.** The settings copy is a lazy catalog (registered through the shared
  `lazyCatalogLoader` that replaced #315's `RecoveryCatalogLoader` and this plan's two copies on
  2026-10-19, AR-2's accepted exception), because the merged catalog
  lands in the eager `index.js` and `/sign-in` has no mobile Lighthouse headroom. Only
  `ui_toast.close`, `home.settings_link` and `sign_in.notices.session_ended` stay eager
  (amended 2026-10-21: `ui_toast.close` is lazy too, owned by `src/components/ui-toast/`; only
  the other two stay eager).
- **Story 1.7.** The transformer lives in `src/modules/user/transformers/` and stays
  `@injectable()` (R23's "undecorated" part withdrawn with its must-fail). The steps are the six
  #315 shipped; the exact-message step sits between steps 4 and 5; the rows are data maps;
  `failure` takes a `FieldViolation | null`, because a fourth argument breaks the 3-argument cap;
  the README amendment of #315's "no message text" decision is recorded by Story 1.2, which 1.7
  now depends on.
- **Story 1.8.** `ProtectedRoute` reads `useAuthToken()` and needs a `useRef` to tell a lost
  session from a cold visit; the session end mirrors `logout()` (sandbox demo session included,
  third collaborator); `RequestPasswordReset` and `ConfirmPasswordReset` are anonymous; the
  notice gets a `SignInNoticeRow` with an `info` tone instead of #315's green check.
- **Epic 2.** The mock merges per key and shares #315's `rejectViolation` and `EMAIL_REGEX`
  through a new `violations.ts`, with a `PROFILE_SDL_FIXTURE`; msw uses per-test helpers
  (`profile-operations.ts`); the settings repositories get an `index.ts` barrel
  (`no-repository-internal-imports`); `buildUserNode` delegates to `buildGraphqlUser`;
  integration tests sit flat under `features/settings/`.
- **Epic 3.** `useAbortableSubmit` has no `retry` and needs a stable `run`; the new password wraps
  `passwordValidator.create(t)` so an empty value passes; the rejected new password gets
  `settings.errors.new_password_rejected`; the e-mail field reuses sign-up's label, "E-mail" since
  #311; Story 3.2 adds `settings-layer-edges.test.ts` for the AR-8 edges no dependency-cruiser
  rule covers.
- **Epic 4.** Lighthouse audits eight URLs; `A11Y_EXCEPTIONS` holds eight entries (nine after
  the 2026-10-21 `#settings-greeting` amendment); the e2e
  precedent is #315's `answer` helper; the test stack's production build never restores a demo
  session.
- **2FA has its own page.** Figma `72:4846` is the sign-in challenge, #331's own public route;
  `/settings` keeps only the slot for the 2FA settings card (FR-3, A §5.7, Story 1.6).
- **Structure for bmalph 2.11.0.** Every criterion is one physical line (bmalph joins wrapped
  lines with ", ", which garbled 13 quoted UI strings); no `**` in a criterion; the leading
  "Goal: " of the epic paragraphs is gone; dependencies are stated against story ids, the order
  bmalph sorts by. Stories: 25 before and after, same ids and order; criteria: 251 before, 272
  after this pass, 280 after the verifier pass below, 282 after the second verifier pass.
- **Kept.** The TB-1 blocks of PRD NFR-14 and A §1.2 are byte-identical (sha256
  `eb676341eb864e85…` over the 70 lines plus a trailing LF); a note under each records that the
  shipped gate is wider. Ownership between the #330 and #331 bundles is unchanged.

**Verifier pass (same day).** Independent code-truth, parser and consistency checks against the
branch found suites that pin today's state and that the stories did not list; each was re-checked
in the code and fixed. No story, epic, section or class was renamed; one section was added (PRD
§13) and one architecture decision reworded (A §14, below).

- **Story 1.4** lists the four suites that pin an empty flag set:
  `tests/bats/render_app_config.bats` (with CI `make test-bats` in its gates), the committed-shell cases of `render-app-config.test.js`,
  `feature-flag-service.test.ts`, and `tests/integration/config/runtime.integration.test.ts` (a
  focused `TEST_ENV=integration` gate); two criteria pin "Known flags: userSettings." and the
  `{ userSettings: false }` snapshot. A §5.14 names the same suites.
- **Stories 1.1 and 1.6** list `tests/unit/scripts/localization-generator.test.js`, which pins the
  policy's catalog list with `toEqual` (two catalogs after 1.1, three after 1.6).
- **Story 1.1** and A §5.9: `UIPasswordField` gains an optional `sx` forwarded to its
  `UIFormField`, because `FormField` puts `formFieldWrapper` on the grid inside every password
  field (the second sibling on sign-in, the first field on `/password-reset`); every auth caller
  passes it to both components, and two criteria pin the forwarding and the kept margin.
- **Story 1.5** and A §5.6: the composer emits the gate only when a route declares `flag`, so a
  flag-free registry composes PR #340's tree; `RouteValidator` rejects a flagged registry with no
  route at `ROUTE_PATHS.notFound` and a nested `flag`; `route-composer.test.tsx` finds the guard by
  its `ProtectedRoute` element and `route-validator.test.ts` gains the two rejections.
- **Story 1.6** lists `tests/unit/routes/registry.test.ts` (ids `app.shell`, `user.auth`,
  `user.settings`, plus a settings-contract case) and a `route-paths.test.ts` case.
- **Story 3.4** makes `create-settings-locale-i18n.ts` also register the `password_policy.*`
  catalog through `lazyCatalogLoader` and adds a criterion that the rule labels render translated; the DoD and A §5.16 say so.
- **2FA challenge is unflagged.** A §5.6 and §5.7 no longer put #331's challenge behind
  `RouteFlagGate`: it is an always-registered public route that reads no flag (2FA FR-12), and
  `/settings` is the gate's only flagged route.
- **Message rows.** A §14 "Settings appends rows to the two-step classification, and amends it for
  five texts" now says three rows sit in the exact-message step and the two uniqueness texts are
  read in step 4; A §15.2 says "three rows and the two uniqueness texts of step 4". The 2FA
  bundle's epics line 90 still says "its five rows" and should adopt the same wording when that
  bundle is next edited.
- **PRD.** FR-21's anonymous set names #315's `RequestPasswordReset` and `ConfirmPasswordReset`,
  as FR-19 does. A new `## 13. Out of scope`, appended so no cited section number moves, clears
  bmalph's preflight W6: `.ralph/PROJECT_CONTEXT.md` now gets a scope section (preflight reports
  W3 and W7 only, as for #315's bundle).
- **This summary.** "Bundle" names the current worktree, branch and base; the prerequisite line
  under "GitHub issues" reads P.2 merged, P.1 stacked on PR #340.

**Second verifier pass (same day).** Ten findings, all re-checked in the code or the artifacts
and fixed. Renames: Story 2.1's role is now "a developer running the local `make start-prod`
stack" (was "the dev stack"); a new test helper `publicLevelOf(tree)` is named in Story 1.5 and
A §5.6. No story, epic, section or class was renamed.

- **No field-error baselines exist.** No visual spec submits an invalid form (sign-in, sign-up
  and the mobile lane snapshot resting pages; the password-recovery spec its forms, the sent
  step, the invalid link and the notice; submit-loader and registration-notification submit
  valid data). Story 1.3 now expects zero visual diffs (its re-recorded baselines, its
  own-pull-request assumption and its re-record criterion are gone); the DoD, E NFR-3, Story 4.5,
  P FR-25, FR-26 and NFR-3, A §5.10, the A §13.1 mapping row and A §13.2, and the brief's
  risk 7 keep the home page as the only re-baseline. The `/settings` field-error pair of Story
  4.5 is the token's first visual record; the sign-in keyboard spec pins its computed colour.
- **Gate level in `route-composer.test.tsx`.** Once Story 1.6 registers the flagged route, the
  root holds only the gate, so the real-registry cases that read `rootOf(tree).children` would
  fail. Story 1.5 adds `publicLevelOf(tree)` (descends through the gate when it is the root's
  only child) and a flagged-fixture criterion; Story 1.6 lists the test file, restates invariant
  B as "public routes sit directly under the gate route, itself directly under RootLayout" and
  adds a criterion for exactly one gate child. A §5.6 item 3 says the same.
- **Composer closure budget.** PR #340's composer already has five closures (`flatMap`, the error
  handler, two `filter`s, `map`); the gate's flag-presence `some` and not-found `find` would make
  seven. The two filters become one `for…of` partition loop (Story 1.5 files and criterion,
  A §5.6, A §12: 7 functions, 5 closures).
- **CODEOWNERS.** `make new-feature` runs the plop `feature` generator, which writes no
  CODEOWNERS entry (`plopfile.ts:462-520`); Story 1.6 no longer lists `.github/CODEOWNERS`, and
  readiness F4 carries a superseded note.
- **Stale prerequisite and R28 wording.** R §5 (P.1) and R §7 risk 2 now name the branch stacked
  on PR #340, #330 as the only builder of the link and the shell, and no dev flag renderer; the
  R reconciliation note adds those points and P6. B §1, Goal 1, the scope list, risk 9 and the
  U5 and P6 rows follow R28 (flag on in the test stack only, the mock reads no token). P's
  decisions row for P5 and P6, FR-27's text and first criterion, E's Epic 2 paragraph and Story
  2.1 name the local `make start-prod` stack instead of the dev stack, whose flag stays off; the
  A context diagram labels the mock "local stacks only".
- **P.1, not P.2.** A §12's TB-2 bullet cites `domain-type-names.test.ts` from P.1 (#315, PR
  #340).
- **Bundle.** `implementation-artifacts/.gitkeep` added, as #315's bundle has, so the directory
  `_bmad/config.yaml` names survives a commit.

Checks after the pass: `parseStoriesWithWarnings` reads 25 stories with no warning; criteria
280 → 282 (Stories 1.5 +1, 1.6 +1); the story-body audit is clean; preflight reports W3 and W7
only; `prettier --check` passes; the TB-1 blocks still hash to `eb676341…`.

**Open for the maintainer** (defaults applied): the message-row amendment of #315's decision; the
`info` tone of the session-ended notice; the lazy settings and policy catalogs; the sandbox demo
session signed out on a 401 and its token sent as Bearer; the per-rule message for the optional
new password; whether the 2FA settings card also leaves `/settings`. The readiness report's
"Reconciliation 2026-10-16" section records the checks.

**Final pass (main agent, same day).** The third verifier round left eleven findings; each was
re-checked in the code and fixed:

- Story 2.1 lists `password-reset.test.ts` and `pending-schema.test.ts` as MODIFY: both build an
  `ApolloServer` from the full exported `resolvers` (`password-reset.test.ts:40`,
  `pending-schema.test.ts:82`), so their `typeDefs` gain `PROFILE_SDL_FIXTURE`.
- Story 1.7 rewrites #315's unknown-prefix case (`user-service-error-transformer.test.ts:141`,
  `initials: too short`) to `clientMutationId: too short` and gains a criterion for the
  `initials` and `password` violations.
- Story 1.1 re-points the two `@auth/assets/eye*.svg` mocks of `auth-skeleton.spacing.test.tsx`.
- Story 2.2's folder rationale names `tests-feature-allowed-folders`.
- P FR-29 and NFR-4 and the B release-gates row name the eight unchanged Lighthouse URLs; B no
  longer promises field-error baselines; the P overview and the E overview put the old
  prerequisites in the past tense; the readiness composition-root risk names the README section
  instead of an ADR.
- E "Points for the owners" item 15 and A §15.3 points 5 and 6 record the adoptions the 2FA
  bundle needs (one `SignInNoticeRow` per new `ArrivalNotice` member, lazy `settings/i18n` keys,
  "three rows and the two uniqueness texts").

Checks: `parseStoriesWithWarnings` reads 25 stories with no warning; criteria 282 → 283 (Story
1.7 +1); preflight W3 and W7 only; `prettier --check` passes; the TB-1 blocks hash to
`eb676341…`.

## Amendments 2026-10-21 (product owner and implementation decisions)

An FR/NFR review gate compared the implementation with this bundle and flagged nine deviations.
Each is a decision already taken and implemented, so the bundle records it as a dated amendment
in place, keeping the superseded text visible; one requirement remains for each.

1. **Social networks card, UI only** (product owner). The card renders Figma-exact (desktop
   `476:46530`, tablet `386:27239`, mobile `386:27457`): "Соціальні мережі" over Google,
   Facebook, GitHub and Twitter tiles in a `<ul role="list">` labelled by the heading, each with a
   visually hidden ", linking not available yet" / ", підключення поки недоступне" status
   (`settings.social.*`, the separator in the catalog), and no working action, because
   user-service has no link, list or unlink (G6). The four brand icons moved from
   `@auth/assets/social-links/` to `src/assets/icons/social/` and are shared with the OAuth
   buttons (`oauth-providers.ts`). Supersedes the PRD §2 non-goal, D2's "no social card", UX-DR-5,
   architecture G-1, Follow-up 5.5's "PRD amendment first" and Story 1.1's "only the eye icons
   move"; new PRD FR-7a.
2. **Full-name row** (product owner). The name is a row above the "Особисті дані" `h2`, as in
   Figma `315:11316`, labelled "Ваше ПІБ" / "Your full name" (`settings.profile.full_name`), not
   the reused sign-up label; the `h2` heads only the e-mail, and the skeleton follows the same
   order (PRD FR-8, FR-28).
3. **Greeting text** (product owner). The name line greets with the first name and surname
   only: three or more words show the second word then the first ("Маслова Евгения Олеговна" →
   "Евгения Маслова"), one or two show as typed, and the monogram is built from the greeted name
   (PRD FR-7, Story 3.1).
4. **New password at rest** (product owner). The optional hint is visually hidden but stays in
   `aria-describedby`; the rules show only while the field has focus or a value, held 200 ms
   after an empty field blurs (`useBlurHold`, `RULES_COLLAPSE_DELAY_MS`); a new password equal to
   the current one is refused (`settings.errors.new_password_same`). Accessibility trade-off: the
   optional state is announced but not shown visually (PRD FR-10).
5. **Greeting colour** (product owner, carried everywhere). "Вітаємо!" keeps `#969B9D` (2.81:1)
   under the one new scoped exception `#settings-greeting`, tracked in #276; PRD NFR-6, the brief
   release gate (0 → 1), the epics DoD, NFR-6 summary and Story 4.4 now say so.
6. **Toast announcements** (implementation, accessibility-reviewed in PR #354, commit
   `69b4ffea`). No toast carries a role; a polite and an assertive always-mounted `UILiveStatus`
   region announce success and error texts with an alternating mark, and each close button is
   described by its message, because an alert created and filled in one commit is dropped by
   several screen readers (PRD FR-20, architecture §5.8, Story 1.9).
7. **Success icon colour** (implementation, commit `8f8bf93a`). The check uses `success.text`
   `#2E7D32` (4.55:1 on `#E8F4EF`); the Figma `#38B386` reaches 2.34:1, under the 3:1 non-text
   floor, so no `success.icon` token exists (PRD FR-20, architecture §5.8, Story 1.9).
8. **Toast close label lazy** (implementation, commit `cbd5344d`). `ui_toast.*` is a lazy
   catalog owned by `src/components/ui-toast/`, registered when `UIToast` evaluates through the
   one `lazyCatalogLoader`, so the label stays off the eager `index.js` of `/sign-in`; AR-2's
   list of lazy catalogs includes it (PRD FR-28, NFR-5).
9. **Mock resend** (implementation, commits `9d6337e6` and `a603705e`). The mock answers a resend
   with the seed's `id` and `confirmed: false` behind the same owner check as `updateUser`,
   because a resend never confirms (PRD FR-27, architecture §5.12, Story 2.1).

Story 2.2's `buildUserNode` delegating to `buildGraphqlUser` is unchanged: the code is brought to
the requirement, not the other way round.
