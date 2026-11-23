import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { JSX } from 'react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router';

import UserProfile from '@/modules/user/features/settings/routes/user-profile';
import { buildUserEntity } from '@tests/builders';
import createSettingsLocaleI18n from '@tests/unit/utils/create-settings-locale-i18n';
import OutcomeNoticeHeader from '@tests/unit/utils/outcome-notice-header';
import SessionOutlet from '@tests/unit/utils/session-outlet';
import expectNoA11yViolations from '@tests/utils/a11y/expect-no-a11y-violations';
import { resetClientStores } from '@tests/utils/reset-client-stores';

const mockRead = jest.fn();
const mockUpdate = jest.fn();
const mockProvider = {
  read: mockRead,
  update: mockUpdate,
  resend: jest.fn(),
  fromFullName: (fullName: string): object =>
    new (jest.requireActual(
      '@/modules/user/store/user-display-name-mapper'
    ).default)().fromFullName(fullName),
};

jest.mock('@/providers/di', () => ({
  __esModule: true,
  useService: (): object => mockProvider,
}));

const SAVE_EMAIL = 'Зберегти пошту';
const EMAIL_SENT = 'Ми надіслали посилання для підтвердження на нову адресу';
const TRANSIENT = 'Не вдалося зберегти зміни. Перевірте з’єднання та спробуйте ще раз.';

const announced = (role: 'status' | 'alert', text: string): Promise<void> =>
  waitFor(() =>
    expect(screen.getAllByRole(role).some((node) => node.textContent?.includes(text))).toBe(true)
  );

const waitForSettledSave = async (): Promise<void> => {
  await waitFor(() => expect(screen.getByRole('button', { name: SAVE_EMAIL })).toBeEnabled());
  await waitFor(() => expect(screen.getByRole('button', { name: SAVE_EMAIL })).toHaveFocus());
};

const page = (): JSX.Element => (
  <I18nextProvider i18n={createSettingsLocaleI18n('uk')}>
    <OutcomeNoticeHeader />
    <main>
      <MemoryRouter>
        <SessionOutlet>
          <UserProfile />
        </SessionOutlet>
      </MemoryRouter>
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
  await userEvent.type(screen.getByLabelText('Пароль для зміни пошти'), 'abc');
};

describe('settings page states accessibility', () => {
  beforeEach(() => {
    resetClientStores();
    mockRead.mockReset();
    mockUpdate.mockReset();
  });

  it('has no axe violations with a success outcome showing', async () => {
    mockUpdate.mockResolvedValue({ kind: 'ok', user: buildUserEntity() });
    await openAndEdit();

    await userEvent.click(screen.getByRole('button', { name: SAVE_EMAIL }));
    await announced('status', EMAIL_SENT);

    await expectNoA11yViolations(document.body);
  });

  it('has no axe violations with an error outcome and its action', async () => {
    mockUpdate.mockResolvedValue({ kind: 'failed', reason: 'transient' });
    await openAndEdit();

    await userEvent.click(screen.getByRole('button', { name: SAVE_EMAIL }));
    await announced('alert', TRANSIENT);
    await waitForSettledSave();

    await expectNoA11yViolations(document.body);
  });

  it('has no axe violations with field errors showing', async () => {
    mockUpdate.mockResolvedValue({
      kind: 'invalid',
      errors: { items: [{ field: 'currentPassword', reason: 'password_wrong' }] },
    });
    await openAndEdit();

    await userEvent.click(screen.getByRole('button', { name: SAVE_EMAIL }));
    await screen.findByText('Неправильний поточний пароль');

    await expectNoA11yViolations(document.body);
  });

  it('shows the outcome in the bell notice only', async () => {
    mockUpdate.mockResolvedValue({ kind: 'failed', reason: 'transient' });
    await openAndEdit();

    await userEvent.click(screen.getByRole('button', { name: SAVE_EMAIL }));
    await announced('alert', TRANSIENT);
    await waitForSettledSave();

    const shown = screen
      .getAllByText(TRANSIENT, { exact: false })
      .filter((node) => node.getAttribute('role') !== 'alert');
    expect(shown).toHaveLength(1);
    expect(within(screen.getByRole('banner')).getByText(TRANSIENT)).toBe(shown[0]);
  });
});
