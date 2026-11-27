---
status: 'draft'
workflowType: 'architecture'
bmadCommand: 'create-architecture'
project_name: 'crm'
date: '2026-11-23'
slug: 'social-account-linking'
inputDocuments:
  - 'specs/social-account-linking/planning-artifacts/prd-social-account-linking-2026-11-23.md'
---

# Architecture: Social Account Linking in Settings

## 1. Flow

```mermaid
sequenceDiagram
  participant S as Settings tab
  participant P as Popup
  participant G as user-service (GraphQL)
  participant V as Provider
  S->>P: window.open (in the click)
  S->>G: initiateSocialLinkUser(provider)
  G-->>S: authorizationUrl, state "link.…"
  S->>P: drop the opener, go to authorizationUrl
  P->>V: consent
  V-->>P: /auth/callback/:provider?code&state
  P->>S: BroadcastChannel { provider, code, state, error }
  P->>P: close
  S->>S: compare state
  S->>G: completeSocialLinkUser(provider, code, state)
  G-->>S: success
```

## 2. Pieces

| Piece            | Where                                                                                        |
| ---------------- | -------------------------------------------------------------------------------------------- |
| Pending contract | `src/api/contracts/pending/social-account-linking.graphql` (`# pending-against: v2.8.0`)     |
| Shared leaves    | `src/modules/user/lib/social-link/`: state guard, channel adapter, window navigator          |
| Repository       | settings `GraphQLSocialLinkRepository`; the list uses `queryDeduplication: false`            |
| Transformer      | settings `GraphQLSocialLinkTransformer`; zod results, `error_code` to failure kind           |
| Data provider    | settings `SocialLinkProvider`: `linked`, `start`, `complete`, `unlink`                       |
| Hooks            | `use-social-links`, `use-social-link-attempt`, `use-social-unlink`, `use-social-link-settle` |
| View             | `social-networks` card and `social-tile`; toasts through the page's `ToastQueue`             |
| Popup return     | auth `social-link-return-view` and `use-social-link-return`, chosen by the `link.` prefix    |
| Local mock       | `docker/apollo-server/lib/social-link-resolvers.ts`                                          |

## 3. Why these choices

- **`queryDeduplication: false`** on the list: StrictMode aborts the first request, and a
  deduplicated second one would reuse the aborted answer.
- **The `link.` prefix** rather than a popup check: `window.opener`, `window.toolbar` and
  `window.name` are each lost on some return from a provider, and storage is lost when the return
  lands on another origin. `state` travels in the URL.
- **A change touches one provider** (FR7): the tiles act only once the list has answered, and each
  result adds or removes its own provider, so the order of answers cannot undo a change.
- **`initiate` checks its signal after it answers** (FR6): an abort that fired during the call has
  already happened, so a listener added afterwards would never run.
- **Channel messages are narrowed by hand**: any same-origin page can post to the channel, and zod
  would reach the auth paint path through the callback page.

## 4. Differences from the prototype

`crm-worktrees/social-account-linking` proved the flow. Changed here: toasts instead of #392's
notifications; the prefix instead of `isPopup()`; no cross-window storage; FR1, FR6, FR7 and the split
`already_linked` / `provider_linked` kinds.

## 5. Upstream

user-service #520 must settle L3 and L4 and provide the three refusal codes of FR11.
