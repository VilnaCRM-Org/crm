# Complexity Metrics

## Metrics That Usually Matter In Frontend Work

| Metric | Meaning | Typical fix |
| --- | --- | --- |
| Cyclomatic | Number of branch paths | Extract decisions or lookup maps |
| Cognitive | Reader burden from nesting | Guard clauses and smaller helpers |
| ABC | Assignments, branches, calls | Split mixed responsibilities |
| Function LLOC/PLOC/SLOC | Function size | Extract hooks or helpers |
| File PLOC/SLOC | File size | Split by owner or dedupe styles |

## Policy Source

The only authoritative thresholds are in `config/metrics-policy.json`. Do not
change thresholds to pass a feature branch.
