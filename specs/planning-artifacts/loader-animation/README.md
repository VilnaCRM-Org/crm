---
status: 'complete'
workflowType: 'index'
project_name: 'crm'
date: '2026-06-11'
issue: 'https://github.com/VilnaCRM-Org/crm/issues/48'
---

# Loader Animation Redesign — Planning Artifacts (Issue #48)

Planning artifacts for [VilnaCRM-Org/crm#48](https://github.com/VilnaCRM-Org/crm/issues/48)
— "Redesign and implement loader animation". The redesign replaces the CRM's fragmented
loading experience (a disabled gray button plus a detached 70px `CircularProgress`, an
inconsistent mix elsewhere, no `prefers-reduced-motion`, and a failing disabled-label
contrast) with **one skeleton-based loader family of five types** that share the existing
CSS shimmer as a single motion source-of-truth.

## Documents (read in this order)

| #   | Document                                         | What it covers                                                                                                                 |
| --- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| 1   | [`prd.md`](./prd.md)                             | Goals, personas, FR1–FR25 / NFR1–NFR16, acceptance criteria mapped to the issue                                                |
| 2   | [`ux-design.md`](./ux-design.md)                 | Motion/timing scale, reduced-motion strategy, the 5 loader spec cards, L2 deep-dive, WCAG mapping                              |
| 3   | [`architecture.md`](./architecture.md)           | Shared motion module, the 5 `UI*` components, the submit-button refactor, DRY/complexity/perf/testing strategy, migration plan |
| 4   | [`epics-and-stories.md`](./epics-and-stories.md) | Epics E1–E6, implementable stories with acceptance criteria, FR→story coverage matrix                                          |

There is intentionally **no product brief**: for this scoped brownfield enhancement the
GitHub issue is the analysis-phase artifact, and the PRD's Overview/Context absorbs it.

## The loader family

| ID  | Component (`UI*`)       | Context                                                                                                                                     |
| --- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| L1  | `UISkeletonPlaceholder` | Page / form initial load (formalizes today's auth skeleton)                                                                                 |
| L2  | `UISubmitLoadingButton` | **Submit-button loading state — the issue's hero case**: the pressed button morphs in place into a fairly-visible shimmering skeleton track |
| L3  | `UIInlineLoader`        | Small inline indeterminate indicator (e.g. the auth switcher)                                                                               |
| L4  | `UISectionLoader`       | Route / section / overlay load (opt-in region veil)                                                                                         |
| L5  | `UIProgressBar`         | Determinate progress (reserved primitive, opt-in)                                                                                           |

All five inherit one motion source (`src/components/skeletons/base/styles.ts`), one
`prefers-reduced-motion` contract, and one accessible-status primitive, so the family stays
within the jscpd DRY gate, the rust-code-analysis complexity caps, and the auth-page mobile
Lighthouse budget (pure CSS, no new dependencies).

Every loader also ships a **co-located Storybook preview** (`*.stories.tsx`) covering its animated
and reduced-motion states — L2 adds `idle`/`submitting`/`disabled`, L5 adds determinate values —
so the family is reviewable and accessibility-checkable in isolation (PRD FR27/FR28, UX §11,
Epics 2.1–2.5 + 6.1).

## Provenance

Every usage-point, contrast figure, token, and accessibility claim is re-derived directly
from repository source (file:line citations appear inline). No separate audit/taxonomy memo
is assumed or required.
