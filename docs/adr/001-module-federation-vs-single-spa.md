# ADR-001: Module Federation vs Single-SPA

- Status: Approved
- Deciders: [@kravalg](https://github.com/kravalg)
- Date: 2025-06-09

**Technical Story**: We are planning to modularize the CRM front-end to support
independent team workflows and better scalability. This ADR evaluates two
approaches, Module Federation and Single-SPA, to guide the architectural choice.

## Context and Problem Statement

We are transitioning the CRM front-end to a microfrontend architecture to improve
modularity, scalability, and team autonomy. We evaluated Module Federation and
Single-SPA to decide which approach better matches our technical and operational
goals.

## Decision Drivers

- Independent development and deployment of front-end modules by different teams
- Seamless integration of multiple front-end applications with minimal overhead
- Performance, including initial load time and runtime efficiency
- Developer experience and ease of onboarding
- Compatibility with the existing stack (React, the repository bundler, and related tooling)
- Maintainability and long-term scalability
- Flexibility in sharing components or state between modules
- Integration with existing CI/CD and deployment infrastructure

## Considered Options

1. **Module Federation**  
   A bundler feature that allows separately built and deployed bundles to be
   combined at runtime. It is well-suited for sharing modules across
   independently deployed applications.
2. **Single-SPA**  
   A microfrontend framework that composes multiple front-end applications into
   one SPA and acts as a runtime orchestrator for those applications.

## Decision Outcome

Chosen option: **"Module Federation"**, because it enables dynamic code sharing
between independently deployed front-end modules with low runtime overhead. It
fits the repository's bundler-integrated build and requires less orchestration
boilerplate than Single-SPA.

The decision stands. Its implementation vehicle is
[`@module-federation/rsbuild-plugin`](https://www.npmjs.com/package/@module-federation/rsbuild-plugin),
the Rspack binding — see "Update history" below. The plugin is a declared dependency; no remote
or exposed module is wired into `rsbuild.config.ts` yet, so nothing federates at runtime today.

## Positive Consequences

- Independent development and deployment of microfrontends by different teams
- Reduced duplication of shared components and libraries
- Minimal changes required for integration with the current build system
- Good runtime performance when shared modules are configured correctly
- Clear separation of concerns across domains

## Negative Consequences

- Requires careful dependency version management to avoid runtime conflicts
- Not fully framework-agnostic because it is bundler-centric
- Added learning curve around dynamic module loading and remote configuration
- Requires coordination for remote entry points and shared module contracts

## Pros and Cons of the Options

### Module Federation

Bundler feature allowing runtime loading and sharing of modules between builds.

#### Good (Module Federation)

- Integrates well with the repository's bundler-integrated build
- Enables code sharing and dynamic loading without a central router
- Supports independent deployment and versioning of modules
- Does not require a separate runtime orchestrator

#### Bad (Module Federation)

- Dependency and version mismatches can cause runtime errors
- Remote-module debugging can be harder than monolith debugging
- Requires coordination of build-time and runtime configurations

### Single-SPA

Microfrontend framework that orchestrates multiple front-end apps at runtime.

#### Good (Single-SPA)

- Framework-agnostic and can combine React, Vue, Angular, and others
- Clear runtime lifecycle with centralized routing control
- Mature ecosystem and solid documentation

#### Bad (Single-SPA)

- Adds runtime orchestration layer and related complexity
- Requires central configuration and more complex routing setup
- Can be harder to optimize when many bundles initialize in parallel
- Adds lifecycle and integration boilerplate for each microfrontend

## Update history

- **2026-08-13** — Corrected the rationale, which still described a Webpack build. The project
  migrated to RSBuild (Rspack) in `chore(#37): rsbuild migration (#40)`, so every "Webpack"
  premise in the original text was stale. Module Federation is bundler-integrated in Rspack too,
  so the _decision_ was unaffected and is not superseded; only the reasoning that referenced the
  bundler was wrong. Recorded while adding the documentation drift gates in
  [#122](https://github.com/VilnaCRM-Org/crm/issues/122), which is what would have caught this.

## Links

- [Module Federation (official site)](https://module-federation.io/)
- [Module Federation with Rspack](https://rspack.dev/guide/features/module-federation)
- [Single-SPA documentation](https://single-spa.js.org/docs/getting-started-overview/)

### Articles and Videos

- [Module Federation vs Single-SPA (Medium)](https://blog.bitsrc.io/module-federation-vs-single-spa-47da53b67ed0)
- [Micro Frontends with Module Federation and React (YouTube)](https://www.youtube.com/watch?v=-LNcpralkjM)
- [Micro Frontends (Martin Fowler)](https://martinfowler.com/articles/micro-frontends.html)

### GitHub

- [Module Federation GitHub Examples](https://github.com/module-federation/module-federation-examples)
