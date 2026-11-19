# Social sign-in: local verification

How to try the Google, GitHub, Facebook and Twitter/X sign-in buttons on your machine. The SPA
talks to user-service over GraphQL only: two mutations, `initiateSocialSignInUser` and
`completeSocialSignInUser`, which are pending until user-service declares them
(`src/api/contracts/pending/social-sign-in.graphql`) and are answered locally by the Apollo mock.
The design and the plan are in
[`specs/social-sign-in/`](../specs/social-sign-in/planning-artifacts/prd-social-sign-in-2026-11-18.md).

> `.env` is untracked and `make` only creates it when it is missing. If yours predates this
> feature, copy the `OAUTH_*` block from `.env.example` into it; `make check-env-sync` fails
> until you do.

## 1. How a sign-in runs

1. A provider button opens `/auth/callback/<provider>`, which asks `initiateSocialSignInUser` for
   the provider's authorization URL and a `state`, keeps the `state`, and sends the browser there.
2. The provider (or the mock consent page) redirects back to `/auth/callback/<provider>` with the
   `state` and either a `code` or, when you cancel, `error=access_denied`.
3. A cancel shows the cancelled view. Otherwise the page accepts only the `state` this tab started
   with, then calls `completeSocialSignInUser` and signs in.

| Mode     | `OAUTH_MODE` | Provider screen        | Answers the mutations | Keys you need |
| -------- | ------------ | ---------------------- | --------------------- | ------------- |
| Mock     | `mock`       | Mockoon consent page   | Apollo mock           | none          |
| Provider | `provider`   | the real provider page | Apollo mock           | client ID     |

In Provider mode a provider reaches its real screen only when its `OAUTH_<PROVIDER>_CLIENT_ID` is
set; any provider without one, Facebook and Twitter/X included, stays on the Mockoon page.

The redirect URI is always a **frontend** URL:

- dev server: `http://localhost:3000/auth/callback/<provider>`
- prod-parity stack: `http://localhost:3001/auth/callback/<provider>`

where `<provider>` is `google`, `github`, `facebook` or `twitter`. Use `localhost`, not
`127.0.0.1` or a `*.localhost` subdomain: Google rejects non-public hosts other than `localhost`.

## 2. Mock mode (no accounts needed)

1. Leave `OAUTH_MODE=mock` in `.env` (the template default).
2. Start the stack:

   ```bash
   make start
   ```

3. Open `http://localhost:3000/sign-in` and activate the Google button.
4. The mock consent page lists one link per outcome. What you should see (English copy shown;
   Ukrainian is the main language):
   - **Allow**: signed in, on `/` or on the protected page you came from.
   - **Allow (2FA account)**: "Your account uses two-factor authentication…" and Back to sign in.
   - **Deny**: "Sign-in with Google was cancelled…", Try again and Back to sign in.
   - **Expired state**: "Your sign-in attempt expired…" and Try again.
   - **Unverified email**: "Your Google email address is not verified…" and Try again.
   - **No email shared**: "Google did not share your email address…" and Try again.
   - **Duplicate email**: "…cannot be linked automatically. Sign in with your email…".
   - **Provider unavailable**: "Google is not responding right now…" and Try again.
5. After an error or a cancel the address bar shows `/auth/callback/google` with no `code` or
   `state`; after Allow it shows the page you were sent to. Pressing Back from the consent page
   returns to `/sign-in`.

## 3. Register a Google OAuth client

Needed for Provider mode.

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
4. Copy the **Client ID** (`….apps.googleusercontent.com`). The **Client secret** is not used by
   the local mock; keep it in your password manager for when user-service runs the real exchange,
   never in this repository.

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
3. **Register application** and copy the **Client ID**. A client secret is not needed locally.
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
  website `http://localhost:3000`.

## 5. Provider mode (real consent screen, Apollo mock)

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
   make apollo-restart
   ```

3. Open `http://localhost:3000/sign-in` and activate Google: Google's account chooser and consent
   screen appear, and after **Continue** you are back in the app, signed in.
4. Repeat with GitHub: "Authorize VilnaCRM local :3000", then back, signed in.
5. Deny on a provider screen to see the "cancelled" view.

The Apollo mock does not exchange the code, so the identity is canned: this mode proves your
registrations, redirect URIs and the browser round trip, not account linking.

For the prod-parity stack on port 3001, set `OAUTH_SPA_ORIGIN=http://localhost:3001`, use the
`:3001` GitHub app, and start it with `make start-prod`. That target reuses running containers,
so after changing `.env` recreate its Apollo mock as well:

```bash
docker compose -f docker-compose.test.yml up -d --force-recreate --no-deps apollo
```

## 6. Against a real user-service

This needs a user-service build that declares `initiateSocialSignInUser` and
`completeSocialSignInUser`; its released schema does not yet. When it does, configure its OAuth
clients with the redirect URIs from §1 (`OAUTH_<PROVIDER>_REDIRECT_URI`), point the SPA's
GraphQL URL at it, and the pin bump removes the pending contract.

## 7. Troubleshooting

- **Google "Error 400: redirect_uri_mismatch".** The URI in the client differs from §1 (port,
  path or a trailing slash). Fix it in the console and wait a few minutes.
- **Google "Access blocked: … has not completed the Google verification process".** Your account
  is not a test user: add it under Audience → Test users.
- **GitHub "The redirect_uri is not associated with this application".** The app's callback URL
  has a different port or path; use one app per port.
- **The provider redirects to the wrong port.** `OAUTH_SPA_ORIGIN` must equal the page origin
  exactly (scheme, host and port); run `make apollo-restart` after fixing it.
- **Still the mock page in Provider mode.** That provider's client ID is empty, or the Apollo
  mock was not restarted.
- **"Your sign-in attempt expired".** The state was not started in this tab (for example the
  callback was opened in another tab or the Apollo mock restarted in between), or it was already
  used: start again from the button.

## 8. Safety

- Client IDs are public identifiers but stay in the untracked `.env` anyway. Client secrets never
  enter this repository, its issues or its pull requests; `make scan-secrets` would flag them.
- Keep the Google app in **Testing** and the Facebook app in **Development**, and delete the
  clients when you no longer need them.
