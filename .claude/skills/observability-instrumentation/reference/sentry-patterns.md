# Sentry Patterns

## Capture Boundaries

- Route-level error boundaries.
- API/service wrappers.
- Top-level app boundary.

## Context Rules

Allowed:

- Route name.
- Feature/module name.
- Error category.
- Non-sensitive status codes.

Avoid:

- Passwords and tokens.
- Full request bodies.
- User-entered form text.
- Authentication headers.
