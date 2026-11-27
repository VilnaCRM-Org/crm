---
status: 'draft'
workflowType: 'prd'
bmadCommand: 'create-prd'
project_name: 'crm'
date: '2026-11-23'
slug: 'social-account-linking'
inputDocuments:
  - 'specs/social-sign-in/planning-artifacts/prd-social-sign-in-2026-11-18.md'
  - 'specs/user-settings/planning-artifacts/prd-user-settings-2026-10-06.md'
  - 'user-service #520'
---

# PRD: Social Account Linking in Settings

## 1. Goal

A signed-in user links Google, GitHub, Facebook or Twitter to the account they already have, sees
which providers are linked, and unlinks one, from the "Соціальні мережі" card of `/settings`.
Linking is not a sign-in: it never issues, replaces or ends a session.

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
  The bin asks first, in one row under the tiles, because a phone tile is too narrow for a question.
- **L7 — Last sign-in method.** user-service refuses to unlink the last way to sign in. The SPA
  explains the refusal; it does not guess in advance whether the account has a password.

## 3. Functional requirements

- **FR1** `linkedSocialProviders` is read when the card mounts, never from the Apollo cache. Until it
  answers, and if it fails, every tile stays display-only, so the card never offers to link a
  provider that may already be linked. A failure shows a localized message and "Try again".
- **FR2** An unlinked tile is a button. Activating it opens the popup synchronously, then calls
  `initiateSocialLinkUser(provider)`; only an http(s) `authorizationUrl` is followed. A blocked popup
  shows the `blocked` message and calls nothing.
- **FR3** The popup returns to `/auth/callback/:provider`. A `state` that starts with `link.` never
  reaches `completeSocialSignInUser`, whatever is in storage.
- **FR4** The popup strips the query, hands `code`, `state` and `error` to the settings tab over a
  same-origin `BroadcastChannel`, and closes. If it cannot close itself, it tells the user to return
  to settings; it offers no retry.
- **FR5** The settings tab ignores a message whose provider or `state` is not its own attempt's, and
  treats every other field as untrusted. It then calls `completeSocialLinkUser` once. A `state` that
  `initiateSocialLinkUser` did not mark is refused. The popup has no opener once it leaves.
- **FR6** After an attempt ends (a new attempt, or leaving the page), nothing it later answers
  changes the card, even when it ends while `initiateSocialLinkUser` is in flight. Its popup closes
  if it has not left for the provider yet; a window already there has no opener and is the user's
  to close, and its return closes itself.
- **FR7** A refusal that the provider is already linked shows the tile as linked. A result changes only its own provider's tile, so answers that arrive out of order, or an
  older list answer, never undo it.
- **FR8** A linked tile shows Figma `315:11754` (fill `#E8F7FF`, border `#1EAEFF`) and an unlink
  button named for its provider. The bin is Figma's `#1EAEFF` (owner, 2026-11-23: every colour follows Figma). At
  2.2:1 on the fill it stays under the 3:1 of SC 1.4.11, accepted until issue #276.
- **FR9** The bin shows the L6 row, named for its provider, with focus on Cancel. Cancel and Escape
  close it and focus the bin; confirming closes it, focuses the bin and calls `unlinkSocialProviderUser(provider)` once.
- **FR10** After a tile changes state, keyboard focus moves to the tile's new control.
- **FR11** Success and failure each raise one notification, announced by the settings live regions:

  | Source                                             | Failure kind           |
  | -------------------------------------------------- | ---------------------- |
  | popup blocked                                      | `blocked`              |
  | provider `error`                                   | `cancelled`            |
  | no `code`, `invalid_state`, `state_expired`        | `expired`              |
  | `identity_linked_to_other_user` (409)              | `already_linked`       |
  | `provider_already_linked` (409)                    | `provider_linked`      |
  | `last_sign_in_method` (409)                        | `last_method`          |
  | `provider_unavailable`, network, timeout, 5xx, 429 | `unavailable`          |
  | HTTP 401                                           | none: the session ends |
  | anything else, including a malformed answer        | `generic`              |

- **FR12** An aborted attempt shows nothing.

## 4. Non-functional requirements

- **NFR1** 100% unit and integration coverage, Stryker `break` 100, no suppression.
- **NFR2** WCAG 2.1 AA: names, focus order, visible focus, 44 px targets, 375 px without sideways
  scroll, forced colours; no new axe exception. The bin's contrast is the one accepted gap (FR8).
- **NFR3** `code`, `state` and provider identifiers never reach logs, Sentry, the DOM or the history
  of the settings tab.
- **NFR4** No growth of the auth page's eager path beyond the 1 kB gzip already allowed.
- **NFR5** Works in Chromium, Firefox and WebKit on desktop, and in the two mobile projects.
- **NFR6** Existing visual baselines change only for the social card.

## 5. Non-goals

Account merging, re-authentication before linking, link dates, the auto-link at sign-in
(user-service #468), and production enablement.
