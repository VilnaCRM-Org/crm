---
status: 'draft'
workflowType: 'implementation-readiness'
bmadCommand: 'implementation-readiness'
project_name: 'crm'
date: '2026-11-23'
revised: '2026-11-27'
iteration: 3
revisionPasses:
  - '2026-11-27 review: the FR ownership evidence names the story of each FR'
  - '2026-11-27 owner: three linked-tile styles — FR ownership, design references, evidence, W6–W8'
slug: 'social-account-linking'
verdict: 'CONCERNS'
inputDocuments:
  - 'specs/social-account-linking/planning-artifacts/prd-social-account-linking-2026-11-23.md'
  - 'specs/social-account-linking/planning-artifacts/architecture-social-account-linking-2026-11-23.md'
  - 'specs/social-account-linking/planning-artifacts/epics-social-account-linking-2026-11-23.md'
---

# Implementation Readiness: Social Account Linking in Settings

> **Revision 2026-11-27 — FR ownership.** The first pass marked "Every FR is owned by a story" PASS
> while no story cited FR4. S2.2 now owns it, and the evidence names the stories of every FR.

> **Amendment 2026-11-27 — three linked-tile styles (product owner).** PRD L8 and L9 add three
> trial styles of a linked tile, compared in Storybook through a `tileStyle` prop. FR8, FR9 and
> FR10 are now also owned by S3.4; `badge` and `labelled` have UI kit nodes but no settings frame,
> and no real-page browser or visual evidence during the trial (W6, W7); `badge` carries accepted
> contrast gaps (W8). The verdict stays CONCERNS.

## Verdict: **CONCERNS** (upstream contract open)

| Check                                      | Result   | Evidence                                                                                                                                                                            |
| ------------------------------------------ | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Every FR is owned by a story               | PASS     | FR1, FR7: S3.1; FR8, FR10: S3.1, S3.4; FR2, FR5, FR12: S2.3; FR3, FR4: S2.2; FR6: S2.1, S2.3; FR9: S3.2, S3.4; FR11: S1.1, S1.2, S2.1, S3.3                                         |
| Design reference for each surface          | CONCERNS | `tinted` `315:11754` and notifications; `badge` and `labelled` have no settings frame and are composed from UI kit page `439:19251` and toolkit stories; L6 from the settings pills |
| Evidence for every tile style              | CONCERNS | `tinted` keeps every lane; `badge` and `labelled` have Storybook, jsdom and jest-axe evidence only until S4.2 (PRD L9)                                                              |
| No contradiction with an upstream decision | PASS     | Amendments dated 2026-11-23 in both older bundles                                                                                                                                   |
| Error outcomes complete                    | PASS     | FR11                                                                                                                                                                                |
| Backend can serve it                       | CONCERNS | user-service #520 is open and shaped differently                                                                                                                                    |

| Id  | Warning                                                                                                  | Handling                                                                        |
| --- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| W1  | L6, the unlink confirmation, has no design                                                               | Settled: inline row, owner 2026-11-23                                           |
| W2  | L3 and L4 differ from user-service #520                                                                  | Raise on #520 before production                                                 |
| W3  | The list-failure message and retry (FR1) have no frame                                                   | Reuses existing copy styles; confirm at S3.1                                    |
| W4  | A stacked pull request runs little CI until it targets `main`                                            | Retarget once PR #398 merges                                                    |
| W5  | The FR/NFR gate runs only on a green head approved by cubic and CodeRabbit                               | Owner rule, 2026-11                                                             |
| W6  | `badge` and `labelled` have no settings frame; no frame draws a linked tile's hover, focus or busy state | UI kit nodes (PRD L8) and toolkit stories; the owner compares them in Storybook |
| W7  | `badge` and `labelled` have no real-page browser or visual evidence during the trial                     | Storybook, jsdom and jest-axe; the winner gets every lane at S4.2               |
| W8  | `badge` carries accepted non-text gaps (PRD NFR2)                                                        | Owner-accepted under #276, as `tinted`'s bin and border                         |
