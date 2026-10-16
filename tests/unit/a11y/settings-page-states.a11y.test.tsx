import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { JSX } from 'react';
import { I18nextProvider } from 'react-i18next';

import UserProfile from '@/modules/user/features/settings/routes/user-profile';
import { buildUserEntity } from '@tests/builders';
import createSettingsLocaleI18n from '@tests/unit/utils/create-settings-locale-i18n';
import expectNoA11yViolations from '@tests/utils/a11y/expect-no-a11y-violations';

const mockRead = jest.fn();
const mockUpdate = jest.fn();
const mockProvider = { read: mockRead, update: mockUpdate, resend: jest.fn() };

jest.mock('@/providers/di', () => ({
  __esModule: true,
  useService: (): object => mockProvider,
}));

const page = (): JSX.Element => (
  <I18nextProvider i18n={createSettingsLocaleI18n('uk')}>
    <main>
      <UserProfile />
    </main>
  </I18nextProvider>
);

const openAndEdit = async (): Promise<void> => {
  mockRead.mockResolvedValue({
    kind: 'ok',
    user: buildUserEntity({ fullName: 'Олена Петренко', email: 'olena@example.com' }),
  });
  render(page());
  await screen.findByRole('heading', { level: 2, name: 'Особисті дані' });
  await userEvent.type(screen.getByLabelText('E-mail'), '.ua');
  await userEvent.type(screen.getByLabelText('Поточний пароль'), 'abc');
};

describe('settings page states accessibility', () => {
  beforeEach(() => {
    mockRead.mockReset();
    mockUpdate.mockReset();
  });

  it('has no axe violations with toasts showing', async () => {
    mockUpdate.mockResolvedValue({ kind: 'ok', user: buildUserEntity() });
    await openAndEdit();

    await userEvent.click(screen.getByRole('button', { name: 'Зберегти зміни' }));
    await screen.findByRole('button', { name: 'Закрити сповіщення' });

    await expectNoA11yViolations(document.body);
  });

  it('has no axe violations with an error toast and its action', async () => {
    mockUpdate.mockResolvedValue({ kind: 'failed', reason: 'transient' });
    await openAndEdit();

    await userEvent.click(screen.getByRole('button', { name: 'Зберегти зміни' }));
    await screen.findByRole('alert');

    await expectNoA11yViolations(document.body);
  });

  it('has no axe violations with field errors showing', async () => {
    mockUpdate.mockResolvedValue({
      kind: 'invalid',
      errors: { items: [{ field: 'currentPassword', reason: 'password_wrong' }] },
    });
    await openAndEdit();

    await userEvent.click(screen.getByRole('button', { name: 'Зберегти зміни' }));
    await screen.findByText('Неправильний поточний пароль');

    await expectNoA11yViolations(document.body);
  });
});
