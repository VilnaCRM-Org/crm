---
status: 'complete'
workflowType: 'local-verification-guide'
project_name: 'crm'
date: '2026-11-18'
slug: 'social-sign-in'
inputDocuments:
  - 'specs/social-sign-in/planning-artifacts/prd-social-sign-in-2026-11-18.md'
  - 'specs/social-sign-in/planning-artifacts/architecture-social-sign-in-2026-11-18.md'
---

# Local Verification Guide: Social Sign-In

Predecessors: [PRD](prd-social-sign-in-2026-11-18.md) (D4, FR16-FR19) ·
[architecture](architecture-social-sign-in-2026-11-18.md) (§3.5, §3.6).

> This guide describes the repository **after** stories S1.1 and S1.2 land. Today Mockoon serves
> only the pinned `v2.8.0` spec, which has no `/api/auth/social/*` routes. Story S1.3 publishes
> this guide as `docs/social-sign-in-local.md`.

## 1. Pick a mode

| Mode     | `OAUTH_MODE` | Provider screen           | Backend that answers the callback  | Keys you need            |
| -------- | ------------ | ------------------------- | ---------------------------------- | ------------------------ |
| Mock     | `mock`       | Mockoon mock consent page | Mockoon (canned per scenario)      | none                     |
| Provider | `provider`   | **real** Google / GitHub  | Mockoon (any code → signed in)     | client **ID** only       |
| Backend  | n/a          | real Google / GitHub      | **real user-service**, run locally | client ID **and** secret |

Start with Mock to see every screen, then Provider to prove your Google and GitHub
registrations, and use Backend only when you need the real token exchange and account linking.

The redirect URI is always a **frontend** URL — the SPA relays the code to the API (PRD D1):

| Provider | Dev server (port 3000)                         | Prod-parity stack (port 3001)                  |
| -------- | ---------------------------------------------- | ---------------------------------------------- |
| Google   | `http://localhost:3000/auth/callback/google`   | `http://localhost:3001/auth/callback/google`   |
| GitHub   | `http://localhost:3000/auth/callback/github`   | `http://localhost:3001/auth/callback/github`   |
| Facebook | `http://localhost:3000/auth/callback/facebook` | `http://localhost:3001/auth/callback/facebook` |
| Twitter  | `http://localhost:3000/auth/callback/twitter`  | `http://localhost:3001/auth/callback/twitter`  |

Use `localhost`, not `127.0.0.1` or a `*.localhost` subdomain: Google rejects non-public
hosts other than `localhost`, and the flow cookie only reaches the API when the SPA and the API
share the `localhost` site.

## 2. Mock mode (no accounts needed)

1. Leave `OAUTH_MODE=mock` in `.env` (the default the template copies).
2. Start the stack:

   ```bash
   make start
   ```

3. Open `http://localhost:3000/sign-in` and activate the Google button.
4. Mockoon's consent page lists one link per outcome. Expected results:

   | Link                    | You should see                                                  |
   | ----------------------- | --------------------------------------------------------------- |
   | Allow                   | Signed in, landing on `/` (or the protected page you came from) |
   | Allow (2FA account)     | The two-factor challenge (or the "finish with password" notice) |
   | Deny                    | "Sign-in was cancelled" + Try again + Back to sign in           |
   | Expired / invalid state | "The sign-in link expired" + Try again                          |
   | Unverified email        | "Your Google email is not verified" + Back to sign in           |
   | No email                | "Google did not share an email address" + Back to sign in       |
   | Duplicate email         | "Sign in with your email and password instead"                  |
   | Provider unavailable    | "Google is not responding" + Try again                          |

5. After any outcome the address bar shows `/auth/callback/google` with **no** `code` or
   `state` in it.

## 3. Register a Google OAuth client (for Provider and Backend modes)

1. Open <https://console.cloud.google.com/> and create a project, e.g. `vilnacrm-local`.
2. Go to **APIs & Services → OAuth consent screen** (shown as **Google Auth Platform** in newer
   consoles) and configure it:
   - **Branding:** app name `VilnaCRM (local)`, your support email.
   - **Audience:** user type **External**, publishing status **Testing**, and add your own
     Google account under **Test users** — only test users can sign in while the app is in
     Testing.
   - **Data access:** add the scopes `openid`, `.../auth/userinfo.email`,
     `.../auth/userinfo.profile` (all non-sensitive, so no verification is needed).
3. Go to **Clients → Create client** (older consoles: **Credentials → Create credentials → OAuth
   client ID**):
   - Application type: **Web application**, name `crm-localhost`.
   - **Authorized JavaScript origins:** `http://localhost:3000`, `http://localhost:3001`.
   - **Authorized redirect URIs:** the two Google rows from the table in §1.
4. Copy the **Client ID** (`….apps.googleusercontent.com`). The **Client secret** is needed only
   for Backend mode — keep it in your password manager; it never goes into the crm repository.

Changes to redirect URIs can take a few minutes to propagate.

## 4. Register a GitHub OAuth App

GitHub allows exactly one callback URL per OAuth App and the port must match, so create one app
per port you use.

1. Open **GitHub → Settings → Developer settings → OAuth Apps → New OAuth App**
   (<https://github.com/settings/developers>).
2. Fill in:
   - Application name: `VilnaCRM local :3000`
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:3000/auth/callback/github`
   - Leave **Enable Device Flow** off.
3. **Register application**, then copy the **Client ID**. Click **Generate a new client secret**
   only if you plan to use Backend mode, and store it outside the repository.
4. Repeat with `:3001` values if you also test the prod-parity stack.

To use an organization-owned app instead, create it under the organization's
**Settings → Developer settings → OAuth Apps**; the fields are the same.

### Facebook and Twitter/X (optional)

- **Facebook:** <https://developers.facebook.com/apps> → Create app → use case "Authenticate and
  request data from users with Facebook Login" → Facebook Login → Settings → **Valid OAuth
  Redirect URIs**: the Facebook rows from §1. Keep the app in Development mode; add yourself as
  a tester.
- **Twitter/X:** <https://developer.x.com/en/portal/dashboard> → your Project → App → **User
  authentication settings** → OAuth 2.0, type **Web App**, callback URI: the Twitter rows from
  §1, website URL `http://localhost:3000`. Note that the backend rejects providers that do not
  return a verified email (`provider_email_unavailable`).

## 5. Provider mode (real consent screen, Mockoon backend)

1. Edit your local, untracked `.env`:

   ```env
   OAUTH_MODE=provider
   OAUTH_SPA_ORIGIN=http://localhost:3000
   OAUTH_GOOGLE_CLIENT_ID=<your client id>.apps.googleusercontent.com
   OAUTH_GITHUB_CLIENT_ID=<your github client id>
   ```

   Leave a provider's ID empty to keep it on the mock consent page.

2. Apply it without rebuilding the SPA:

   ```bash
   make mockoon-restart
   ```

3. Open `http://localhost:3000/sign-in`, activate Google: you see Google's real account chooser
   and consent screen; after **Continue** you land back in the app signed in.
4. Repeat with GitHub: GitHub's "Authorize VilnaCRM local :3000" screen, then back signed in.
5. Deny on the provider screen to see the "cancelled" view.

Mockoon does not exchange the code, so the identity is canned — this mode proves your
registrations, redirect URIs and the browser round trip, not account linking.

For the prod-parity stack on port 3001, set `OAUTH_SPA_ORIGIN=http://localhost:3001`, use the
`:3001` client IDs (GitHub), and start it with `make start-prod`.

## 6. Backend mode (real user-service)

1. Clone and start user-service following its README
   (<https://github.com/VilnaCRM-Org/user-service>), on a revision that contains
   `/api/auth/social/*` (its `main` today).
2. In user-service's local env file set, per provider you registered:

   ```env
   OAUTH_GOOGLE_CLIENT_ID=<client id>
   OAUTH_GOOGLE_CLIENT_SECRET=<client secret>
   OAUTH_GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback/google
   OAUTH_GITHUB_CLIENT_ID=<client id>
   OAUTH_GITHUB_CLIENT_SECRET=<client secret>
   OAUTH_GITHUB_REDIRECT_URI=http://localhost:3000/auth/callback/github
   CORS_ALLOW_ORIGIN='^http://localhost:(3000|3001)$'
   ```

   The redirect URI overrides user-service's default (which points at its own callback and
   would leave you on a JSON page).

3. Expose the user-service API on `http://localhost:8080` and stop crm's Mockoon so the port is
   free (`docker compose stop mockoon`). The SPA then needs no change: its API base URL and the
   dev server's CSP `connect-src` already name `http://localhost:8080`. Pointing
   `REACT_APP_MOCKOON_URL` at any other origin also requires that origin in the CSP, which is
   why the same port is the recommended setup.
4. Sign in with Google or GitHub. A new email creates a user; an existing confirmed email links
   the provider to that account; an account with 2FA asks for the second factor.

## 7. Troubleshooting

| Symptom                                                                      | Cause and fix                                                                                                                                         |
| ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Google "Error 400: redirect_uri_mismatch"                                    | The URI in the client differs from §1 (port, path, trailing slash). Fix it in the console and wait a few minutes.                                     |
| Google "Access blocked: … has not completed the Google verification process" | Your account is not a test user — add it under Audience → Test users.                                                                                 |
| GitHub "The redirect_uri is not associated with this application"            | The OAuth App's callback URL has a different port or path; use one app per port.                                                                      |
| You land on a raw JSON page                                                  | The provider redirected to the **API** callback. Backend mode: set `OAUTH_<P>_REDIRECT_URI` to the SPA URL.                                           |
| "Missing sign-in parameters" right after consent                             | The flow cookie did not reach the API: SPA and API are on different sites (`127.0.0.1` vs `localhost`) or the browser blocks cookies for `localhost`. |
| Console: CORS error on `/callback`                                           | `OAUTH_SPA_ORIGIN` does not equal the page origin exactly (scheme, host and port); run `make mockoon-restart` after fixing it.                        |
| Still the mock page in Provider mode                                         | The provider's client ID is empty, or Mockoon was not restarted.                                                                                      |
| "The sign-in link expired"                                                   | The state lives 10 minutes (`OAUTH_STATE_TTL_SECONDS`) and is single-use; start again from the button.                                                |

## 8. Safety

- Client IDs are public identifiers but stay in the untracked `.env` anyway; client secrets
  never enter the crm repository, its issues or pull requests (`make scan-secrets` would flag
  them).
- Keep the Google app in **Testing** and the Facebook app in **Development**; delete the clients
  when you no longer need them.
