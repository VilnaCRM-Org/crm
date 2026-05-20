# Complexity Troubleshooting

## Formatter Made A File Fail Metrics

Keep formatter output. Look for duplicate style blocks, repeated media queries,
or dead exports that can be removed without changing behavior.

## Extracted Helper Causes Import Cycle

Move the helper closer to the lowest shared owner. If only one feature uses it,
keep it under that feature rather than `src/utils`.

## Component Split Breaks Tests

Tests should still target user-observable behavior. Avoid asserting that a new
child component exists unless the child is exported as a public unit.

## Metrics Pass But Readability Got Worse

Prefer readable named helpers over arbitrary file slicing. Passing metrics is a
gate, not the only design goal.
