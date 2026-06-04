# I18n Patterns

## Translation Files

Feature translations live near the feature:

```text
src/modules/<Module>/features/<Feature>/i18n/en.json
src/modules/<Module>/features/<Feature>/i18n/uk.json
```

## Rules

- Add English and Ukrainian keys together.
- Do not hardcode user-facing strings in JSX.
- Keep keys grouped by feature and screen.
- Preserve existing key naming style in nearby files.
