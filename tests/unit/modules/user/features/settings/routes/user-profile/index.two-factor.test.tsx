import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';

import UserProfile from '@/modules/user/features/settings/routes/user-profile';
import createSettingsLocaleI18n from '@tests/unit/utils/create-settings-locale-i18n';

import { panelProps } from '../../components/two-factor-settings/render-panel';

const mockTwoFactorHook = jest.fn();

jest.mock('@/modules/user/features/settings/hooks/use-two-factor-settings', () => ({
  __esModule: true,
  default: (): unknown => mockTwoFactorHook(),
}));

jest.mock('@/modules/user/features/settings/hooks/use-profile-load', () =>
  jest.requireActual('@tests/unit/utils/loading-profile-load-stub')
);

const renderPage = (): void => {
  render(
    <I18nextProvider i18n={createSettingsLocaleI18n('uk')}>
      <UserProfile />
    </I18nextProvider>
  );
};

describe('UserProfile two-factor section', () => {
  beforeEach(() => {
    mockTwoFactorHook.mockReset();
    mockTwoFactorHook.mockReturnValue(panelProps());
  });

  it('always shows the section in the off view after the profile column', () => {
    renderPage();

    const section = screen.getByRole('region', { name: 'Двофакторна автентифікація' });
    const social = screen.getByRole('heading', { level: 2, name: 'Соціальні мережі' });
    expect(section).toBeInTheDocument();
    expect(social.compareDocumentPosition(section)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(screen.getByRole('button', { name: 'Почати налаштування' })).toBeInTheDocument();
    expect(mockTwoFactorHook).toHaveBeenCalled();
  });
});
