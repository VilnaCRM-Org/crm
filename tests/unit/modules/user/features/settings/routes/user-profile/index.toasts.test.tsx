import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router';

import UserProfile from '@/modules/user/features/settings/routes/user-profile';
import createSettingsLocaleI18n from '@tests/unit/utils/create-settings-locale-i18n';
import SessionOutlet from '@tests/unit/utils/session-outlet';

const mockDismiss = jest.fn();

jest.mock('@/hooks/use-toast-queue', () => ({
  __esModule: true,
  default: (): object => ({
    toasts: { items: [{ id: 1, tone: 'error', message: 'Не вдалося зберегти зміни' }] },
    announcement: '',
    alert: 'Не вдалося зберегти зміни',
    show: (): undefined => undefined,
    dismiss: mockDismiss,
  }),
}));

jest.mock('@/modules/user/features/settings/hooks/use-profile-load', () =>
  jest.requireActual('@tests/unit/utils/loading-profile-load-stub')
);

const renderPage = (): void => {
  render(
    <I18nextProvider i18n={createSettingsLocaleI18n('uk')}>
      <MemoryRouter>
        <SessionOutlet>
          <UserProfile />
        </SessionOutlet>
      </MemoryRouter>
    </I18nextProvider>
  );
};

describe('UserProfile toasts', () => {
  it('makes the heading a programmatic focus target only', () => {
    renderPage();

    expect(screen.getByRole('heading', { level: 1 })).toHaveAttribute('tabindex', '-1');
  });

  it('announces the queue alert through the stack alert region', () => {
    renderPage();

    expect(
      screen.getByText('Не вдалося зберегти зміни', { selector: '[role="alert"]' })
    ).toBeInTheDocument();
  });

  it('moves focus to the heading when a toast closes while Save is not on the page', async () => {
    renderPage();

    await userEvent.click(screen.getByRole('button', { name: 'Закрити сповіщення' }));

    expect(screen.getByRole('heading', { level: 1, name: 'Налаштування' })).toHaveFocus();
    expect(mockDismiss).toHaveBeenCalledWith(1);
  });
});
