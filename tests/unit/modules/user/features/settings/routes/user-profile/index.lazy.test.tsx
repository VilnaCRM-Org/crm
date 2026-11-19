import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';

import createLocaleI18n from '@tests/unit/utils/create-locale-i18n';
import renderUserProfile from '@tests/unit/utils/render-user-profile';

// The page registers its catalog on the shared i18n instance, which owns the merged catalog
// object createLocaleI18n clones. Replacing the shared instance keeps that registration away from
// the catalog this file builds its instances from.
jest.mock('@/i18n', () => ({ __esModule: true, default: { addResourceBundle: jest.fn() } }));

jest.mock('@/modules/user/features/settings/hooks/use-profile-load', () =>
  jest.requireActual('@tests/unit/utils/loading-profile-load-stub')
);

describe('UserProfile lazy catalog', () => {
  it('renders the raw settings keys for an instance built from the merged catalog alone', () => {
    renderUserProfile(createLocaleI18n('uk'));

    expect(screen.getByRole('heading', { level: 1, name: 'settings.heading' })).toBeInTheDocument();
    expect(screen.getByText('settings.subtitle')).toBeInTheDocument();
  });
});
