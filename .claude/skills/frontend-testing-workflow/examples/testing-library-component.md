# Testing Library Component Example

```typescript
import { render, screen } from '@testing-library/react';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

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

afterAll(() => {
  i18n.removeResourceBundle('en', 'translation');
});

test('shows translated submit action', () => {
  render(<ProfileSavePanel isSaving={false} onSave={jest.fn()} />);

  expect(screen.getByRole('button', { name: /save/i })).toBeEnabled();
});
```

Prefer role, label, and visible text queries over implementation details.
