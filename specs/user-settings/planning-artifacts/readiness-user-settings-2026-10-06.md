---
status: complete
workflowType: implementation-readiness
project_name: crm
date: 2026-10-06
revised: 2026-10-16
feature: user-settings
issue: https://github.com/VilnaCRM-Org/crm/issues/330
iteration: 3
finalReview: opus
author: 'implementation-readiness checker (architect, Validate mode), autonomous run'
inputDocuments:
  - specs/user-settings/planning-artifacts/research-user-settings-2026-10-06.md
  - specs/user-settings/planning-artifacts/brief-user-settings-2026-10-06.md
  - specs/user-settings/planning-artifacts/prd-user-settings-2026-10-06.md
  - specs/user-settings/planning-artifacts/architecture-user-settings-2026-10-06.md
  - specs/user-settings/planning-artifacts/epics-user-settings-2026-10-06.md
  - specs/user-settings/planning-artifacts/run-summary-user-settings-2026-10-06.md
---

**Verdict: PASS**
(0 Critical, 0 High, 0 Medium, 0 Low remaining. The final review found 0 Critical, 0 High,
1 Medium and 12 Low and fixed all 13 in the artifacts.)

# Implementation readiness: user settings, final review

Final record of iteration 3 after the closing Opus review. Artifact keys: R research, B brief,
P PRD, A architecture, E epics (story numbers), S run summary. Repository lines are at
`origin/main` `58099168`; upstream lines at user-service `main` `a95c1e85`.

## T1 to T7 status

| Id  | Sev    | Status | Where the correction stands                                      |
| --- | ------ | ------ | ---------------------------------------------------------------- |
| T1  | High   | Fixed  | A §6 sketch, §8, §12, §13.4; E 1.7; see the check below          |
| T2  | Medium | Fixed  | A §5.4 (status-less row), §13.4; P FR-19 fourth criterion; E 2.5 |
| T2  |        |        | and E 2.6 token criterion                                        |
| T3  | Low    | Fixed  | A §5.4 rule 4 gives `other`; A §6.1 `UpstreamReason` comment     |
| T4  | Low    | Fixed  | A §7.3, §12; E 3.2 last criterion: three exits, `nexits_max` 3   |
| T5  | Low    | Fixed  | R §6.2 cites the 2FA PRD by FR id only, no line ranges           |
| T6  | Low    | Fixed  | A §7.3 cites `registration-handlers-factory.ts:35` and `:50`     |
| T7  | Low    | Fixed  | E 2.1 Files, criterion and "Depends on: 1.8"; A §15.2; E Prereqs |

- **T1 re-checked against the code.** `LOGIC_SOURCE_PATHS` is services, utils, module `store/`
  and feature `repositories|stores|utils` (`config/di-collaborator-policy.js:43-48`), and the
  gate test fails any `@injectable(` file outside it
  (`tests/unit/tooling/di-collaborator-gate.test.ts:76-83`, `:131-133`; comments are stripped
  first, so only a real decorator counts). tsyringe 4.10.0 builds a class without type metadata
  when `ctor.length === 0` (`node_modules/tsyringe/dist/cjs/dependency-container.js:292-296`).
  Nothing gives the normalizer a constructor parameter: A §6 declares only `normalize`, E 1.7
  pins "no collaborator", the link and the repository inject it by token, and 2FA §6.8 and §7.1
  state the same undecorated, collaborator-free class.
- **T4 re-checked.** `nexits_max` is 3 (`config/metrics-policy.json:8`). The planned reducer has
  three returns: `retry` and `adopt` return early, and `loaded`, `failed` and `confirm` share one
  merging return. F1 adds no action and no exit; it reuses the record `retry` already writes.

## Final review

| Id  | Sev    | Artifact §           | What was wrong               | What changed             |
| --- | ------ | -------------------- | ---------------------------- | ------------------------ |
| F1  | Medium | P FR-6; A §7; E 3.2  | retry drops status and focus | region kept; focus retry |
| F2  | Low    | A §5.13; E 1.6       | scaffold delete list partial | full delete list         |
| F3  | Low    | A §5.5, §15.3; E 1.8 | link held a 2nd 401 text     | link reads the reason    |
| F4  | Low    | E 1.6                | `CODEOWNERS` path wrong      | `.github/CODEOWNERS`     |
| F5  | Low    | R §4.4; P FR-27      | `initials` digit rule absent | `Initials.php` cited     |
| F6  | Low    | A §5.12              | `.env.example:14,39` partial | `:9,14,17,39`            |
| F7  | Low    | A §15; E; S          | R23 still "proposed"         | agreed, 2FA §6.8 (1)     |
| F8  | Low    | A §5.12, §15.3; E    | past-dispute narrative       | stated as agreed rules   |
| F9  | Low    | P and A intros       | id range stopped at R22      | `R1`-`R23`               |
| F10 | Low    | E 1.7 Files          | dangling test-path clause    | names the shared paths   |
| F11 | Low    | E 3.2                | stub order vs catch-all      | stub registered after    |
| F12 | Low    | E DoD                | `jsx-no-bind` warn unstated  | stable handler props     |
| F13 | Low    | S                    | "Fable" pass, no log row     | Opus pass, log row       |

- **F1.** A §7.1 put the loading `UILiveStatus` inside the loading branch, so every retry created
  the polite region together with its text, which most screen readers drop (the repository's
  own rule, `src/components/ui-offline-notice/index.tsx:10-12`), and the retry button unmounted
  under the skeleton, leaving focus on `body`; a retry that failed again left it there. Now one
  region stays mounted in `ProfileSection` and only its text changes; after a retry the settled
  state takes focus (the `h2` when ready, "Спробувати ще раз" through
  `src/utils/use-focus-on-mount.ts:3-13` when it fails again), and `adopt` clears the record.
  P FR-6 gains the criterion, E 3.2 the must-fail.
- **F2.** `make new-feature` also writes the feature-root page that `load: '..'` targets, a
  hooks barrel, three type files and two unit tests (`plopfile.ts:57-96`); A §5.13 and E 1.6
  named only part of the clean-up, which leaves dangling imports for `tsc`. Both now list every
  generated file to delete, the page moves to `routes/settings/index.tsx`, and the generated e2e
  spec stays.
- **F3.** E 1.8 required "Authentication required." as a link constant while A §5.5 decides
  both link rules on the injected normalizer's `reason`, so the constant was either unused or a
  second classifier beside R19's one message table. The criterion now names only the anonymous
  operation names; A §15.3 and E "Points" 13 tell the 2FA owners, whose link story keeps the
  constant.
- **F4.** The generator appends to `.github/CODEOWNERS` (`plopfile.ts:374`), not `CODEOWNERS`.
  Superseded 2026-10-16: only the `module` generator appends it; `make new-feature` runs the
  `feature` generator, which writes no CODEOWNERS entry, and `/src/modules/` already has an
  owner, so Story 1.6 no longer lists the file.
- **F5.** user-service's `Initials` constraint also rejects a leading digit
  (`M:src/Shared/Application/Validator/Constraint/Initials.php#L34-L41`); A §5.12 and E 2.2 had
  the rule, R §4.4 and P FR-27 did not.
- **F6.** `.env.example:14` is `WEBSITE_DOMAIN`; the GraphQL URL is assembled from lines 9, 14,
  17 and 39.
- **F7.** The 2FA architecture §6.8 now states the undecorated normalizer, so A §15.2, A §15.3,
  the E prerequisites, E "Points" 12 and S "Coordination" call R23 agreed. (1) Withdrawn on
  2026-10-16: #315 shipped the normalizer `@injectable()` inside the gated
  `src/modules/user/transformers/`, so the bundle no longer claims an undecorated class.
- **F8.** A §5.12 cited "the #315 readiness L22 trap", and A §15.3 and E "Points" 3 and 4 told
  how earlier disagreements were settled; they now state the rules in force only.
- **F9.** P and A opened with `R1`-`R22` while citing R23.
- **F10.** E 1.7 Files ended with "the paths the two-factor plan uses for the same tests"; the
  two paths it lists are those paths, and it now says so.
- **F11.** `overrideRuntimeConfig` registers a catch-all `page.route('**/*')` that sends every
  non-document request on with `route.continue()` (`tests/utils/override-runtime-config.ts`),
  and Playwright runs the route registered last first; a `CurrentUser` stub registered before
  it never answers. E 3.2 now registers the stub after it, which saves a CI-only e2e round trip.
- **F12.** The profile's `eslint_warnings: 0` (`.claude/react-sdlc.yml:58`) binds while
  `react/jsx-no-bind` is `warn` (`eslint.config.mjs:735`) and `src` has no inline JSX arrow
  today. The E DoD now asks for stable handler props; the closure budgets of A §7.2 are unchanged
  because a `useCallback` body is the same closure.
- **F13.** S said a Fable reviewer pass would run; the user asked for one Opus pass. S now says
  so, and its execution log records this review.

## Checks performed

- **Claims re-opened: about 140 repository citations**, the load-bearing ones first:
  - Composition root: `user/config/di.ts` (nine functions, three closures; `:20`, `:31-112`,
    `:46`, `:57-68`, `:92-97`) and `tokens.ts:1-18`.
  - Rules: 13 dependency-cruiser rules by line, read in full, and the DI policy carve-outs and
    allowed targets (`:34-48`, `:178-181`, `:251-298`, `:352-357`).
  - Routes: the route composer, mapper, registry and paths; `index.tsx:18`, `:44-66`, `:69`.
  - Session and forms: `ProtectedRoute`, `useSignOut`, `useArrivalFocus`, `UIForm` with
    `use-offline-submit.ts` and `use-ui-form.ts:11`, the auth field components and styles, the
    validators.
  - Copy, palette and a11y: the auth `uk` catalog keys, `colors.ts`, `theme.ts:98-110`,
    `axe-config.ts:27-54`.
  - Mock and data access: the Apollo mock (`server.ts`, `format-error.ts`, `resolvers.ts`),
    `jest.config.ts` roots and coverage, the msw server, the runtime-config contract test,
    `registration-api.ts` and the `create-user-mutation.ts` seam, `codegen.ts`.
  - Tooling and lanes: the scaffold templates and `plopfile.ts`, the story-coverage, paint-path,
    route-coverage, axe-scan and ESLint-policy tooling.
  - Versions and budgets: Apollo Server 4.12.2 and Client 3.14 internals, the performance
    budget, `stryker.config.mjs:30`, the Lighthouse assertions.
- **Results.** Two repository citations were imprecise (F4, F6). Every class suffix is in
  `config/class-naming-policy.js`. No new module-level singleton, GoF claim, pattern catalogue
  or settings-to-auth edge is planned. Every contrast ratio the artifacts quote was recomputed
  with the WCAG formula and matches.
- **Upstream.** `config/validator/validation.yaml` and `Initials.php` re-fetched at `a95c1e85`
  with `gh api`; one rule was missing downstream (F5). The 2FA architecture §6.7, §6.8, §7.1 and
  §8 and its epics were re-read for the shared pieces.
- **Parser.** `check-stories.mjs`: 4 epics, 34 stories, `warnings=0`. A rule check over the
  same file: 317 criteria, each starting with "Given" and holding "when" and "then", even
  backticks, no `**`, no column-0 or "given" continuation, every `Depends on` pointing backwards;
  0 problems. The FR rows of the coverage map equal the union of the stories' Requirements
  lines (0 rows differ).
- **Lint.** `prettier --check`, `markdownlint -c .markdownlint.yaml -p /dev/null` and the
  100-character check pass for all seven artifacts.

## Coverage summary

| Area                    | Count | Result                                   |
| ----------------------- | ----- | ---------------------------------------- |
| FR                      | 30    | 30 covered; map equals Requirements      |
| NFR                     | 13    | 13 covered                               |
| AR, UX-DR               | 7, 6  | DoD and named stories; Figma gate per UI |
| Stories                 | 34    | 4 epics, 317 criteria, 0 parser warnings |
| Follow-ups              | 13    | not dispatched; none parsed              |
| Repository claims       | ~140  | 2 imprecise (F4, F6), fixed              |
| Upstream files          | 2     | 1 rule missing downstream (F5), fixed    |
| Iteration-3 findings    | 7     | 7 fixed                                  |
| Final-review findings   | 13    | 0 C, 0 H, 1 M, 12 L; 13 fixed            |
| Remaining after the fix | 0     | PASS                                     |

## Residual risk (not defects)

Superseded by the Simplification pass (2026-10-08) below: #330 owns every shared piece and the
mock keeps no token rule.

- **P.1 gates everything.** Stories 1.1, 1.9 and 3.5 consume #315's pieces; a #315 change of
  name or shape before merge needs a correct-course pass on those stories.
- **Shared pieces.** Whichever of settings and 2FA lands first builds the link, normalizer,
  gate, shell, notice and mock auth; the second lander's correct-course pass must trim the
  matching stories before Ralph runs, as E "Shared pieces" states. The 2FA link story still
  names the unauthenticated text as a link constant (F3).
- **CI-only proof.** The e2e, visual, a11y, Lighthouse, bundle-size and Stryker results exist
  only in CI; the deferred DI chunk's headroom rests on a 2026-07-20 baseline
  (`config/performance-budget.json:26-31`) and is measured in the pull request.
- **Production stays off** until user-service releases `main`'s authentication surface (G1).

## Revision 2026-10-08: Miro layer contract and typed boundaries (TB-1)

**Verdict: PASS, conditional on P.2.** The revision re-checks the bundle after the user asked
that every value crossing a layer be strictly typed (no plain arrays or anonymous objects, only
named and typed classes or interfaces), that the architecture follow the Miro "Frontend C4
Architecture VilnaCRM" board, and that the diagrams be redrawn. Input: the shared contract
`crm-worktrees/_planning-shared/miro-layer-contract.md` (§1 extraction, §2 layer map, §3.2 and
§3.4 dispositions, §4 TB-1, §5 diagram conventions). Implementation additionally waits for
P.2, since the simplification pass "chore #332 (typed-boundaries gate) → #315 Epic 0 (Stories
0.1–0.2)", and since the client-state pass also the chore `zustand-client-state` (#334,
lands before #315): the TB-1 gate, the `*Transformer` suffix, `Controller` removed from the naming
policy and the burn-down in the chore; the `data-providers` and `transformers` folders and the
User domain in #315 Epic 0.

### What changed, per artifact

| Artifact     | Change                                                                      |
| ------------ | --------------------------------------------------------------------------- |
| P (PRD)      | NFR-14 TB-1 verbatim with acceptance; NFR-15 Miro alignment; P.2; FR-16,    |
|              | FR-17, FR-19, FR-22, FR-30, NFR-2, NFR-5, NFR-12 name layers, not a repo    |
| A (arch.)    | §1.1 Miro alignment, §1.2 TB-1, §3 four board-style diagrams, §4 five       |
|              | sequences with stereotypes and named types, §6 and §6.1 rewritten, §7 hooks |
|              | replace the controller, §9, §10, §12 updated, new §17 Miro conformance      |
| E (epics)    | P.2 prerequisite; Stories 1.7, 1.9, 2.5, 2.6, 3.4 rewritten; new 2.7; TB-1  |
|              | criteria on 1.1, 1.5, 1.7, 1.9 to 1.11, 2.3 to 2.7, 3.1 to 3.9; 4.7 sweep   |
| R (research) | three statements that contradicted the design (suffixes, folders, 401s)     |
| B (brief)    | unchanged: no statement contradicts the revised design                      |
| S (summary)  | revision log row, decision rows M1, M2 (TB-1), R24                          |

### Classes renamed, removed or added

| Before (2026-10-06)            | After (2026-10-08)                          | Board layer   |
| ------------------------------ | ------------------------------------------- | ------------- |
| `ProfileFormController`        | `useUserProfileSettings`, `useProfileSave`, | React hook    |
|                                | `useEmailResend` over `useAbortableSubmit`  |               |
| `ProfileFailureHandler`        | `ProfileFailureTransformer` (pure)          | Transformer   |
| `ProfileRepositoryImpl`        | `GraphQLProfileRepository` (transport only) | Repository    |
| its `toInput`, `toProfile`     | `GraphQLProfileTransformer`                 | Transformer   |
| (none)                         | `ProfileProvider` (one class, see below)    | Data provider |
| `ProfileRepository` interface  | removed: one implementation (U8)            | —             |
| `UserServiceErrorNormalizer`   | `UserServiceErrorTransformer` (#315)        | Transformer   |
| `useProfile`, `useProfileForm` | `useProfileLoad`, `useUserProfileSettings`  | React hook    |
| page `Settings`                | `UserProfile` (route stays `/settings`)     | route         |
| `ProfileSection`               | `UserProfileSettings`                       | component     |
| `PasswordSection`              | `RestorePassword`                           | component     |
| `Profile`, `ProfileAdoption`   | `UserEntity`, `UserEntityAdoption`          | type          |
| (none)                         | `RestorePasswordDto`                        | type          |

### Miro findings that bind the design

- The board's frontend vocabulary is `[component]<route>`, `[component]`, React hook,
  `[Data provider]`, `[Transformer]`, `[Repository]`, `Mutation [GraphQL]`, State, `[Decorator]`
  and `[type]` (`*DTO`, `*Entity`). "Controller" appears only in the Structurizr "Internet
  Banking System - API Application" sample, as server-side Spring MVC REST controllers;
  "service" appears only as backend containers ("User service container", "User service
  [Container: PHP & API Platform]", "Notification service"). The plan therefore has no
  frontend Controller, Service or Handler class (A §17.3 C-1).
- The code-level User module frame fixes the names: `UserProfile [component]<route>` →
  `UserEntity`, `UserProfileSettings`, `2FASettings`, `SocialNetworks`;
  `UserProfileSettings` → `UserEntity` and → `RestorePassword` → `RestorePasswordDTO`. All are
  used; `SocialNetworks` and the component-level "User profile" menu are named gaps (A §17.3
  G-1, G-2).
- `State [Redux]` is drawn `State [Zustand]`, the `useAuthStore` Zustand store (replacing the
  then-current reactive var, client-state pass below); the board has no Provider → State edge, and
  the plan draws none.

### Contract points applied with a deviation

- **D-1. Withdrawn by the verification (F5).** The first 2026-10-08 pass split the Data
  provider box into `ProfileProvider` and `ProfileFailureProvider` to save a `di.ts` closure.
  The split is gone: one `ProfileProvider` takes a named `ProfileProviderDeps` built by one
  `useFactory` closure, as contract §3.2 and #315's and #331's providers do, and the corrected
  registrar arithmetic funds the closure (A §6, §17.3 C-2; E 2.7). No deviation remains here.
- **D-2. `PasswordRuleViewSet` beside `PasswordRuleResultSet`.** `UIPasswordPolicyRules` lives
  in `src/components`, which may not import a module type even as `import type`; the hook maps
  #315's `PasswordRuleResultSet` (keys) to a component-level `PasswordRuleViewSet` (labels)
  (A §5.9).
- **D-3. Element names, now decided.** `FeatureFlagRef` (`name`) for the items of
  `FeatureFlagSet` in `src/config/runtime/types/feature-flag.ts` (verification D3), and
  `FieldViolation` (`path`, `reason: FieldViolationReason`) for the items of #315's
  `FieldViolationSet` (verification D2). They are fixed for all three bundles, not by whichever
  lands first.

### Revision checks

- **Traceability.** 30 FRs and 15 NFRs, each covered; the FR rows of the coverage map equal the
  union of the stories' Requirements lines (0 rows differ, re-computed by script); NFR-14 lists
  21 stories and NFR-15 lists 11; every class of A §6 has a layer in A §17.
- **Parser.** bmalph `parseStoriesWithWarnings`: 4 epics, 35 stories, `warnings=0`. Rule check:
  354 story criteria (353 after the verification pass below), each starting with "Given" and
  holding "when" and "then", even backticks, no `**`, no column-0 continuation, every
  `Depends on` pointing backwards.
- **Contradiction sweep.** `Controller`, `Service`, `Handler`, `Normalizer`, `Record<`, `[]`,
  inline `{ … }`, `Omit<` and `Pick<` grepped over the seven artifacts. Every remaining hit is a
  quoted TB-1 example, a "before" cell of a rename table, an existing class
  (`SecurityEventReporter`, `ObservabilityService`, `FeatureFlagService`, `RequestRetryService`,
  `RegistrationHandlersFactory`), a browser `AbortController`, user-service, a wire path
  (`violations[].path`) or a runtime value literal (Apollo options, mock extensions).
- **Lint.** `prettier --check`, `markdownlint -c .markdownlint.yaml` and the 100-character check
  pass for all seven artifacts.

### New risks

- **P.2 is a hard prerequisite.** If chore #332 (typed-boundaries gate), the chore
  `zustand-client-state` or #315 Epic 0 (Stories 0.1–0.2) lands later, splits or renames a
  selector, folder, suffix, store or token, a correct-course pass re-aligns the affected stories
  before Ralph runs; no story here may add or relax a selector to compensate.
- **#315's shared names and shapes.** `useAbortableSubmit` and `AbortableSubmit` are taken as
  #315's architecture §6.4 and §6.5 declare them today (`isSubmitting`, `submit`, `retry`);
  `UserServiceFailure` is #315's one interface (`reason`, `status`, `violations`, no variants)
  and `FieldViolation` is `path` plus `reason` (verification D1, D2). #315's bundle still
  declares `FieldViolation` with `property` until its owners apply D2; a merge that differs
  needs a correct-course pass on 1.7, 2.5 and 3.4.
- **Composition-root growth.** Superseded by the Simplification pass (2026-10-08): settings
  adds no closure and the registrar stays at 3 of 6 (A §6). Before it: settings added one closure,
  the `ProfileProviderDeps` factory, and the registrar reached its cap of six once #315, #331 and
  settings had landed. The registrations fold into `registerRepository` and
  `registerResponseMappers`; each stays under 10 LLOC today, and a later lander that pushes one
  over must split the step without adding a closure. A further deps bag needs a recorded
  decision in the `## User Settings decisions` README section for a second registrar file,
  never a cap change.
- **Transformer data imports.** `GraphQLProfileTransformer` value-imports
  `settings/utils/response-schemas.ts`, which is already admitted once `transformers/` joins
  `LOGIC_SOURCE_GLOBS` (#315 Story 0.2): the `response-contracts` target is path-based, so no
  DI-policy change of #315's is assumed (verification F9).
- **The generated-contract rule must be able to fire.** NFR-14's `make lint-deps` criterion
  relies on #315 Story 0.2 moving `^src/api/generated/` from the cruise `exclude` to
  `doNotFollow` (verification F2); until then the rule passes vacuously.

### Verification pass (2026-10-08): findings fixed

**Verdict: PASS, conditional on P.2** (unchanged). Input: the independent verification
`crm-worktrees/_planning-shared/verification-2026-10-08.md` (F1 to F21, decisions D1 to D10,
adopted as final) and the refined TB-1 text of the contract §4. Every finding attributed to
this bundle (#330) is fixed:

| Finding      | Sev   | Fixed in                                                                |
| ------------ | ----- | ----------------------------------------------------------------------- |
| F5           | Major | A §3.3, §4, §5.1, §5.11, §6, §6.1, §8, §10, §12 to §14, §17; E 2.7; D-1 |
| F3, D6       | Major | P NFR-2; A §6, §12, §14; E AR-4, 1.7, 1.8, 2.5, 2.7; research §5        |
| F4, D1, D2   | Major | A §5.4, §5.5, §6.1, §13, §15.2; E P.1, 1.7, 1.8, 2.5, "Points" 11, 18   |
| F7           | Minor | P NFR-14 and A §1.2: the refined TB-1 block, byte-identical             |
| F9           | Minor | A §5.2; the risk below                                                  |
| F10, D7      | Minor | P intro, NFR-14, §7; A §1.2, §12; E P.2, graph; R; S                    |
| F11, D3      | Minor | A §5.6, §6.1, §15.2; E 1.5, "Points" 17; D-3                            |
| F12, D4      | Minor | already `settings/routes/user-profile/`; stated as decided (E "Points") |
| F15          | Minor | A §3 intro, §3.3, §4.1 to §4.4, §6, §17.1 to §17.3 C-3                  |
| F16          | Minor | A §3.2 and §3.4 edges labelled with named types                         |
| F17          | Minor | P NFR-15 and E AR-3 list `Factory`; A §12 class naming                  |
| F18          | Minor | A §6.1: `PasswordRuleView` is a new component-level type                |
| F21          | Minor | this report: the D-1, D-3 and risk claims above                         |
| Shared names | —     | `SignInNoticeProps`, `useAbortableSubmit`, D5 names (A §5.5, §7.3; E)   |

- **One addition beyond the report.** #315's rule 8 classifies any numeric
  `extensions.status`, so the appended message table (rule 7a) must sit between #315's rules 7
  and 8, not merely "before rule 9" as the verification words it, or "Access Denied." with
  status 403 would become `unknown`. A §5.4 states it; E "Points" 18 tells the #315 owners.
- **`useAbortableSubmit`** is read from #315's architecture §6.4 and §6.5 as declared today; it
  was present, so the verification's fallback declaration was not needed.
- **Not applied here** (other bundles): F1, F2 (cited only as a #315 Story 0.2 dependency),
  F6, F8, F13, F14, F19, F20.
- **Re-check fixes (N2, N3, N4).** The dotted Repository → State edge is gone from A §3.3 (the
  Bearer rides the Repository → API label) and the link's token read is gap G-4 in §17.3; rule 6
  is restated as appends #315 §5.5.1 permits (A §5.4, E 1.7); the D6 sentence in P, A and E is
  #315's §6.6 text word for word.

**Checks re-run after the pass.** bmalph `parseStoriesWithWarnings`: 4 epics, 35 stories, 353
criteria (Story 2.7 lost the `settle` criterion), `warnings=0`, and 353 story bullets start
with "Given". Traceability: 30 FRs and 15 NFRs each in a story's Requirements line (the only
other id, FR-34, is a citation of the two-factor PRD). All ten mermaid blocks (nine in A, one in
E) render with `@mermaid-js/mermaid-cli@11.4.2`; no edge outside the epics dependency graph is
unlabeled. `prettier --check`, `markdownlint -c .markdownlint.yaml -p /dev/null` and the
100-character check pass on all seven artifacts. The TB-1 block in P and A hashes to the
contract's sha256 `eb676341eb864e85…`.

### Shared User domain pass (2026-10-08)

**Verdict: PASS, conditional on P.2**, which then ended at #315 Story 0.7 (now Story 0.2, after
the chore #332). Input: contract §3.5
and TB-2 (§4), `ddd-domain-check-2026-10-08.md` R330-1 to R330-6, and two user decisions: keep
it simple, because the frontend holds no business logic, and `RestorePasswordDTO` belongs to
the forgotten-password flow of #315 (Q-1).

| Before                                  | After                                           |
| --------------------------------------- | ----------------------------------------------- |
| `UserEntity` built in Story 2.3         | imported from #315 Story 0.7 (R330-1)           |
| `useProfileLoad` in the card            | in the `UserProfile` page; `user` prop (R330-2) |
| `RestorePassword`, `RestorePasswordDto` | `ChangePassword`, `PasswordChange` (R330-5)     |
| `UserNodeDto`                           | `UserNode` (R330-4)                             |
| no domain section                       | A §2.4 board types (R330-6)                     |

R330-3 (type the section by the DTO) is superseded: the section's payload is now the plain
`PasswordChange`, not a board DTO. `ChangePassword` is named for the component-level card's
"changing password", because the contract fixes only the payload rule; it is gap G-5 in A §17.3.
TB-2 is in P NFR-14 and A §1.2 beside TB-1, which is unchanged (sha256 `eb676341eb864e85…`).
"Anti-corruption layer" and "bounded context" are gone from P, A, E and R. Checks: bmalph
`parseStoriesWithWarnings` 35 stories, 366 criteria (13 TB-2 criteria added on 2.3, 2.4, 3.1,
3.2, 3.5, 3.6 and 4.7), `warnings=0`; the five changed mermaid blocks (A §3.2 to §3.4, §4.1; E
graph) render with `@mermaid-js/mermaid-cli@11.4.2`; `prettier --check`,
`markdownlint -c .markdownlint.yaml -p /dev/null` and the 100-character check pass. Open: the
board still draws `RestorePassword` under `UserProfileSettings` (contract Q-1 proposes a move).

Domain re-check §7 applied: TB-2 pasted verbatim (sha256 `b760fede…`); the page calls no 2FA
hook (M1), so the 2FA slot stays a slot.

## Simplification pass (2026-10-08)

**Verdict: PASS, conditional on P.2**, now "chore #332 (typed-boundaries gate) → #315 Epic 0
(Stories 0.1–0.2)". Input: `crm-worktrees/_planning-shared/over-engineering-review-2026-10-08.md`
(§2.2 and the top-10 list), the contract's §2.2 loader, §3.4 owners and landing order and §3.5
domain, the simplified #315 bundle, and four user decisions: "apply all 10"; data access only
through GraphQL repositories; `src/services/*` is the bulletproof-react layout and out of scope;
the TB-1 gate lives in chore #332 (draft PR #333), which lands first.

| Count                 | Before     | After      |
| --------------------- | ---------- | ---------- |
| New classes           | 7          | 5          |
| Hooks                 | 6          | 5          |
| Named types           | 69         | 47         |
| Stories               | 35         | 25         |
| Acceptance criteria   | 366        | 251        |
| DI tokens / closures  | 5 (+1) / 1 | 3 (+1) / 0 |
| New tooling tests     | 1          | 0          |
| Mermaid blocks (A, E) | 9, 1       | 8, 1       |

**Removed:** `ProfileFailureTransformer` (merged into `GraphQLProfileTransformer` as `invalid`
and `failed`), `ToastQueueStore` (a reducer in `useToastQueue`), `useUserProfileSettings`
(`ProfileForm` calls its hooks), `ProfileProviderDeps` and its `useFactory` closure, the
`profile_update` signal (FR-23 withdrawn, Story 1.12), the aborted and per-operation failure
types, `ProfileBusy`, `ToastRequest`, `ToastRequestSet`, `ToastNotify`, `ToastQueueSnapshot`,
the toast-table, deps and model types, `FeatureFlagRef` and `FeatureFlagSet` (a scalar `flag`),
the link's body-reading rule (b) and R21–R23 (a transport 401 alone ends a session, R28),
`email_timed_out`, the stateful mock with its token rule, `mock-session`, `MOCK_EXPIRED_TOKEN`,
the msw literal, `mock-expired-token.test.ts` and the drift register, and the dev compose flag.

**Merged stories** (old → new): 1.8 and 1.9 → 1.8; 1.10 and 1.11 → 1.9; 2.1 and 2.2 → 2.1;
2.4 to 2.6 → 2.2; 2.7 → 2.3 (with the scrubber of 1.12); 2.3 → 3.3 (with 3.4); 3.3, 3.5 and 3.6
→ 3.4; 3.7 → 3.5; 3.8 → 3.6; 3.9 → 3.7; 4.6 and 4.7 → 4.6; 1.12 withdrawn.

**Owners.** Every "whichever lands first" branch is gone: #330 owns the route key, the
`UserProfile` shell, `RouteFlagGate`, `SessionLinkFactory` (one rule, built once), the
`session_ended` notice, the `UIForm` `submitRef` / `submitSx` / `footer`, the `error.text` token
and the home link; #315 owns `UserServiceErrorTransformer` (#330 appends the `401` status row,
its input properties with `taken`, and the first exact-message step with "Access Denied." and
the two wrong-password rows), `useAbortableSubmit`, `SignInNotice` and the password pieces.

**Checks.** bmalph `parseStoriesWithWarnings`: 4 epics, 25 stories, 251 criteria,
`warnings=0`; every criterion starts with "Given" and holds "when" and "then", even backticks,
no `**`, no column-0 continuation, every `Depends on` backwards; the FR rows of the coverage map
equal the union of the stories' Requirements lines (0 differ). All nine mermaid blocks (eight in
A, one in E) render with `@mermaid-js/mermaid-cli@11.4.2`. `prettier --check`,
`markdownlint -c .markdownlint.yaml -p /dev/null` and the 100-character prose check pass on all
seven artifacts. TB-1 and TB-2 hash to `eb676341…` and `b760fede…` in P and A.

**Not applied, or applied with a note.**

- `ClearButton` stays a child component: it must run inside `UIForm`'s form context to call
  `useFormContext().reset`; only its story merged (into 3.4).
- The review would drop the `session_ended` notice from #330; the contract and #331 name #330 as
  the owner of that append, so it stays, merged into Story 1.8.
- U5 says "on in dev and test"; with #315's dev flag transform dropped, the dev server keeps the
  committed block and the page runs locally through `make start-prod`.

**Final check (2026-10-08):** #330 owns the anonymous-operation set and
`settings/utils/response-schemas.ts` (#331 appends), G-4 declares the link's State reset, step-3
properties and stale register rows corrected (m2–m5); 25 stories, 251 criteria; PASS.

## Client-state pass (2026-10-08)

**Verdict: PASS, conditional on P.2**, now "chores #332 and `zustand-client-state` → #315 Epic
0 (Stories 0.1–0.2)". Input: the user, "change the react state var to zustand", then "1, but
firstly update the diagrams". Option 1 is a new prerequisite chore, `zustand-client-state`
(#334, lands before #315): it adds `zustand`, records its rules (now ADR-002's "Current rules"), removes
the zustand ESLint ban and its contract test, replaces `AuthStateVar`, `ConnectivityStateVar`
and `src/lib/state/*` with Zustand stores and measures the paint budget. Landing order: the
chores #332 and `zustand-client-state` → #315 → #330 → #331.

- **Diagrams first.** A §3.2 draws State as `State [Zustand]` (`useAuthStore`, a Zustand store)
  with the edge `useAuthStore((s) => s.token): AuthState`; A §4.1 and §4.4 end a session with
  `SessionLinkFactory` → `useAuthStore.setState(AuthStatePatch)`; E's graph root names both
  chores.
- **Text.** `SessionLinkFactory` injects `AUTH_TOKENS.AuthStore` (`useAuthStore` by value, typed
  `StoreApi<AuthState>`; an assumption in A §5.5), reads `getState().token` and on a transport
  401 writes a module-private signed-out `AuthStatePatch`; Story 1.8's criteria follow. The
  token stays memory-only with no `persist`; server state stays in Apollo; the toast queue stays
  a local reducer. No migration story is added.
- **Checks.** bmalph parse `warnings=0`; the changed mermaid blocks (A §3.2, §4.1, §4.4, E graph)
  render with `@mermaid-js/mermaid-cli@11.4.2`; prettier, markdownlint and the 100-character
  prose check pass; TB-1 and TB-2 still hash to `eb676341…` and `b760fede…` in P and A.

## Reconciliation 2026-10-16 (no new iteration)

The user asked for no further readiness iteration, so this section records only that the bundle
was reconciled with the code it builds on and that the verdict above still holds. Branch
`feat/330-user-settings` is stacked on PR #340's head `f8ff83c7` (crm #315 implemented, not
merged) over PR #333 (`db3db0f6` on `main`). P.2 (#332, #334) is merged and P.1 is satisfied by
the stack. The run summary's "2026-10-16 reconciliation" lists every edit and its cause; the
architecture opens with the planned-versus-real table.

| Area               | Result of the reconciliation                                                           |
| ------------------ | -------------------------------------------------------------------------------------- |
| Story set          | 25 stories, same ids and order (1.2 retitled); 13 follow-ups; 251 → 282 criteria       |
| Dispatch order     | every `Depends on` names a lower id; 1.4, 1.5 no longer wait on 1.2; 1.7 does          |
| ADRs               | none written; FR-30, Stories 1.2 and 4.6 record a README section, `[no-adr]`           |
| Shared #315 pieces | real paths and shapes in E P.1 and A §5.4, §5.5, §5.9, §5.12, §8                       |
| Missing pieces     | each assigned: policy catalog (1.1), settings catalog (1.6), barrel (2.2), edges (3.2) |
| R23                | its "undecorated normalizer" part withdrawn; #315's class stays `@injectable()`        |
| TB-1 and TB-2      | untouched and byte-identical in P NFR-14 and A §1.2; the pins above still hold         |

Adapted rather than imported as planned: `password_reset.errors.policy_rejected` (lazy, so
settings declares `settings.errors.new_password_rejected`, E 3.5); `UIPasswordPolicyRules`
(keeps #315's label lookup, so `evaluate` returns #315's result unchanged, E 1.1, 3.4);
`useAbortableSubmit` (no `retry`, a stable `run`, E 3.3); `SignInNotice` (a toned row, E 1.8);
#315's "no message text" decision (amended in the README, E 1.2, 1.7).

**Checks run on 2026-10-16** (scripts over the text only; no Jest, tsc, ESLint or `make`).
bmalph 2.11.0's own `parseStoriesWithWarnings` reads 25 stories in id order 1.1 to 4.6 with no
warning; an audit of every story body finds no dropped line, no indented or mid-line "given", no
`####` and no `**` inside a criterion. Every FR except the withdrawn FR-23 and every NFR appears
in at least one story's Requirements line. A scan for `ADR-0`, `R23`, `user/lib/user-service`,
`forgotPassword` precedents, "four entries" and `v0.6.0` leaves only ADR-001, ADR-002, dated
history and statements of the change. The TB-1 blocks of P and A still hash to `eb676341…`.
`prettier --check` passes on the seven artifacts; `**/planning-artifacts/` is outside
markdownlint's scope, and the 100-character self-check no longer applies to criteria, which
bmalph needs on one line each.

**Verifier pass, 2026-10-16.** Independent code-truth, parser and consistency checks reported 13
findings; all 13 were confirmed in the code or the artifacts and fixed (the run summary lists
each). They add 8 criteria (272 → 280: Stories 1.1 +2, 1.4 +2, 1.5 +2, 1.6 +1, 3.4 +1) and the
PRD's `## 13. Out of scope`. Re-run afterwards: `parseStoriesWithWarnings` reads 25 stories, 1.1
to 4.6, with no warning; the story-body audit is clean; bmalph's preflight reports W3 and W7
only (W6 cleared, as in #315's bundle) and its context extraction now carries a scope section;
the TB-1 blocks of P and A still hash to `eb676341…` and are identical. The verdict above holds.

**Second verifier pass, 2026-10-16.** Ten more findings (four code-truth, six consistency); all
ten were confirmed and fixed (the run summary lists each). No existing visual baseline renders a
field error, so Story 1.3 re-records nothing and the DoD, NFR-3, Story 4.5, A §5.10 and A §13.2
keep the home page as the only re-baseline; Story 1.5 adds a `publicLevelOf` helper and Story 1.6
the real-registry gate case to `route-composer.test.tsx`; the composer's two `filter`s merge so
the gate fits five closures of six; Story 1.6 drops `.github/CODEOWNERS`; stale U5, P6, P.1 and
dev-stack wording in R, B, P and E is aligned with R28; `implementation-artifacts/.gitkeep` is
added. Criteria 280 → 282 (Stories 1.5 +1, 1.6 +1). Re-run afterwards: `parseStoriesWithWarnings`
reads 25 stories, 1.1 to 4.6, with no warning; the story-body audit is clean; preflight reports
W3 and W7 only; `prettier --check` passes on the seven artifacts; the TB-1 blocks of P and A
still hash to `eb676341…` and are identical. The pin is unchanged: PR #340 head `f8ff83c7`. The
verdict above holds.
