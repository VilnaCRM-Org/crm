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
- Compatibility with the existing stack (React, Webpack, and related tooling)
- Maintainability and long-term scalability
- Flexibility in sharing components or state between modules
- Integration with existing CI/CD and deployment infrastructure

## Considered Options

1. **Module Federation (Webpack 5)**  
   A built-in Webpack feature that allows separately built and deployed bundles
   to be combined at runtime. It is well-suited for sharing modules across
   independently deployed applications.
2. **Single-SPA**  
   A microfrontend framework that composes multiple front-end applications into
   one SPA and acts as a runtime orchestrator for those applications.

## Decision Outcome

Chosen option: **"Module Federation"**, because it enables dynamic code sharing
between independently deployed front-end modules with low runtime overhead. It
fits the current Webpack-based setup and requires less orchestration boilerplate
than Single-SPA.

## Positive Consequences

- Independent development and deployment of microfrontends by different teams
- Reduced duplication of shared components and libraries
- Minimal changes required for integration with the current Webpack build system
- Good runtime performance when shared modules are configured correctly
- Clear separation of concerns across domains

## Negative Consequences

- Requires careful dependency version management to avoid runtime conflicts
- Not fully framework-agnostic because it is Webpack-centric
- Added learning curve around dynamic module loading and remote configuration
- Requires coordination for remote entry points and shared module contracts

## Pros and Cons of the Options

### Module Federation

Webpack 5 feature allowing runtime loading and sharing of modules between builds.

#### Good (Module Federation)

- Integrates well with the current Webpack setup
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

## Links

- [Module Federation (official site)](https://module-federation.io/)
- [Webpack Module Federation documentation](https://webpack.js.org/concepts/module-federation/)
- [Single-SPA documentation](https://single-spa.js.org/docs/getting-started-overview/)

### Articles and Videos

- [Module Federation vs Single-SPA (Medium)](https://blog.bitsrc.io/module-federation-vs-single-spa-47da53b67ed0)
- [Micro Frontends with Module Federation and React (YouTube)](https://www.youtube.com/watch?v=-LNcpralkjM)
- [Micro Frontends (Martin Fowler)](https://martinfowler.com/articles/micro-frontends.html)

### GitHub

- [Module Federation GitHub Examples](https://github.com/module-federation/module-federation-examples)
