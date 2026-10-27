import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';

import UserProfile from '@/modules/user/features/settings/routes/user-profile';
import createSettingsLocaleI18n from '@tests/unit/utils/create-settings-locale-i18n';

import { panelProps } from '../../components/two-factor-settings/render-panel';

const mockFlag = jest.fn();
const mockTwoFactorHook = jest.fn();

jest.mock('@/hooks/use-feature-flag', () => ({
  __esModule: true,
  default: (flag: string): boolean => mockFlag(flag),
}));

jest.mock('@/modules/user/features/settings/hooks/use-two-factor-settings', () => ({
  __esModule: true,
  default: (): unknown => mockTwoFactorHook(),
}));

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

const renderPage = (): void => {
  render(
    <I18nextProvider i18n={createSettingsLocaleI18n('uk')}>
      <UserProfile />
    </I18nextProvider>
  );
};

describe('UserProfile two-factor section', () => {
  beforeEach(() => {
    mockFlag.mockReset();
    mockTwoFactorHook.mockReset();
    mockTwoFactorHook.mockReturnValue(panelProps());
  });

  it('reads the twoFactorAuth flag', () => {
    mockFlag.mockReturnValue(false);

    renderPage();

    expect(mockFlag).toHaveBeenCalledWith('twoFactorAuth');
  });

  it('shows the section in the off view after the profile column when the flag is on', () => {
    mockFlag.mockReturnValue(true);

    renderPage();

    const section = screen.getByRole('region', { name: 'Двофакторна автентифікація' });
    const social = screen.getByRole('heading', { level: 2, name: 'Соціальні мережі' });
    expect(section).toBeInTheDocument();
    expect(social.compareDocumentPosition(section)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(screen.getByRole('button', { name: 'Почати налаштування' })).toBeInTheDocument();
    expect(mockTwoFactorHook).toHaveBeenCalled();
  });

  it('leaves the section out and calls no 2FA hook when the flag is off', () => {
    mockFlag.mockReturnValue(false);

    renderPage();

    expect(
      screen.queryByRole('region', { name: 'Двофакторна автентифікація' })
    ).not.toBeInTheDocument();
    expect(mockTwoFactorHook).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { level: 2, name: 'Соціальні мережі' })).toBeInTheDocument();
  });
});
