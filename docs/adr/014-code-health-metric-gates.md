# ADR-014: Code health is gated by a committed metrics policy and a zero-clone duplication gate

- Status: Approved
- Deciders: [@kravalg](https://github.com/kravalg)
- Date: 2026-09-20

**Technical Story**: Pull request [#73](https://github.com/VilnaCRM-Org/crm/pull/73) (issue
[#59](https://github.com/VilnaCRM-Org/crm/issues/59), 2026-05-17) committed the
rust-code-analysis policy and the `make lint-metrics` gate, and pull request
[#98](https://github.com/VilnaCRM-Org/crm/pull/98) (issue
[#91](https://github.com/VilnaCRM-Org/crm/issues/91), 2026-06-13) added the jscpd duplication
gate. Both are described in `CLAUDE.md` as gates; neither was recorded as a decision, and the
enterprise readiness audit (issue [#136](https://github.com/VilnaCRM-Org/crm/issues/136),
section G) asked for the ADR. The thresholds are among the values the gate ratchet guards
(issue [#188](https://github.com/VilnaCRM-Org/crm/issues/188)).

## Context and Problem Statement

A template that many humans and AI agents extend accumulates entropy in the shapes a linter
does not see: functions that grow past what a reader can hold, files that become grab-bags,
and blocks copied between features instead of extracted. ESLint's `complexity` rule covers
cyclomatic complexity of functions and nothing else — no cognitive complexity, no ABC, no
Halstead, no file-level limits, no class metrics — and it cannot see duplication at all.
Review catches some of this, inconsistently, after the fact. The repository needed a
machine-enforced definition of "too big" and "copied" that runs identically locally and in CI
and that a contributor can read as data.

## Decision Drivers

- The policy has to be a committed file that both the gate script and a reviewer read, so a
  threshold change is a diff, not a tool setting
- Metrics beyond cyclomatic complexity: cognitive complexity, ABC magnitude, argument and exit
  counts, LLOC/PLOC/SLOC per function and per file, Halstead volume and bugs, maintainability
  index, class metrics
- Identical results on Linux, macOS and CI, which means the analyzer runs in Docker
- Duplication measured at copy-paste mass, not incidental similarity, so the gate does not
  push contributors toward premature abstraction
- Thresholds that only ratchet toward the target bands, never away from them

## Considered Options

1. **rust-code-analysis with a committed JSON policy, plus jscpd at zero tolerance** — a
   Mozilla analyzer emitting every metric above as JSON, evaluated by a repository script; jscpd
   for clones.
2. **ESLint complexity rules only** — `complexity`, `max-lines`, `max-params`, `max-depth`,
   `sonarjs/cognitive-complexity`.
3. **A hosted quality platform** — SonarQube or qlty as the metric authority, with thresholds
   configured on the server.

## Decision Outcome

Chosen option: **"rust-code-analysis policy plus jscpd"**, because it is the only option whose
whole threshold set lives in the repository and runs offline. The artifacts:

- `config/metrics-policy.json` (validated by `config/metrics-policy.schema.json`) is the single
  source of truth for the hard-fail and review-gate bands; the table in `CLAUDE.md` mirrors it.
- `scripts/lint-metrics.sh` runs `rust-code-analysis-cli` v0.0.25 inside the `rca` compose
  service (a Debian stage of the `Dockerfile` with a checksum-verified binary) over `src/`,
  evaluates the JSON with `jq`, prints only hard failures as a table, and writes a Job Summary
  in CI. `make lint-metrics` is a member of `make lint` and of `CI_LINT_TARGETS`.
- `.jscpd.json` sets `minTokens: 75`, `minLines: 5`, `threshold: 0`, `mode: "mild"` over `src`
  only, excluding tests, stories, `*.d.ts` and the generated i18n catalog; `make lint-dup` is
  a member of `make lint`.
- Both files are guarded by the gate ratchet: `config/metrics-policy.json` and `.jscpd.json`
  are entries in `config/gate-thresholds.manifest.json`, so a relaxation needs the
  `gate-relaxation` label to merge.
- Remediation is structural — extract helpers, split files, group parameters into an options
  object, deduplicate into a shared fragment — never a suppression; there is no ignore
  directive for either gate.

## Positive Consequences

- "Too big" and "copied" have one definition, readable as data, enforced the same way on every
  machine.
- The hard-fail bands are tight enough that the metrics advice in `CLAUDE.md` is the same
  advice the gate gives: split, extract, group.
- The ratchet turns the thresholds into a floor that can only rise.

## Negative Consequences

- rust-code-analysis needs Docker locally; the gate is not runnable on a bare host, and the
  `rca` image is one more stage to keep pinned.
- The analyzer counts closures as functions and caps functions per file, so a new hook or
  class often needs its own file; that is a real cost in file count.
- jscpd is threshold-based and noisy on styles and markup; the 75-token bar is calibrated to
  the clones that motivated the gate, and lowering it would start flagging shared import
  headers and JSX scaffolding.
- Review-gate metrics (maintainability index original/SEI, comment and blank ratios, the
  remaining Halstead submetrics) are recorded in the policy but not enforced; they inform
  review rather than fail CI.

## Pros and Cons of the Options

### rust-code-analysis policy plus jscpd

A committed JSON policy evaluated by a repository script, plus a clone detector.

#### Good (rust-code-analysis plus jscpd)

- Every metric the audit asked for, as JSON, offline, in Docker
- Threshold set is a diffable, ratchet-guarded file

#### Bad (rust-code-analysis plus jscpd)

- Two tools; Docker required locally

### ESLint complexity rules only

`complexity`, `max-lines`, `max-params` and the SonarJS cognitive rule.

#### Good (ESLint)

- Already in the toolchain; no Docker

#### Bad (ESLint)

- No ABC, Halstead, maintainability index, file-level or class metrics; no duplication
- Thresholds spread across rule options rather than one policy file

### A hosted quality platform

SonarQube or qlty as the authority.

#### Good (hosted)

- Dashboards, history, one place for every language

#### Bad (hosted)

- Thresholds live on the server, outside the pull-request diff and outside the ratchet
- Cloud latency and availability on the critical path of every pull request

## Links

- [Issue #59 — rust-code-analysis gate](https://github.com/VilnaCRM-Org/crm/issues/59)
- [Pull request #73 — the committed policy](https://github.com/VilnaCRM-Org/crm/pull/73)
- [Issue #91 — jscpd duplication gate](https://github.com/VilnaCRM-Org/crm/issues/91)
- [Issue #188 — gate-threshold ratchet](https://github.com/VilnaCRM-Org/crm/issues/188)
- [Issue #136 — enterprise readiness audit, section G](https://github.com/VilnaCRM-Org/crm/issues/136)
- [`config/metrics-policy.json`](../../config/metrics-policy.json) — the policy
- [`.jscpd.json`](../../.jscpd.json) — the duplication thresholds
