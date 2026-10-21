import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';

import i18n from '@/i18n';
import UserProfile from '@/modules/user/features/settings/routes/user-profile';
import createSettingsLocaleI18n from '@tests/unit/utils/create-settings-locale-i18n';

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

describe('UserProfile', () => {
  it('renders one level-1 heading, the social card heading and the subtitle', () => {
    render(
      <I18nextProvider i18n={createSettingsLocaleI18n('uk')}>
        <UserProfile />
      </I18nextProvider>
    );

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1, name: 'Налаштування' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Соціальні мережі' })).toBeInTheDocument();
    expect(
      screen.getByText('Керуйте особистими даними та безпекою облікового запису.')
    ).toBeInTheDocument();
  });

  it('renders the English copy for an English session', () => {
    render(
      <I18nextProvider i18n={createSettingsLocaleI18n('en')}>
        <UserProfile />
      </I18nextProvider>
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Settings' })).toBeInTheDocument();
    expect(
      screen.getByText('Manage your personal details and account security.')
    ).toBeInTheDocument();
  });

  it('adds no landmark of its own, leaving the main landmark to AppLayout', () => {
    render(
      <I18nextProvider i18n={createSettingsLocaleI18n('uk')}>
        <UserProfile />
      </I18nextProvider>
    );

    expect(screen.queryByRole('main')).not.toBeInTheDocument();
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('puts the subtitle after the heading, as the subtitle', () => {
    render(
      <I18nextProvider i18n={createSettingsLocaleI18n('uk')}>
        <UserProfile />
      </I18nextProvider>
    );

    const heading = screen.getByRole('heading', { level: 1 });
    const subtitle = screen.getByText('Керуйте особистими даними та безпекою облікового запису.');

    expect(heading.compareDocumentPosition(subtitle)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it('sets the document title from the settings catalog', async () => {
    render(
      <I18nextProvider i18n={createSettingsLocaleI18n('uk')}>
        <UserProfile />
      </I18nextProvider>
    );

    await waitFor(() => expect(document.title).toBe('Налаштування - VilnaCRM'));
  });

  it('registers both locale bundles on the shared instance when the module evaluates', () => {
    expect(i18n.getResource('uk', 'translation', 'settings.title')).toBe('Налаштування');
    expect(i18n.getResource('en', 'translation', 'settings.title')).toBe('Settings');
  });
});
