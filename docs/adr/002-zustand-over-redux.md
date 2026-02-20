# ADR‐002: Zustand vs Redux for Client State Management

- Status: Approved

- Deciders: @kravalg

- Date: 2026-01-22

## Context and Problem Statement

The CRM front-end team has introduced Apollo Client for GraphQL server state management.
Redux Toolkit now only manages client-side state (UI state, form state, user preferences),
making its complex patterns (actions, reducers, selectors, thunks) excessive for our needs.

How can we simplify client state management while maintaining compatibility with our
Module Federation architecture?

## Decision Drivers

1. Reduced boilerplate for simple client-only state
2. Smaller bundle size impact on micro frontend performance
3. Compatibility with Module Federation (singleton-friendly, no providers)
4. Developer experience and TypeScript support
5. Learning curve for team onboarding
6. Integration with existing Apollo Client setup
7. Long-term maintainability and ecosystem support

## Considered Options

1. **Redux Toolkit** - Continue with current setup
2. **Zustand** - Minimal, hook-based state management
3. **Jotai** - Atomic state management
4. **MobX** - Observable-based state management

## Decision Outcome

**Chosen option: Zustand**, because it enables minimal boilerplate state management with
excellent Module Federation compatibility, while Apollo Client handles all server state
concerns.

### Positive Consequences

- Independent store creation without providers (ideal for Module Federation)
- ~95% reduction in state management boilerplate
- Smaller bundle impact (~2KB vs ~10–14KB for Redux Toolkit + react-redux)
  (as of 2026-01, measured via [Bundlephobia: zustand][zst] and
  [Bundlephobia: @reduxjs/toolkit][rtk] + [react-redux][rr])
- Excellent TypeScript inference without extra annotations
- Redux DevTools compatibility for debugging
- Optional middleware for persistence and immer (require separate setup; immer requires the 'immer' package)

### Negative Consequences

- Migration effort required for existing Redux code
- Smaller ecosystem compared to Redux
- Team needs to establish conventions (less opinionated)
- Fewer middleware options available

## Comparison of Options

| Aspect            | Redux Toolkit           | Zustand    | Jotai     | MobX     |
| ----------------- | ----------------------- | ---------- | --------- | -------- |
| Bundle Size       | ~10–14KB ([rtk], [rr]) | ~2KB ([zst]) | ~3KB ([jot]) | ~15KB ([mbx]) |
| Boilerplate       | High (actions, reducers)| Minimal    | Minimal   | Moderate |
| Provider Required | Yes                     | No         | Optional  | Yes      |
| Module Federation | Needs config            | Native     | Needs config | Needs config |
| TypeScript        | Good (needs setup)      | Excellent  | Good      | Good     |
| DevTools          | Native                  | Compatible | Limited   | Separate |
| Learning Curve    | Steep                   | Low        | Moderate  | Moderate |
| Ecosystem         | Very large              | Growing    | Small     | Large    |

## Links

- [Zustand Documentation](https://docs.pmnd.rs/zustand/getting-started/introduction)
- [Zustand GitHub](https://github.com/pmndrs/zustand)
- [Zustand vs Redux Comparison](https://docs.pmnd.rs/zustand/getting-started/comparison)
- [ADR‐001: Module Federation vs Single-SPA](https://github.com/VilnaCRM-Org/crm/wiki/ADR%E2%80%90001:-Module-Federation-vs-Single-SPA)

[zst]: https://bundlephobia.com/package/zustand
[rtk]: https://bundlephobia.com/package/@reduxjs/toolkit
[rr]: https://bundlephobia.com/package/react-redux
[jot]: https://bundlephobia.com/package/jotai
[mbx]: https://bundlephobia.com/package/mobx
