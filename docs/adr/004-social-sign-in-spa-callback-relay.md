# ADR-004: Relay the social OAuth callback through the SPA

- Status: Proposed
- Deciders: [@kravalg](https://github.com/kravalg)
- Date: 2026-11-18

**Technical Story**: The sign-in and sign-up pages showed Google, GitHub, Facebook and Twitter/X
buttons that opened a path no backend serves. user-service now ships
`GET /api/auth/social/{provider}` and its callback; this records how the SPA consumes them
(planning bundle `specs/social-sign-in/`, issue
[#150](https://github.com/VilnaCRM-Org/crm/issues/150)).

## Context and Problem Statement

The user-service callback, `GET /api/auth/social/{provider}/callback`, answers **JSON** — an
access token, or a pending 2FA session — rather than redirecting back to a frontend. Its default
redirect URI points at the API itself, so a browser sent there by the provider ends on a raw JSON
page. The session token in this SPA is memory-only (`useAuthStore`), so the result also has to
reach the same tab and the same app instance that started the flow.

## Decision Drivers

- No user-service code change: the state record already stores the redirect URI and re-sends it
  at token exchange, so pointing it elsewhere is configuration.
- The memory-only token: a new tab or a popup cannot hand its result to the opener without a
  cross-window messaging protocol.
- The auth paint path is budget-bound (mobile Lighthouse): the callback handling must load lazily.
- The provider code is single-use, and React's StrictMode runs mount effects twice.

## Considered Options

1. **SPA callback relay** — providers redirect to `/auth/callback/:provider` in the SPA, which
   forwards `code` and `state` to the user-service callback with a credentialed `fetch`.
2. **Popup with `postMessage`** — the provider flow runs in a popup that posts its result back.
3. **Backend redirect** — user-service redirects to the SPA with the token in the URL fragment.

## Decision Outcome

Chosen option: **"SPA callback relay"**, because it needs only configuration on the backend
(`OAUTH_<PROVIDER>_REDIRECT_URI` set to the SPA route), keeps the token out of every URL, and
returns to the same tab. Implemented by:

- `socialSignInNavigator` — same-tab `location.assign` to the initiate endpoint, after saving the
  intended destination in `sessionStorage` (`socialSignInDestinationSource`, validated by
  `loginRedirectTarget` on save and on read);
- the `socialCallback` route (`/auth/callback/:provider`, lazy `social-callback` chunk) and
  `useSocialCallback`, which read the query once, strip it with `history.replaceState`, and relay
  through a single-flight cache keyed by `state`;
- `SocialSignInRepository` (credentialed, never retried) → `SocialSignInTransformer`
  (`error_code` → message kind) → `SocialSignInProvider` (writes the token like a password
  sign-in) behind `AUTH_TOKENS`;
- `RequestConfig.credentials` on the shared `HttpsClient`, forwarded to `fetch` only when set.

## Positive Consequences

- One click returns the user signed in, in the same tab, to the page they were heading to.
- The code, state and tokens never stay in the address bar or the history entry.
- Every documented `error_code` and a provider-side cancel has its own message and recovery.

## Negative Consequences

- The flow-binding cookie (`SameSite=Lax`) reaches the API only when the SPA and the API share a
  site: `localhost` in development, one registrable domain in production. A deployment that puts
  them on different sites needs a different binding.
- The API has to allow credentialed CORS from the SPA origin, never a wildcard.
- Until user-service tags a release with these operations, the contract is a hand-written zod
  schema ("Pending REST operations" in `src/api/contracts/README.md`).
- A 2FA account is told to finish with its password until the 2FA challenge (PR #377) lands.

## Pros and Cons of the Options

### SPA callback relay

The provider returns to an SPA route that relays to user-service.

#### Good (SPA callback relay)

- No backend change; the token travels only in a response body.

#### Bad (SPA callback relay)

- Requires same-site deployment and credentialed CORS.

### Popup with postMessage

The flow runs in a popup window.

#### Good (Popup with postMessage)

- The sign-in page stays loaded underneath.

#### Bad (Popup with postMessage)

- Popup blockers, a cross-window protocol to secure, and poor mobile behaviour.

### Backend redirect

user-service redirects to the SPA with the token in the fragment.

#### Good (Backend redirect)

- No credentialed cross-origin request from the SPA.

#### Bad (Backend redirect)

- Needs a user-service change and puts a bearer token in a URL.

## Links

- [Planning bundle](../../specs/social-sign-in/planning-artifacts/prd-social-sign-in-2026-11-18.md)
- [Local verification guide](../social-sign-in-local.md)
- [Issue #150](https://github.com/VilnaCRM-Org/crm/issues/150)
