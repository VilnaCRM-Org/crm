# Ralph Fix Plan

## Stories to Implement

- [x] Story 1.1: Move Mockoon Into the Development Compose Topology
- [x] Story 1.2: Start Frontend and Mockoon Together
- [x] Story 1.3: Add Mockoon Readiness and Failure Output
- [x] Story 1.4: Preserve Production Test Startup After the Mockoon Move
- [x] Story 2.1: Add CI Environment Setup Phase
- [x] Story 2.2: Add Parallel Lint Phase
- [x] Story 2.3: Add Environment-Assuming Unit Test Phase
- [x] Story 2.4: Add Top-Level make ci Orchestration
- [x] Story 3.1: Add GitHub Actions Workflow That Calls make ci
  > As a developer
  > I want GitHub Actions to run `make ci`
  > So that local and remote CI use the same check definition.
  > AC: Given the repository has separate CI check definitions today When the new CI workflow runs
  > Spec: specs/specs/planning-artifacts/current/epics-start-ci-chromium-2026-04-14.md#story-3-1
- [x] Story 3.2: Retire Redundant Static and Unit Workflows Safely
  > As a maintainer
  > I want obsolete workflow definitions retired only after required-check dependencies are handled
  > So that CI consolidation does not break merges or silently remove protection.
  > AC: Given `make ci` covers the static and unit checks When retiring `static-testing.yml` and
  > Spec: specs/specs/planning-artifacts/current/epics-start-ci-chromium-2026-04-14.md#story-3-2
- [x] Story 4.1: Introduce Shared Lighthouse Setup Target
  > As a developer running Lighthouse audits
  > I want Lighthouse environment setup to happen through one shared prerequisite
  > So that Chromium verification and production startup are not duplicated across audit targets.
  > AC: Given Lighthouse targets currently rely on duplicated setup through `LHCI_BUILD_CMD` When
  > Spec: specs/specs/planning-artifacts/current/epics-start-ci-chromium-2026-04-14.md#story-4-1
- [x] Story 4.2: Update Desktop and Mobile Lighthouse Targets to Use Shared Setup
  > As a developer running desktop and mobile Lighthouse audits
  > I want both audit targets to use the shared setup path
  > So that sequential audit runs do not repeat Chromium setup unnecessarily.
  > AC: Given `lighthouse-setup` exists When `make lighthouse-desktop` runs Then it depends on
  > AC: Given `lighthouse-setup` exists When `make lighthouse-mobile` runs Then it depends on, And it does not call `ensure-chromium` through `LHCI_BUILD_CMD`.
  > Spec: specs/specs/planning-artifacts/current/epics-start-ci-chromium-2026-04-14.md#story-4-2
- [x] Story 4.3: Remove Obsolete Lighthouse Build Command Wiring
  > As a maintainer
  > I want obsolete Lighthouse setup wiring removed
  > So that future Lighthouse targets cannot accidentally reintroduce duplicate Chromium checks.
  > AC: Given desktop and mobile Lighthouse targets use `lighthouse-setup` When the old wiring is
  > Spec: specs/specs/planning-artifacts/current/epics-start-ci-chromium-2026-04-14.md#story-4-3
- [x] Story 5.1: Document Complete Local Startup Behavior
  > As a developer
  > I want README documentation for the updated `make start` behavior
  > So that I know the command starts both the frontend and Mockoon API mock and what ports to use.
  > AC: Given `make start` starts both `dev` and `mockoon` When README startup documentation is
  > Spec: specs/specs/planning-artifacts/current/epics-start-ci-chromium-2026-04-14.md#story-5-1
- [x] Story 5.2: Document make ci Usage and GNU Make Prerequisite
  > As a developer
  > I want README and CONTRIBUTING guidance for `make ci`
  > So that I can run the same check command locally that GitHub Actions runs.
  > AC: Given `make ci` is the canonical local/remote CI command When README and CONTRIBUTING are, And they document GNU Make 4.0+ as a requirement And they include macOS Homebrew make
  > Spec: specs/specs/planning-artifacts/current/epics-start-ci-chromium-2026-04-14.md#story-5-2
- [x] Story 5.3: Make Changed Targets Discoverable Through make help
  > As a developer
  > I want changed public Makefile targets to appear in `make help`
  > So that I can discover available workflow commands from the terminal.
  > AC: Given new or changed public targets exist When `make help` runs Then `start` describes
  > Spec: specs/specs/planning-artifacts/current/epics-start-ci-chromium-2026-04-14.md#story-5-3
- [x] Story 5.4: Document Make Targets as Contracts
  > As a maintainer
  > I want the Make target contract principle documented
  > So that future Makefile changes preserve predictable developer workflows.
  > AC: Given this initiative establishes "Make targets as contracts" When CONTRIBUTING is updated, Then it states that a Make target must do what its name promises completely and reliably And
  > Spec: specs/specs/planning-artifacts/current/epics-start-ci-chromium-2026-04-14.md#story-5-4
- [x] Story 5.5: Document the make start / CI Migration Path
  > As an existing contributor
  > I want migration documentation for the changed `make start` behavior and the new CI command
  > So that my existing mental model, local scripts, and aliases do not silently break after this initiative lands.
  > AC: Given `make start` previously started only the frontend dev container When the migration
  > Spec: specs/specs/planning-artifacts/current/epics-start-ci-chromium-2026-04-14.md#story-5-5

## Completed

## Notes

- Follow TDD methodology (red-green-refactor)
- One story per Ralph loop iteration
- Update this file after completing each story
