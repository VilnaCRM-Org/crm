---
status: 'draft'
workflowType: 'prd'
bmadCommand: 'create-prd'
project_name: 'crm'
date: '2026-11-23'
revised: '2026-11-27'
iteration: 4
revisionPasses:
  - '2026-11-27 review: FR1, FR4, FR6, FR11 — how an attempt ends, the popup return, the list after a 401'
  - '2026-11-27 review: FR8, NFR2 — the linked border is under 3:1, owner-accepted'
  - '2026-11-27 owner: L8, L9, FR8–FR10, NFR2, NFR4–NFR6 — three linked-tile styles compared in Storybook'
  - '2026-11-27 review: FR10 — closing a result notification returns focus to its tile, not to Save'
slug: 'social-account-linking'
inputDocuments:
  - 'specs/social-sign-in/planning-artifacts/prd-social-sign-in-2026-11-18.md'
  - 'specs/user-settings/planning-artifacts/prd-user-settings-2026-10-06.md'
  - 'user-service #520'
---

# PRD: Social Account Linking in Settings

> **Revision 2026-11-27 — how an attempt ends.** FR6 now names how an attempt ends. A popup the user
> closes before it leaves for the provider ends the attempt as `cancelled`; once it is at the
> provider the tab does not watch it, because `popup.closed` cannot be trusted there, so the wait
> ends on an answer, the next click or leaving the card. Every ending asks the popup to close,
> which is certain only before it leaves for the provider (FR6). A list read refused with a 401 shows nothing, and a
> retry shows the loading message (FR1). The popup reads the query of each history entry, strips
> it before the return view first paints and hands it over once (FR4). FR11 now names an empty or
> blank `code`, a
> malformed callback and `success: false`. FR8 and NFR2 record that the linked tile's border,
> like its bin, is under 3:1 (owner-accepted, #276). The linking API (user-service #520) does not
> exist yet, so the contract stays provisional (L3).

> **Amendment 2026-11-27 — three linked-tile styles (product owner).** A linked tile can be drawn
> in three trial styles, `tinted`, `badge` and `labelled` (L8). A `tileStyle` prop that only
> Storybook sets chooses one (L9); the settings page always renders `tinted`, and nothing at
> runtime chooses a style. FR8, FR9 and FR10 state one DOM and ARIA contract for every style, NFR2
> names each style's accepted contrast gaps, and NFR4, NFR5 and NFR6 say what the trial adds to
> the settings chunk and what it leaves without browser or visual evidence. The owner picks one
> style; the losers are removed in one change (epics S4.2).

## 1. Goal

A signed-in user links Google, GitHub, Facebook or Twitter to the account they already have, sees
which providers are linked, and unlinks one, from the "Соціальні мережі" card of `/settings`.
Linking is not a sign-in: it never issues or replaces a session. A linking request refused with
HTTP 401 still ends the session, as FR1 and FR11 state.

## 2. Decisions

- **L1 — Scope (owner, 2026-11-23).** The settings tiles become working controls that link a
  provider to the existing account. This supersedes the social sign-in non-goal "Provider linking
  in settings" and user-settings D2a / FR-7a (display-only card). It lands as a pull request stacked
  on PR #398.
- **L2 — Popup.** The session token lives in memory only, so sending the settings tab to the
  provider would sign the user out. The provider opens in a popup; the settings tab stays.
- **L3 — GraphQL only.** The owner's rule for social sign-in holds here. user-service #520 (open)
  proposes finishing a link in a REST redirect; this plan declares `completeSocialLinkUser` as a
  provisional pending contract instead. #520 also returns `createdAt` and `lastUsedAt` per provider,
  which the card does not show; the contract lists provider names only,
  and the mutations answer `success` alone. Both differences are
  upstream questions to settle before production.
- **L4 — Marked state.** `initiateSocialLinkUser` issues a `state` that starts with `link.`. The callback
  page uses the prefix only to choose the flow, so the popup needs no storage of its own: browsers
  drop `window.opener`, and cross-window `sessionStorage` writes, on some returns from a provider.
  Trust comes from the settings tab comparing the full `state`.
- **L5 — Notifications.** Results raise the notifications port (`useNotifications().raise`), as Figma
  `315:11754` draws them, with the provider name as a message value; they are recorded in the bell
  history and never sent to the notification service.
- **L6 — Inline unlink confirmation (owner, 2026-11-23).** Figma draws none and #520 asks for none.
  The unlink control asks first, in one row under the tiles, because a phone tile is too narrow
  for a question.
- **L7 — Last sign-in method.** user-service refuses to unlink the last way to sign in. The SPA
  explains the refusal; it does not guess in advance whether the account has a password.
- **L8 — Linked-tile styles (owner, 2026-11-27).** A linked tile is drawn in one of three trial
  styles. Unlinked, display-only and loading tiles and the L6 row are the same in all three.
  - `tinted` is the shipped tile, Figma `315:11754`: fill `#E8F7FF`, a `#1EAEFF` border, 1px
    below 1025 px and 2px from 1025 px, and a `#1EAEFF` `trash-04` bin. The phone frame
    `386:27719` draws a 2px border; the owner keeps 1px.
  - `badge` keeps the white social-button tile with its `#E1E7EA` border (UI kit `439:19329`),
    adds the toolkit `UiStatusBadge` "done" check (`451:25845`) in the toolkit's `#38B386`, as
    shipped, not CRM's `#4CAF50`, and draws a `#DC3939` `trash-04` bin on the `UiActionIconBar`
    danger ramp (`632:46703`–`632:46710`): hover and pressed `#DF7878`, a pressed plate of
    `#DC3939` at 10%, and `#D0D4D8` while busy. The UI kit's own `trash-02` glyph is not taken.
  - `labelled` draws a white tile with a 2px `#1EAEFF` selected-card border (`439:19640`) and the
    neutral toolkit `UiButton` outlined small pill (`439:19257`–`439:19260`) reading "Відключити".
    On a tile whose content box is under 16rem the pill folds to a 44 px bin circle. The danger
    pill (`439:19822`) is not taken: its text is 3.89:1 and would need an axe exception (NFR2).
  - The toolkit components reach the tiles only through two trial seams,
    `src/components/ui-status-badge` and `src/components/ui-outlined-small-button`.
- **L9 — Switch (owner, 2026-11-27).** A `tileStyle` prop compared in Storybook; the owner picks;
  the losers are removed in one change. `SocialNetworks` takes an optional `tileStyle`
  (`'tinted' | 'badge' | 'labelled'`, default `tinted`) and passes it through
  `SocialNetworksCard` and `SocialList` to `SocialTile`, where it is required; the settings page
  never sets it, and no environment variable, runtime setting or flag chooses a style. The
  comparison is the `Settings/SocialNetworks/Comparison` stories at 375, 768, 1025, 1100 and
  1440 px, idle and busy, and the per-style `Settings/SocialTile` stories. Evidence limit: during the trial `badge` and
  `labelled` are proven in Storybook, in jsdom unit tests and by jest-axe over every comparison
  story only. They have no real-page browser, accessibility-lane or visual evidence, because
  every browser lane runs the settings page, which renders `tinted`; `tinted` keeps every lane.
  The winner gets every lane in the removal change.

## 3. Functional requirements

- **FR1** `linkedSocialProviders` is read when the card mounts, never from the Apollo cache. Until it
  answers, and if it fails, every tile stays display-only, so the card never offers to link a
  provider that may already be linked. A failure shows a localized message and "Try again"; while
  the retry runs, the message says the list is loading. A read refused with a 401 shows nothing:
  the session ends and `ProtectedRoute` redirects.
- **FR2** An unlinked tile is a button. Activating it opens the popup synchronously, then calls
  `initiateSocialLinkUser(provider)`; only an http(s) `authorizationUrl` is followed. A blocked popup
  shows the `blocked` message and calls nothing.
- **FR3** The popup returns to `/auth/callback/:provider`. A `state` that starts with `link.` never
  reaches `completeSocialSignInUser`, whatever is in storage.
- **FR4** The popup reads the query of the history entry it is shown for, so a new entry on the
  same route is read again. It strips the query from the address bar before the return view first
  paints, hands
  `code`, `state` and `error` to the settings tab once over a same-origin `BroadcastChannel`, and
  closes. If it cannot close itself, it tells the user to return to settings; it offers no retry.
- **FR5** The settings tab ignores a message whose provider or `state` is not its own attempt's, and
  treats every other field as untrusted. It then calls `completeSocialLinkUser` once. A `state` that
  `initiateSocialLinkUser` did not mark is refused. The popup has no opener once it leaves.
- **FR6** An attempt ends when `initiateSocialLinkUser` answers with a failure, when its answer
  arrives, when another one starts, or when the card goes away; nothing it later answers changes the card, even when it ends while
  `initiateSocialLinkUser` is in flight. Ending stops the channel listener and asks the popup to
  close. That is certain only while the popup is still the tab's blank page. Once it has been on the
  provider's page, the tab has disowned it (no opener), and a provider that sends
  `Cross-Origin-Opener-Policy` detaches the tab's reference for the rest of the popup's life, so
  the browser can ignore the request even on the callback page. The callback page closes itself
  (FR4); a window abandoned at the provider is the user's to close. A popup the user closes before it leaves for the
  provider ends the attempt as `cancelled`: the tab reads `popup.closed` once, just before it sends
  the popup on, while the popup is still its own blank page and the flag is reliable. It does not
  watch the popup after that. A provider page that sends `Cross-Origin-Opener-Policy` moves the
  popup to another browsing-context group, and the tab's reference then reads `closed` as `true`
  while the user is still on the consent page; a watch would settle `cancelled` and drop the
  callback that arrives later over the channel, which still reaches the tab. A timeout would cut
  off a user still at the provider in the same way, so there is none. A popup closed at the
  provider therefore leaves the wait open until the next click or leaving the card; the tiles are
  not held while it waits, so no tile stays pending. The next click and leaving the card are
  aborts (FR12).
- **FR7** A refusal that the provider is already linked shows the tile as linked. A result changes only its own provider's tile, so answers that arrive out of order, or an
  older list answer, never undo it.
- **FR8** A linked tile is drawn in its L8 style, every colour as its design source draws it
  (owner, 2026-11-23 and 2026-11-27). In every style it has exactly one unlink button, named for
  its provider ("Відключити {provider}"), `aria-disabled` while the card is busy and never
  natively disabled, and its accessible name carries the state (", linked"), so assistive
  technology does not rely on colour. `badge` hides its status badge from assistive technology,
  so the state is spoken once; the visible "Відключити" of the `labelled` pill begins the pill's
  accessible name. The contrast each style leaves under 3:1 is listed in NFR2.
- **FR9** The style's unlink control (the bin in `tinted` and `badge`, the pill or its folded
  circle in `labelled`) shows the L6 row, named for its provider, with focus on Cancel. Cancel and
  Escape close it and focus the control; confirming closes it, focuses the control and calls
  `unlinkSocialProviderUser(provider)` once.
- **FR10** After a tile changes state, keyboard focus moves to the tile's new control: the link
  button, or the style's unlink control. Closing the last notification row returns focus to the
  control of the tile whose result was raised: the new one after a change or a `provider_linked`
  refusal, which shows the tile as linked, and the same one after any other failure, unless a
  profile save was sent later; the page publishes one return target, and the section the user
  acted in last owns it.
- **FR11** Success and failure each raise one notification, announced by the settings live regions:

  | Source                                                  | Failure kind           |
  | ------------------------------------------------------- | ---------------------- |
  | popup blocked                                           | `blocked`              |
  | provider `error`, popup closed before it leaves         | `cancelled`            |
  | no or a blank `code`, `invalid_state`, `state_expired`  | `expired`              |
  | `identity_linked_to_other_user` (409)                   | `already_linked`       |
  | `provider_already_linked` (409)                         | `provider_linked`      |
  | `last_sign_in_method` (409)                             | `last_method`          |
  | `provider_unavailable`, network, timeout, 5xx, 429      | `unavailable`          |
  | HTTP 401                                                | none: the session ends |
  | anything else, a malformed callback or `success: false` | `generic`              |

- **FR12** An aborted attempt shows nothing.

## 4. Non-functional requirements

- **NFR1** 100% unit and integration coverage, Stryker `break` 100, no suppression.
- **NFR2** WCAG 2.1 AA in every L8 style: names, focus order, visible focus, 44 px targets, 375 px
  without sideways scroll, forced colours; no new axe exception. No axe rule tests non-text
  contrast, so the gaps under the 3:1 of SC 1.4.11 are recorded here, owner-accepted until
  issue #276 because the colours follow Figma and the UI kit:
  - `tinted`: the bin (2.2:1 on the fill) and the border (2.2:1 on the fill, 2.5:1 on the white
    card), which with the fill are the only visual signs that a tile is linked;
  - `badge`: the status badge (2.64:1), and the bin on hover (2.96:1) and pressed (2.57:1); the
    bin at rest passes at 4.48:1, and its busy `#D0D4D8` is a disabled state, which is exempt;
  - `labelled`: none; the pill's text is 15.95:1 on white, and its word or glyph, not a border,
    identifies the control.
- **NFR3** `code`, `state` and provider identifiers never reach logs, Sentry, the DOM or the history
  of the settings tab.
- **NFR4** No growth of the auth page's eager path beyond the 1 kB gzip already allowed. The two
  trial seams (L8) and the `badge` and `labelled` renderers load in the lazy settings chunk only.
- **NFR5** Works in Chromium, Firefox and WebKit on desktop, and in the two mobile projects. During
  the trial this is proven on the page for `tinted` only (L9).
- **NFR6** Existing visual baselines change only for the social card. The trial adds and changes
  none: the page renders `tinted`, and `badge` and `labelled` have no baseline (L9).

## 5. Non-goals

Account merging, re-authentication before linking, link dates, the auto-link at sign-in
(user-service #468), and production enablement. A runtime or per-user tile style (L9), a restyle
of the unlinked, display-only or loading tiles or of the L6 row (L8), adopting the toolkit
`UiButton` for CRM's other buttons, and any toolkit change: a 44 px action slot with a forwarded
ref for `UiActionIconBar` goes upstream as a follow-up.
