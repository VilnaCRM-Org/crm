---
status: 'draft'
workflowType: 'epics-and-stories'
bmadCommand: 'create-epics-stories'
project_name: 'crm'
date: '2026-11-23'
revised: '2026-11-27'
iteration: 4
revisionPasses:
  - '2026-11-27 review: S2.1, S2.3, S3.1 follow PRD FR1, FR6 and FR11'
  - '2026-11-27 review: S2.2 owns FR4 — the query per history entry, the fallback when the popup cannot close'
  - '2026-11-27 owner: S3.1, S3.2 per tile style; S3.4 the Storybook trial; S4.2 the removal after the pick'
slug: 'social-account-linking'
inputDocuments:
  - 'specs/social-account-linking/planning-artifacts/prd-social-account-linking-2026-11-23.md'
  - 'specs/social-account-linking/planning-artifacts/architecture-social-account-linking-2026-11-23.md'
---

# Epics: Social Account Linking in Settings

> **Revision 2026-11-27 — how an attempt ends.** S2.1, S2.3 and S3.1 carry the PRD revision of
> the same date: a popup closed before it leaves for the provider cancels the attempt, the tab
> does not watch the popup once it is at the provider, every ending asks the popup to close (a
> provider's page may refuse), and a list read refused with a 401 shows nothing. S2.2 now owns
> FR4: the popup reads each history entry's query, strips it before the return view first paints,
> posts it once, and tells the user to return to settings when it cannot close itself.

> **Amendment 2026-11-27 — three linked-tile styles (product owner).** S3.1 and S3.2 now hold for
> each PRD L8 style. The new S3.4 builds the trial: the `tileStyle` prop, the `badge` and
> `labelled` renderers, two trial toolkit seams and the Storybook comparison, with no runtime
> setting, browser lane or baseline (PRD L9). S4.1 runs the page, so its lanes cover `tinted`
> only. The new S4.2 follows the owner's pick and removes the losers in one change.

Every story also meets NFR1 and carries its own direct tests.

## Epic 1 — Contract and data

### S1.1 Pending contract and mock — independent

- The pending file declares the query and the three mutations; `make codegen-check` is clean.
- The mock issues `link.` states, consumes each once, checks the provider, refuses an identity
  linked elsewhere and a provider already linked, and lists links. Its user has a password, so the
  last-method refusal is tested with an intercepted answer.
- The consent page reaches every FR11 outcome a provider can cause.

### S1.2 Repository, transformer, data provider — dependent on S1.1

- Fresh `clientMutationId` per call, `no-cache`, the caller's signal, no retry.
- Every FR11 row is mapped, through the container in integration as well as in units.
- An abort is reported as `aborted`, never as a failure.

## Epic 2 — Popup and attempt

### S2.1 State guard, channel and window leaves — independent

- A message of another shape or for another attempt is ignored. A message for the attempt whose
  `code` or `error` is not text reads as malformed, and an empty or whitespace-only `code` as
  missing (FR11).
- The window navigator drops the opener and sends the popup on without a history entry; it never
  watches `popup.closed`, which a provider page can make read `true` while the user is still
  there (FR6).
- The wait resolves for a signal that was already aborted.

### S2.2 Return view — dependent on S2.1

- `link.`: the query of each history entry is read, so a new entry on the same route is read again;
  it is stripped before the return view first paints and posted once, StrictMode included (FR4). The window
  closes when it can, and otherwise tells the user to return to settings; no retry is offered.
- A `link.` state never reaches `completeSocialSignInUser` (FR3), unit and E2E.

### S2.3 Attempt hook — dependent on S1.2, S2.1

- FR2, FR5, FR6 and FR12, including an abort during `initiate`, a second click, and a popup closed
  during `initiate`. Every ending asks the popup to close; that is relied on only while the popup
  is the blank page; after the provider, the callback page closes itself (FR4). A popup that reads closed while it
  waits does not end the attempt, and its later answer still completes the link.

## Epic 3 — Card

### S3.1 Tiles and list state — dependent on S1.2

- Display-only until the list answers; retry on failure, the loading message while it runs, and
  nothing after a 401 (FR1); FR7; FR8 and FR10 in every PRD L8 style.
- A story per tile state and style; an accessibility-lead review before the edit; a Figma check
  per style against its L8 nodes (`tinted` `315:11754`).

### S3.2 Unlink — dependent on S3.1

- FR9 with the L6 row, for each style's unlink control; one row at a time; nothing is sent before
  it is confirmed; the last-method refusal is explained.

### S3.3 Notifications — dependent on S3.1

- One notification per FR11 result in both locales, announced by the existing live regions.

### S3.4 Linked-tile styles (trial) — dependent on S3.1, S3.2

- `SocialNetworks` takes an optional `tileStyle` (default `tinted`) and passes it through
  `SocialNetworksCard` and `SocialList` to `SocialTile`, where it is required; the settings page
  never sets it, and a page test pins that it draws `tinted` (PRD L9).
- `BadgeLinkedTile` and `LabelledLinkedTile` in their own files over `variant-styles.ts`, a tokens
  test that pins every value, and units for FR8, FR9 and FR10 in each style, with FR8 and FR9 in
  both locales.
- The trial seams `ui-status-badge` and `ui-outlined-small-button`: a `uiToolkitSeams` entry, an
  ESLint policy pin, a story and a direct test each, and a `trial` row in `docs/ui-toolkit.md`.
- `settings.social.linked_badge` in `en` and `uk`, for the badge's required label.
- Stories: `Settings/SocialNetworks/Comparison` at 375, 768, 1025, 1100 and 1440 px, idle and
  busy; `Settings/SocialTile` linked, busy and with the confirmation open in each style, plus the
  folded `labelled` pill; a `tileStyle` control on both components. jest-axe runs over every
  comparison story.
- No runtime setting, browser lane or baseline: `badge` and `labelled` have Storybook, jsdom and
  jest-axe evidence only (PRD L9, NFR5, NFR6).

## Epic 4 — Verification

### S4.1 E2E, mobile, visual, docs — dependent on all

- Link, cancel, already linked and unlink in three engines; tap on both mobile
  projects; baselines of the card; route-coverage rows; the local guide; a follow-up note for #392.
- Every lane runs the settings page, so it covers `tinted` only, and the card's baselines are
  unchanged by S3.4.

### S4.2 Style decision and removal — dependent on S3.4 and the owner's pick (follow-up)

- Not part of this pull request; it starts once the owner picks a style.
- The pick is recorded as a dated amendment in all four files of this bundle.
- One change, with every gate green, removes the losing renderers and their styles, seams,
  stories and tests, the `tileStyle` prop and the `SocialTileStyle` type, the `uiToolkitSeams`
  entries and ESLint pins of a losing seam, and its `trial` row; the winner's row turns `adopted`.
  `settings.social.linked_badge` goes if `badge` loses.
- If `badge` or `labelled` wins, it gets every S4.1 lane, and CI re-records the card's baselines.
