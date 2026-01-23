# ADR‐002: Zustand vs Redux for Client State Management

- Status: Proposed

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
- Smaller bundle impact (~2KB vs ~40KB for Redux Toolkit)
- Excellent TypeScript inference without extra annotations
- Redux DevTools compatibility for debugging
- Built-in middleware for persistence and immer

### Negative Consequences

- Migration effort required for existing Redux code
- Smaller ecosystem compared to Redux
- Team needs to establish conventions (less opinionated)
- Fewer middleware options available

## Comparison of Options

| Aspect            | Redux Toolkit           | Zustand    | Jotai     | MobX     |
| ----------------- | ----------------------- | ---------- | --------- | -------- |
| Bundle Size       | ~40KB                   | ~2KB       | ~3KB      | ~15KB    |
| Boilerplate       | High (actions, reducers)| Minimal    | Minimal   | Moderate |
| Provider Required | Yes                     | No         | Optional  | Yes      |
| Module Federation | Needs config            | Native     | Needs cfg | Needs    |
| TypeScript        | Good (needs setup)      | Excellent  | Good      | Good     |
| DevTools          | Native                  | Compatible | Limited   | Separate |
| Learning Curve    | Steep                   | Low        | Moderate  | Moderate |
| Ecosystem         | Very large              | Growing    | Small     | Large    |

## Links

- [Zustand Documentation](https://docs.pmnd.rs/zustand/getting-started/introduction)
- [Zustand GitHub](https://github.com/pmndrs/zustand)
- [Zustand vs Redux Comparison](https://docs.pmnd.rs/zustand/getting-started/comparison)
- [ADR‐001: Module Federation vs Single-SPA](https://github.com/VilnaCRM-Org/crm/wiki/ADR%E2%80%90001:-Module-Federation-vs-Single-SPA)
