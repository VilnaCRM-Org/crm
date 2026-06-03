# Localized Form

Use `react-hook-form` for form state and `react-i18next` for labels and errors.

MUI's `TextField` forwards `ref` to the root wrapper element, not the `<input>`,
so spreading `register(...)` directly lands `ref` on the wrong node and breaks
focus management (`setFocus`, focus-on-error). Pull `ref` out and pass it through
`inputRef` instead:

```typescript
const { t } = useTranslation();
const { register, formState } = useForm<FormValues>();

const { ref, ...emailField } = register('email');

<TextField
  type="email"
  autoComplete="email"
  label={t('sign_up.email.label')}
  error={Boolean(formState.errors.email)}
  helperText={formState.errors.email?.message}
  {...emailField}
  inputRef={ref}
/>;
```

MUI associates the `label`, links `helperText` via `aria-describedby`, and sets
`aria-invalid` on error automatically. Announcing an error that appears after
submit (while focus is elsewhere) still needs a live region or a focus move.

The shared `UIFormInputField` applies the same `inputRef={ref}` wiring through a
`Controller`.

Validation messages should map to translation keys, not hardcoded strings.
