# Frontend Refactoring Strategies

## Extract Decision Helpers

Move dense boolean logic out of JSX and hooks:

```typescript
export function shouldShowRetry(status: Status, attempts: number): boolean {
  return status === 'failed' && attempts < 3;
}
```

Test the helper directly when it encodes business behavior.

## Split Container And View

Keep data fetching, mutation, and routing in a container or hook. Pass plain
props to a presentational component.

## Replace Branches With Lookup Maps

Use typed maps for stable render variants:

```typescript
const variantTitleByStatus: Record<Status, string> = {
  idle: 'profile.idle',
  loading: 'profile.loading',
  failed: 'profile.failed',
  saved: 'profile.saved',
};
```

## Reduce Style File Weight

- Reuse identical style objects.
- Extract repeated media queries into constants.
- Split feature-specific styles by component when a file crosses metrics limits.

## Avoid False Refactors

Do not split a component only by line count if the resulting files still share
the same state and side effects. Split by responsibility.
