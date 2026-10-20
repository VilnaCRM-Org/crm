import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';

import UserProfile from '@/modules/user/features/settings/routes/user-profile';
import createLocaleI18n from '@tests/unit/utils/create-locale-i18n';

// The page registers its catalog on the shared i18n instance, which owns the merged catalog
// object createLocaleI18n clones. Replacing the shared instance keeps that registration away from
// the catalog this file builds its instances from.
jest.mock('@/i18n', () => ({ __esModule: true, default: { addResourceBundle: jest.fn() } }));

jest.mock('@/modules/user/features/settings/hooks/use-profile-load', () => ({
  __esModule: true,
  default: (): object => ({
    status: 'loading',
    user: null,
    version: 0,
    refocus: false,
    retry: (): undefined => undefined,
    adoption: {
      adopt: (): undefined => undefined,
      confirm: (): undefined => undefined,
      isCurrent: (): boolean => true,
    },
  }),
}));

describe('UserProfile lazy catalog', () => {
  it('renders the raw settings keys for an instance built from the merged catalog alone', () => {
    render(
      <I18nextProvider i18n={createLocaleI18n('uk')}>
        <UserProfile />
      </I18nextProvider>
    );

    expect(screen.getByRole('heading', { level: 1, name: 'settings.heading' })).toBeInTheDocument();
    expect(screen.getByText('settings.subtitle')).toBeInTheDocument();
  });
});
