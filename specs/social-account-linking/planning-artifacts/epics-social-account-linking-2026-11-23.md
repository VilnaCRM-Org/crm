---
status: 'draft'
workflowType: 'epics-and-stories'
bmadCommand: 'create-epics-stories'
project_name: 'crm'
date: '2026-11-23'
slug: 'social-account-linking'
inputDocuments:
  - 'specs/social-account-linking/planning-artifacts/prd-social-account-linking-2026-11-23.md'
  - 'specs/social-account-linking/planning-artifacts/architecture-social-account-linking-2026-11-23.md'
---

# Epics: Social Account Linking in Settings

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

- A message of another shape or for another attempt is ignored.
- The wait resolves for a signal that was already aborted.

### S2.2 Return view — dependent on S2.1

- `link.`: the callback is posted, the query stripped, the window closed; no retry is offered.
- A `link.` state never reaches `completeSocialSignInUser` (FR3), unit and E2E.

### S2.3 Attempt hook — dependent on S1.2, S2.1

- FR2, FR5, FR6 and FR12, including an abort during `initiate` and a second click.

## Epic 3 — Card

### S3.1 Tiles and list state — dependent on S1.2

- Display-only until the list answers; retry on failure (FR1); FR7, FR8 and FR10.
- A story per tile state; accessibility-lead review before the edit; Figma check `315:11754`.

### S3.2 Unlink — dependent on S3.1

- FR9 with the L6 row; one row at a time; nothing is sent before it is confirmed; the last-method refusal is explained.

### S3.3 Toasts — dependent on S3.1

- One toast per FR11 result in both locales, announced by the existing live regions.

## Epic 4 — Verification

### S4.1 E2E, mobile, visual, docs — dependent on all

- Link, cancel, already linked and unlink in three engines; tap on both mobile
  projects; baselines of the card; route-coverage rows; the local guide; a follow-up note for #392.
