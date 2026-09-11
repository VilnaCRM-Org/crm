# Security policy

This repository is the template every VilnaCRM microservice frontend is derived from, so a flaw
here is a flaw in every service that copied it. Report it privately through the channel below and
expect the response targets that follow.

## Supported versions

| Version              | Supported                                                |
| -------------------- | -------------------------------------------------------- |
| `main`               | Yes — every fix lands here first                         |
| The highest `v*` tag | Yes — the release `autorelease.yml` last cut from `main` |
| Older tags           | No — move to the latest tag                              |
| Downstream services  | Each tracks its own copy; a fix here does not reach it   |

`main` is the only branch that receives fixes, and the release workflow tags it directly, so the
highest `v*` tag is always a snapshot of `main` and nothing is ever backported. A microservice
built from this template owns the copy it took: a fix landing here reaches it only when it is
ported, and a flaw in service-specific code is reported to that service's repository. A flaw in
the template itself — the shared shell, the workflows, the images — belongs here even when it was
found downstream.

## Reporting a vulnerability

Use GitHub private vulnerability reporting:
[open a draft advisory](https://github.com/VilnaCRM-Org/crm/security/advisories/new). It is the
only reporting channel. There is no security mailing address and no bug bounty, and neither is
promised here, so a report never waits on a mailbox nobody reads.

Never open a public issue, pull request, or discussion for a suspected vulnerability, and never
describe one in a commit message: the repository is public, and an exploit path on the issue
tracker is disclosed before anyone can act on it. A private report that turns out not to be a
vulnerability is moved to a public issue with the reporter's agreement.

A useful report names the affected surface (a path under `src/`, a workflow, the Docker image, a
generated artifact), the commit or tag it was observed on, the steps that reproduce it, and the
impact the reporter believes it has. A proof of concept is welcome; a working exploit against a
deployed VilnaCRM environment is not — stop at demonstrating the flaw.

## Response targets

| Stage               | Target                               |
| ------------------- | ------------------------------------ |
| Acknowledgement     | Within 3 business days of the report |
| Triage and severity | Within 7 days of the report          |
| Fix — critical      | Within 14 days of triage             |
| Fix — high          | Within 30 days of triage             |
| Fix — medium        | Within 90 days of triage             |
| Fix — low           | In the next release                  |

These are targets, not guarantees: the repository is maintained by a small team with no dedicated
security function. Severity follows the CVSS base score the advisory form computes, adjusted for
the exposure this codebase actually has — a finding in a development-only dependency that no
production artifact ships is rated by that reduced exposure, and "Automated controls" below is
how that is established. The reporter is kept informed in the advisory thread and credited in
the published advisory unless they ask otherwise.

## Scope

In scope:

- the source under `src/`, `scripts/`, `config/`, `docker/`, and the root configuration files
- the workflows under `.github/workflows/`, including the actions, tokens, and permissions they use
- the images built from `Dockerfile` and `Mockoon.Dockerfile`, and the compose files that run them
- the generated artifacts — `src/api/generated/`, `src/i18n/localization.json`, the SBOMs — and
  the generators that produce them

Out of scope, with where to report instead:

- the upstream `user-service` API, whose OpenAPI and GraphQL contracts this repository only pins
  and validates — report to
  [VilnaCRM-Org/user-service](https://github.com/VilnaCRM-Org/user-service)
- the third-party services the pipeline uses (GitHub, Sentry, Codecov, Mockoon, OpenSSF) — report
  to the vendor
- downstream forks and the microservices derived from this template — report to that repository,
  unless the flaw is in code it inherited unchanged
- a vulnerability in a development-only dependency that no production artifact ships — it is
  tracked by the weekly full-tree audit below, not disclosed as an advisory

## Automated controls

Every control below already runs; none is planned. Each one runs in CI and, unless noted, locally
through the same `make` target, so a scanner result can be reproduced without opening a pull
request. The complete workflow inventory is in [README.md](README.md#ci-checks).

- **CodeQL, `security-extended` suite** —
  [`security-testing.yml`](.github/workflows/security-testing.yml), on every pull request, on
  push to `main` (the baseline the pull-request diff needs), and weekly. Findings block a merge
  only through the code-scanning ruleset recorded in
  [`docs/governance/branch-protection.md`](docs/governance/branch-protection.md), which is still
  a pending maintainer action.
- **Preloaded-auth seed gate** — the same workflow, pull requests only;
  `make check-auth-seed-gate`. Proves against the emitted bundle that the test-only auth seam is
  compiled out of the deployable image.
- **Secret scan** — [`supply-chain-security.yml`](.github/workflows/supply-chain-security.yml),
  pull requests and weekly; `make scan-secrets`. gitleaks over the full git history, followed by
  a positive control that seeds a synthetic AWS key id and fails unless the scanner detects it, so
  a misconfigured scanner cannot pass vacuously. The two allowlists in `.gitleaks.toml` — the
  upstream documentation examples inside the generated OpenAPI artifact and the sha256 checksum
  line in `Mockoon.Dockerfile` — are pinned by `tests/unit/tooling/supply-chain-gates.test.ts`.
- **Dependency scan** — the same workflow; `make scan-dependencies`. Trivy over the production
  dependency closure of `bun.lock`; a fixable HIGH or CRITICAL advisory fails the build.
  `devDependencies` are excluded on purpose: they never reach the deployable artifact, and the
  weekly audit covers them.
- **Image scan** — the same workflow; `make scan-image`. Builds the deployable `production`
  target and runs Trivy over it with the same policy. The runtime image is Alpine plus the `node`
  binary and `serve`, with no npm, corepack, or yarn, so its attack surface is the two binaries it
  runs rather than a package manager it never uses.
- **Full-tree dependency audit** — the same workflow, scheduled and manual runs only;
  `make report-dependency-audit`. Scans the whole lockfile, dev tooling included, and maintains
  one `dependency-audit` tracking issue instead of failing a build, because an advisory in a test
  runner is a maintenance item rather than a shipped exposure.
- **SBOM** — [`sbom.yml`](.github/workflows/sbom.yml); `make sbom`. CycloneDX 1.7 JSON for the
  production image and for the production dependency closure, uploaded as a workflow artifact on
  every pull request and attached to every published release.
- **Workflow security** — [`workflow-security.yml`](.github/workflows/workflow-security.yml);
  `make lint-zizmor`. zizmor over the workflows themselves: mutable action refs, over-broad
  permissions, restored credential persistence, script injection.
- **Scorecard** — [`scorecard.yml`](.github/workflows/scorecard.yml), push to `main` and weekly.
  OpenSSF Scorecard over the live repository state no pull-request diff can show; results land in
  the Security tab beside the CodeQL findings.
- **Gate ratchet** — [`gate-ratchet.yml`](.github/workflows/gate-ratchet.yml), every pull
  request. No binding threshold in `config/gate-thresholds.manifest.json` can be weakened without
  the `gate-relaxation` label turning the relaxation into a reviewed decision.
- **Lockfile provenance** — `make lint-lockfile`, part of `make lint` and therefore of
  `static testing`. Every package in `bun.lock` must resolve from the npm registry allowlist.

Not yet in place: artifact signing and build provenance (cosign signatures, SLSA attestations).
Issue #140 scopes them as a follow-up phase. Nothing in this repository publishes the image to a
registry yet, so there is no signed image to verify, and the SBOMs attached to a release are
authenticated only by the release that carries them.

## Published advisories

Disclosed vulnerabilities are published as GitHub security advisories at
[VilnaCRM-Org/crm/security/advisories](https://github.com/VilnaCRM-Org/crm/security/advisories),
each naming the affected versions, the fixed tag, and a CVE where one applies. That page is the
record and this file does not duplicate it, so the two can never disagree; an empty list there
means nothing has been published, not that this file was forgotten. An advisory that reaches this
repository only through a dependency is not republished: the dependency bump the scanners demand
resolves it, and the Dependabot pull request or the `dependency-audit` issue is the record.

## Changing security-relevant configuration

Security-relevant configuration lives in paths that [`.github/CODEOWNERS`](.github/CODEOWNERS)
assigns an explicit owner: the workflows, `.github/dependabot.yml`, the Dockerfiles and compose
files, `scripts/`, `config/` (every gate threshold and policy), the `Makefile`, `.gitleaks.toml`,
this file, `CODE_OF_CONDUCT.md`, and `docs/governance/`. Once branch protection requires a
code-owner review — a maintainer action recorded in
[`docs/governance/branch-protection.md`](docs/governance/branch-protection.md) — a change to any
of them cannot merge on the author's approval alone.

The rules for those changes are the repository-wide ones, restated for the security surface:

- A scanner is satisfied by fixing the finding — rotating and removing a secret, bumping the
  vulnerable dependency, rebuilding the image — never by widening a `.gitleaks.toml` allowlist,
  narrowing `TRIVY_SEVERITY`, or shrinking what is scanned. A new allowlist entry is a reviewed
  change that arrives with a stated reason and updates the pin in
  `tests/unit/tooling/supply-chain-gates.test.ts`.
- A committed secret is compromised the moment it is pushed, whether or not the commit is later
  rewritten: rotate the credential first, then remove it.
- A threshold under `config/` moves only through the gate ratchet, which makes the relaxation
  visible in review.
- Scanner images and actions are pinned by digest or release commit; a bump is its own reviewed
  change, never folded into unrelated work.

## Client security events (issue #159)

The frontend emits structured security signals so authentication abuse and client-side
exploitation attempts are visible to monitoring instead of terminating silently in UI state.
Every signal is produced by `src/services/security-events/` and leaves the process through the
observability boundary (`src/services/observability/`), which means it inherits the correlation
IDs, the PII scrubbing pass, and the DSN gate. With an empty `REACT_APP_SENTRY_DSN` the whole
path is a verified no-op.

### Emitted events

| Event                   | Category                 | Raised by                          |
| ----------------------- | ------------------------ | ---------------------------------- |
| `auth_failure`          | `login` / `registration` | a rejected login or registration   |
| `auth_failure_burst`    | `login` / `registration` | a failure past the threshold       |
| `unauthorized_response` | `transport`              | a `401` or `403` REST response     |
| `error_boundary_catch`  | `render`                 | an error boundary catching a crash |

Each event reaches Sentry as a `SecurityEventSignal` exception named `security.<event>`, with
the structured payload in `extra`:

```json
{
  "event": "auth_failure_burst",
  "category": "login",
  "reason": "authentication",
  "severity": "critical",
  "failureCount": 5,
  "windowMs": 60000,
  "threshold": 5,
  "thresholdCrossed": true,
  "X-Correlation-Id": "5e0e…",
  "X-Request-Id": "9c11…"
}
```

### Credential discipline

The payload is credential-free by construction, not by filtering. `reason` is a bounded code in
every case, but the set it is drawn from depends on the event: `auth_failure` and
`auth_failure_burst` use `authentication`, `validation`, `conflict`, `server`, `network`,
`rate_limited` or `unknown`, derived from the auth error kind or the HTTP status;
`unauthorized_response` uses `http_401` or `http_403`; and `error_boundary_catch` uses the
boundary surface (`app` or `auth`). The submitted password, the session token, the email
address, and the user id are never passed to the reporter. `piiScrubber` remains the
second line of defence in Sentry's `beforeSend`. Aborted attempts (navigation away, cancelled
requests) emit nothing, so user-initiated cancellation is not mistaken for abuse.

### Correlation

A per-session `X-Correlation-Id` is generated once at bootstrap and attached to every outbound
REST request, every Apollo operation, and every captured event. The per-request `X-Request-Id`
continues to identify the individual call. Responders join a client session to backend log lines
through the session id, and a single request through the request id. Both are opaque v4 UUIDs.

### Alert threshold

`AuthFailureMonitor` tracks auth failures in a rolling window:

| Variable                                 | Default | Meaning                                  |
| ---------------------------------------- | ------- | ---------------------------------------- |
| `REACT_APP_AUTH_FAILURE_ALERT_THRESHOLD` | `5`     | failures inside the window that escalate |
| `REACT_APP_AUTH_FAILURE_ALERT_WINDOW_MS` | `60000` | length of the rolling window (ms)        |

Crossing the threshold escalates that one observation to `auth_failure_burst` with
`severity: "critical"`. Only the crossing escalates: later failures inside the same breach stay
`auth_failure`, so a sustained attack raises one critical event per breach rather than one per
request. The window has to drain below the threshold before another crossing can escalate again.
A configured threshold above the 1000-failure tracking cap is clamped to the cap, so a large
value cannot silently make the burst unreachable.
Configure the monitoring backend to alert on it — in Sentry, an issue alert on
`message:"security.auth_failure_burst"` (or on the `severity:critical` tag) notifying the
security channel on the first occurrence in a 5-minute window. The client-side counter is a
per-session signal, not an enforcement control: authoritative rate limiting and lockout stay
server-side.
