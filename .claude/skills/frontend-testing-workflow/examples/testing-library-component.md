# Testing Library Component Example

The component is defined inline here so the snippet is self-contained and runnable:

```typescript
import { Button } from '@mui/material';
import { render, screen } from '@testing-library/react';
import i18next from 'i18next';
import { I18nextProvider, initReactI18next, useTranslation } from 'react-i18next';

interface ProfileSavePanelProps {
  isSaving: boolean;
  onSave: () => void;
}

function ProfileSavePanel({ isSaving, onSave }: ProfileSavePanelProps) {
  const { t } = useTranslation();

  return (
    <section aria-labelledby="profile-save-title">
      <h2 id="profile-save-title">{t('profile.save.title')}</h2>
      <Button type="button" onClick={onSave} disabled={isSaving}>
        {t('profile.save.button')}
      </Button>
    </section>
  );
}

const i18n = i18next.createInstance();

beforeAll(() =>
  i18n.use(initReactI18next).init({
    lng: 'en',
    fallbackLng: 'en',
    resources: {
      en: {
        translation: {
          'profile.save.title': 'Profile',
          'profile.save.button': 'Save',
        },
      },
    },
    interpolation: { escapeValue: false },
    initImmediate: false,
  })
);

test('shows translated submit action', () => {
  render(
    <I18nextProvider i18n={i18n}>
      <ProfileSavePanel isSaving={false} onSave={jest.fn()} />
    </I18nextProvider>
  );

  expect(screen.getByRole('button', { name: /save/i })).toBeEnabled();
});
```

Prefer role, label, and visible text queries over implementation details.
