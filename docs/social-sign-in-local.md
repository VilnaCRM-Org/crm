# Social sign-in: local verification

How to try the Google, GitHub, Facebook and Twitter/X sign-in buttons on your machine, against
the Mockoon backend or a real user-service. The design is
[ADR-004](adr/004-social-sign-in-spa-callback-relay.md); the plan is
[`specs/social-sign-in/`](../specs/social-sign-in/planning-artifacts/prd-social-sign-in-2026-11-18.md).

> `.env` is untracked and `make` only creates it when it is missing. If yours predates this
> feature, copy the `OAUTH_*` block from `.env.example` into it; `make check-env-sync` fails
> until you do.

## 1. Pick a mode

| Mode     | `OAUTH_MODE` | Provider screen      | Answers the callback | Keys you need |
| -------- | ------------ | -------------------- | -------------------- | ------------- |
| Mock     | `mock`       | Mockoon consent page | Mockoon, per link    | none          |
| Provider | `provider`   | real Google / GitHub | Mockoon, any code    | client ID     |
| Backend  | n/a          | real Google / GitHub | local user-service   | ID and secret |

Start with Mock to see every screen, then Provider to prove your Google and GitHub registrations,
and use Backend only when you need the real token exchange and account linking.

The redirect URI is always a **frontend** URL, because the SPA relays the code to the API:

- dev server: `http://localhost:3000/auth/callback/<provider>`
- prod-parity stack: `http://localhost:3001/auth/callback/<provider>`

where `<provider>` is `google`, `github`, `facebook` or `twitter`. Use `localhost`, not
`127.0.0.1` or a `*.localhost` subdomain: Google rejects non-public hosts other than `localhost`,
and the flow cookie only reaches the API when the SPA and the API share the `localhost` site.

## 2. Mock mode (no accounts needed)

1. Leave `OAUTH_MODE=mock` in `.env` (the template default).
2. Start the stack:

   ```bash
   make start
   ```

3. Open `http://localhost:3000/sign-in` and activate the Google button.
4. Mockoon's consent page lists one link per outcome. What you should see (English copy shown;
   Ukrainian is the main language):
   - **Allow**: signed in, on `/` or on the protected page you came from.
   - **Allow (2FA account)**: "Your account uses two-factor authentication…" and Back to sign in.
   - **Deny**: "Sign-in with Google was cancelled…", Try again and Back to sign in.
   - **Expired state** and **Invalid state**: "Your sign-in attempt expired…" and Try again.
   - **Unverified email**: "Your Google email address is not verified…" and Try again.
   - **No email shared**: "Google did not share your email address…" and Try again.
   - **Duplicate email**: "…cannot be linked automatically. Sign in with your email…".
   - **Provider mismatch**: "The sign-in response came from a different provider…".
   - **Provider unavailable**: "Google is not responding right now…" and Try again.
5. After any outcome the address bar shows `/auth/callback/google` with no `code` or `state`.

## 3. Register a Google OAuth client

Needed for Provider and Backend modes.

1. Open <https://console.cloud.google.com/> and create a project, for example `vilnacrm-local`.
2. Open **APIs & Services → OAuth consent screen** (shown as **Google Auth Platform** in newer
   consoles):
   - **Branding:** app name `VilnaCRM (local)` and your support email.
   - **Audience:** user type **External**, status **Testing**, and your own Google account under
     **Test users**. Only test users can sign in while the app is in Testing.
   - **Data access:** the scopes `openid`, `.../auth/userinfo.email` and
     `.../auth/userinfo.profile`. They are non-sensitive, so no verification is needed.
3. Open **Clients → Create client** (older consoles: **Credentials → Create credentials → OAuth
   client ID**):
   - Application type **Web application**, name `crm-localhost`.
   - **Authorized JavaScript origins:** `http://localhost:3000` and `http://localhost:3001`.
   - **Authorized redirect URIs:** `http://localhost:3000/auth/callback/google` and
     `http://localhost:3001/auth/callback/google`.
4. Copy the **Client ID** (`….apps.googleusercontent.com`). The **Client secret** is needed only
   for Backend mode: keep it in your password manager, never in this repository.

A change to the redirect URIs can take a few minutes to apply.

## 4. Register a GitHub OAuth App

GitHub allows one callback URL per OAuth App and the port must match, so create one app per port
you use.

1. Open **GitHub → Settings → Developer settings → OAuth Apps → New OAuth App**
   (<https://github.com/settings/developers>).
2. Fill in:
   - Application name: `VilnaCRM local :3000`
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:3000/auth/callback/github`
   - Leave **Enable Device Flow** off.
3. **Register application** and copy the **Client ID**. Generate a client secret only for Backend
   mode, and store it outside the repository.
4. Repeat with the `:3001` values if you also use the prod-parity stack.

An organization-owned app is created the same way under the organization's
**Settings → Developer settings → OAuth Apps**.

### Facebook and Twitter/X (optional)

- **Facebook:** <https://developers.facebook.com/apps> → Create app → use case "Authenticate and
  request data from users with Facebook Login" → Facebook Login → Settings → **Valid OAuth
  Redirect URIs**: the two Facebook callback URLs. Keep the app in Development mode and add
  yourself as a tester.
- **Twitter/X:** <https://developer.x.com/en/portal/dashboard> → your Project → App → **User
  authentication settings** → OAuth 2.0, type **Web App**, the two Twitter callback URLs, and
  website `http://localhost:3000`. The backend rejects a provider that returns no verified email
  (`provider_email_unavailable`).

## 5. Provider mode (real consent screen, Mockoon backend)

1. Edit your local `.env`:

   ```text
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

3. Open `http://localhost:3000/sign-in` and activate Google: Google's account chooser and consent
   screen appear, and after **Continue** you are back in the app, signed in.
4. Repeat with GitHub: "Authorize VilnaCRM local :3000", then back, signed in.
5. Deny on a provider screen to see the "cancelled" view.

Mockoon does not exchange the code, so the identity is canned: this mode proves your
registrations, redirect URIs and the browser round trip, not account linking.

For the prod-parity stack on port 3001, set `OAUTH_SPA_ORIGIN=http://localhost:3001`, use the
`:3001` GitHub app, and start it with `make start-prod`.

## 6. Backend mode (real user-service)

1. Clone and start user-service following its README
   (<https://github.com/VilnaCRM-Org/user-service>), on a revision that has
   `/api/auth/social/*` (its `main` today).
2. In user-service's local env file set, per provider you registered:

   ```text
   OAUTH_GOOGLE_CLIENT_ID=<client id>
   OAUTH_GOOGLE_CLIENT_SECRET=<client secret>
   OAUTH_GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback/google
   OAUTH_GITHUB_CLIENT_ID=<client id>
   OAUTH_GITHUB_CLIENT_SECRET=<client secret>
   OAUTH_GITHUB_REDIRECT_URI=http://localhost:3000/auth/callback/github
   CORS_ALLOW_ORIGIN='^http://localhost:(3000|3001)$'
   ```

   The redirect URI overrides user-service's default, which points at its own callback and would
   leave you on a JSON page.

3. Expose the user-service API on `http://localhost:8080` and stop crm's Mockoon so the port is
   free (`docker compose stop mockoon`). The SPA then needs no change: its API base URL and the
   dev server's CSP `connect-src` already name `http://localhost:8080`. Any other origin would
   also have to be added to the CSP.
4. Sign in with Google or GitHub. A new email creates a user, an existing confirmed email links
   the provider to that account, and an account with 2FA is asked to finish with its password.

## 7. Troubleshooting

- **Google "Error 400: redirect_uri_mismatch".** The URI in the client differs from §1 (port,
  path or a trailing slash). Fix it in the console and wait a few minutes.
- **Google "Access blocked: … has not completed the Google verification process".** Your account
  is not a test user: add it under Audience → Test users.
- **GitHub "The redirect_uri is not associated with this application".** The app's callback URL
  has a different port or path; use one app per port.
- **You land on a raw JSON page.** The provider redirected to the API callback. In Backend mode,
  set `OAUTH_<PROVIDER>_REDIRECT_URI` to the SPA URL.
- **"did not return the sign-in details" right after consent.** The flow cookie did not reach the
  API: the SPA and the API are on different sites (`127.0.0.1` against `localhost`), or the
  browser blocks cookies for `localhost`.
- **A CORS error on `/callback` in the console.** `OAUTH_SPA_ORIGIN` must equal the page origin
  exactly (scheme, host and port); run `make mockoon-restart` after fixing it.
- **Still the mock page in Provider mode.** That provider's client ID is empty, or Mockoon was not
  restarted.
- **"Your sign-in attempt expired".** The state lives ten minutes (`OAUTH_STATE_TTL_SECONDS`) and
  is single-use: start again from the button.

## 8. Safety

- Client IDs are public identifiers but stay in the untracked `.env` anyway. Client secrets never
  enter this repository, its issues or its pull requests; `make scan-secrets` would flag them.
- Keep the Google app in **Testing** and the Facebook app in **Development**, and delete the
  clients when you no longer need them.
