# Localized Form

Use `react-hook-form` for form state and `react-i18next` for labels and errors:

```typescript
const { t } = useTranslation();
const { register, formState } = useForm<FormValues>();

<TextField
  label={t('sign_up.email.label')}
  error={Boolean(formState.errors.email)}
  helperText={formState.errors.email?.message}
  {...register('email')}
/>;
```

Validation messages should map to translation keys, not hardcoded strings.
