# ADR-006: One generated security-header baseline serves production and the dev server

- Status: Approved
- Deciders: [@kravalg](https://github.com/kravalg)
- Date: 2026-09-14

**Technical Story**: The production server emitted no browser security header at all — `serve.json`
declared only `Cache-Control` — and nothing in CI asserted a single response header. Issue
[#113](https://github.com/VilnaCRM-Org/crm/issues/113) asked for a complete, machine-checked
baseline with a Content-Security-Policy that does not break Emotion/MUI styling.

## Context and Problem Statement

The Dockerfile's `production` stage runs `serve -s dist -c /app/serve.json`, so every response
header is whatever `serve.json` declares, and it declared four `Cache-Control` rules. There was no
`Content-Security-Policy`, no `Strict-Transport-Security`, no `X-Frame-Options`, no
`X-Content-Type-Options`, no `Referrer-Policy`, and no `Permissions-Policy`; `public/index.html`
carried no `<meta http-equiv>` fallback; and `security-testing.yml` ran only CodeQL, which never
looks at an HTTP response. Lighthouse's `best-practices` score does not deterministically drop on a
missing CSP, so it could not stand in for a gate.

Two facts constrain any CSP. The app injects styles at runtime — Emotion and MUI write `<style>`
elements into the document with no custom cache and no nonce, MUI sets inline `style` attributes,
and the production build inlines the global stylesheet into the HTML shell
(`output.inlineStyles`) — so `style-src 'self'` alone would render the app unstyled. And the app
connects to origins that are decided in two places: RSBuild inlines `REACT_APP_MOCKOON_URL` /
`REACT_APP_GRAPHQL_URL` at build time, while `APP_CONFIG_API_BASE_URL` / `APP_CONFIG_GRAPHQL_URL`
repoint the same image at container start (issue #145), so the
`connect-src` allowlist cannot be a constant.

## Decision Drivers

- `script-src` must be strict: no `'unsafe-inline'`, no `'unsafe-eval'`, no host wildcard — the
  property that contains an injected script is the whole point of the CSP.
- The Emotion/MUI accommodation must be scoped to `style-src` and documented, not applied
  policy-wide.
- One declarative source of truth, consumed by production and the dev server alike, so the two
  cannot drift; the same root-cause-not-suppression policy every other gate follows.
- "Build once, deploy many" (issue #145) has to survive: a runtime API override must be reachable
  under the enforced policy without a rebuild.
- The gate has to assert the emitted artifact, not config text — the lesson of the preloaded-auth
  seed gate (issue #158).
- The auth-page Lighthouse budget forbids any extra request on the paint path.

## Considered Options

1. **Generated `serve.json` from a JSON policy, `style-src 'unsafe-inline'`, runtime
   `connect-src` extension in the entrypoint** — one policy file renders the `headers` block,
   the container entrypoint appends the `APP_CONFIG_*` origins, the dev server reads the same
   policy, and a CI job boots the production image and asserts every header.
2. **Nonce-based `style-src`** — thread a per-response nonce through an Emotion `CacheProvider`
   and the HTML shell so `'unsafe-inline'` is never granted.
3. **Hand-maintained `serve.json` plus a contract test** — write the headers by hand and pin the
   file's text in a Jest test.
4. **`<meta http-equiv="Content-Security-Policy">` in the HTML shell** — carry the policy in the
   document instead of a response header.

## Decision Outcome

Chosen option: **"Generated `serve.json` from a JSON policy, `style-src 'unsafe-inline'`, runtime
`connect-src` extension in the entrypoint"**, because a nonce is meaningless without a
per-response renderer — `serve` is a static file server, so any nonce would be a constant and
protect nothing — while `'unsafe-inline'` on `style-src` alone leaves `script-src` exactly as
strict as a nonce would, and a generated file is the only shape under which the dev server, the
production image, and the gate provably read the same values.

The artifacts: [`config/security-headers.json`](../../config/security-headers.json) (validated by
`config/security-headers.schema.json`) is the policy; [`scripts/security-headers.js`](../../scripts/security-headers.js)
renders it and refuses a weakened baseline; `scripts/generate-serve-config.js` writes the
`headers` block of `serve.json` from the policy and the tracked `.env.example`
(`make security-headers-generate`, drift-checked by `make lint-security-headers` inside
`make lint`); `scripts/render-security-headers.js` runs from `scripts/docker-entrypoint.sh` and
renders the served `serve.json` from the immutable baseline in `config/` plus the runtime API
origins; `rsbuild.config.ts` sets `server.headers` from
the same policy; and `scripts/ci/check-security-headers.mjs` behind `make check-security-headers`
(the `security headers` job of `security-testing.yml`) boots the `production` image twice and
asserts every header on the HTML shell, a deep route, the manifest, and a hashed asset. The full
directive table is in [`SECURITY.md`](../../SECURITY.md#browser-security-headers-issue-113).

## Positive Consequences

- Every production response carries the complete baseline: the gate asserts the headers of the
  built image's responses on every pull request. That the app renders under the enforced policy
  was verified by hand in headless Chromium against the same image (fully styled, fonts loaded,
  zero console violations, foreign origins blocked) and is exercised continuously by the Firefox
  and WebKit e2e and visual lanes, whose zero-tolerance console gate rejects any CSP violation —
  the lane that caught the inline seed script and the zod eval probe below.
- A regression is caught at three points — the policy loader refuses a weakened baseline, the
  drift gate refuses a hand-edited `serve.json`, and the image gate refuses an artifact whose
  responses differ from the policy — none of which relies on a Lighthouse score.
- The dev server emits the same headers, so a new third-party origin fails on `make start`
  rather than on the deployed image.
- The runtime override path keeps working: a repointed API is allowed by the same container
  start that renders it into the HTML shell, and an invalid value aborts the start.

## Negative Consequences

- `style-src` carries `'unsafe-inline'`: an injected `<style>` or `style` attribute is not
  blocked. The accepted trade-off is that with `script-src 'self'` an attacker cannot execute
  script, and CSS injection alone is a far smaller exfiltration surface; revisit if the app ever
  moves to a server-rendered shell that can mint a per-response nonce.
- Runtime overrides extend `connect-src` rather than replace it, so the build-time API origins
  stay allowed in an environment that overrides them; the entrypoint cannot know which inlined
  fallback an override replaces.
- HSTS only takes effect once the app is served over TLS, and a reverse proxy or CDN in front of
  the container must forward the headers rather than strip them; the gate proves what `serve`
  emits, not what the edge delivers.
- The `security headers` job builds the deployable image on every pull request, the second job
  after the seed gate to do so.
- `Cross-Origin-Opener-Policy` is not part of the baseline: browsers ignore it on a plain-http,
  non-localhost origin and log a console error on every document, which the Playwright suites
  hit at `http://prod:3001` and their zero-tolerance console gate rejects. The app opens no popup
  that needs opener isolation (`window.open` is always `noopener`), so nothing is lost today;
  it returns with any future cross-origin-isolation requirement.
- The document headers (the CSP, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`)
  ride the HTML shell only; the every-response set is HSTS, `nosniff` and
  `Cross-Origin-Resource-Policy`. A document policy on a hashed asset changes nothing in the
  browser, and the extra header bytes on every request measurably moved the `/sign-up` mobile
  Lighthouse score against a floor with no headroom (0.82–0.83 against 0.84).
- Two test-side seams had to become CSP-safe: the Playwright auth-token seed now runs through
  `page.addInitScript` instead of an inline `<script>` the policy blocks, and zod runs in
  `jitless` mode (`src/config/zod.ts`) because its object-schema compiler probes the `Function`
  constructor, which browsers report as a CSP violation even when the throw is caught.

## Pros and Cons of the Options

### Generated serve.json from a JSON policy

One policy file, three consumers, one gate over the emitted image.

#### Good (Generated serve.json from a JSON policy)

- Production, dev server, and gate cannot disagree; a change is one reviewed edit.
- The loader's floors make a weakened baseline impossible to generate or ship.
- Compatible with the static `serve` runtime and the zero-request paint path.

#### Bad (Generated serve.json from a JSON policy)

- `style-src` needs `'unsafe-inline'`.
- `serve.json` becomes a generated file contributors must not edit by hand.

### Nonce-based style-src

Per-response nonce threaded through an Emotion cache and the shell.

#### Good (Nonce-based style-src)

- No `'unsafe-inline'` anywhere in the policy.

#### Bad (Nonce-based style-src)

- `serve` renders nothing per response; the nonce would be a build-time constant, which is
  equivalent to `'unsafe-inline'` while looking stricter.
- Adds an Emotion `CacheProvider` and a `createCache` to the paint path for no security gain.

### Hand-maintained serve.json plus a contract test

Write the headers by hand and pin the text.

#### Good (Hand-maintained serve.json plus a contract test)

- No generator, no entrypoint change.

#### Bad (Hand-maintained serve.json plus a contract test)

- The dev server and the runtime `connect-src` extension would each need their own copy of
  the values — the drift the issue set out to remove.
- A text pin proves the file, not the emitted response.

### Meta http-equiv in the HTML shell

Carry the policy in the document.

#### Good (Meta http-equiv in the HTML shell)

- Survives a proxy that strips response headers.

#### Bad (Meta http-equiv in the HTML shell)

- `frame-ancestors`, `report-uri`, and `sandbox` are ignored in a meta CSP, so clickjacking
  protection would be lost; the non-CSP headers cannot be expressed at all.
- Applies only to the HTML document, not to assets or the manifest.

## Links

- [Issue #113 — Implement enterprise browser security baseline](https://github.com/VilnaCRM-Org/crm/issues/113)
- [Issue #145 — runtime configuration and the container entrypoint](https://github.com/VilnaCRM-Org/crm/issues/145)
- [Issue #158 — the preloaded-auth seed gate over the emitted bundle](https://github.com/VilnaCRM-Org/crm/issues/158)
- [`SECURITY.md` — Browser security headers](../../SECURITY.md#browser-security-headers-issue-113)
