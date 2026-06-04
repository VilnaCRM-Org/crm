# Web Vitals

## When To Use

Use `web-vitals` when a change affects page load, route transitions, heavy
rendering, or user-perceived responsiveness.

## Signals

- LCP for loading experience.
- CLS for layout stability.
- INP for interaction responsiveness.

## Verification

Pair runtime signals with Lighthouse:

```bash
make lighthouse-desktop
make lighthouse-mobile
```
