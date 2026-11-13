import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, type JSX, type ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

import ProfileForm from '@/modules/user/features/settings/components/profile-form';
import { buildPassword, buildUserEntity } from '@tests/builders';
import createSettingsLocaleI18n from '@tests/unit/utils/create-settings-locale-i18n';
import expectNoA11yViolations from '@tests/utils/a11y/expect-no-a11y-violations';

const NEW_PASSWORD = buildPassword();

const mockUpdate = jest.fn();

jest.mock('@/providers/di', () => ({
  __esModule: true,
  useService: (): object => ({ update: mockUpdate, resend: jest.fn() }),
}));

const wrapper = ({ children }: { children: ReactNode }): JSX.Element => (
  <I18nextProvider i18n={createSettingsLocaleI18n('uk')}>
    <main>{children}</main>
  </I18nextProvider>
);

const form = (): JSX.Element => (
  <ProfileForm
    user={buildUserEntity({ fullName: 'Олена Петренко', email: 'olena@example.com' })}
    adoption={{
      adopt: jest.fn(),
      confirm: jest.fn(),
      isCurrent: (): boolean => true,
      revision: (): number => 0,
    }}
    refocus={false}
    toasts={{
      toasts: { items: [] },
      announcement: '',
      alert: '',
      show: jest.fn(),
      dismiss: jest.fn(),
    }}
    saveRef={createRef<HTMLElement>()}
    headingRef={createRef<HTMLElement>()}
  />
);

describe('profile form accessibility', () => {
  beforeEach(() => mockUpdate.mockReset());

  it('has no axe violations at rest', async () => {
    const view = render(form(), { wrapper });

    await expectNoA11yViolations(view.container);
  });

  it('has no axe violations while a save is running', async () => {
    mockUpdate.mockReturnValue(new Promise(() => undefined));
    const view = render(form(), { wrapper });
    await userEvent.type(screen.getByLabelText('Новий пароль'), NEW_PASSWORD);
    await userEvent.type(screen.getByLabelText('Поточний пароль'), 'abc');
    await userEvent.click(screen.getByRole('button', { name: 'Зберегти зміни' }));
    await waitFor(() => expect(mockUpdate).toHaveBeenCalledTimes(1));

    expect(document.forms[2]).toHaveAttribute('aria-busy', 'true');
    await expectNoA11yViolations(view.container);
  });

  it('has no axe violations with field errors showing', async () => {
    const view = render(form(), { wrapper });
    await userEvent.type(screen.getByLabelText('Новий пароль'), 'Pa1');
    await userEvent.type(screen.getByLabelText('Поточний пароль'), 'abc');
    await userEvent.click(screen.getByRole('button', { name: 'Зберегти зміни' }));
    await screen.findByText('Будь ласка, введіть від 8 до 64 символів');

    await expectNoA11yViolations(view.container);
  });

  it('has no axe violations with the rules shown for the focused new password', async () => {
    const view = render(form(), { wrapper });
    await userEvent.click(screen.getByLabelText('Новий пароль'));

    expect(screen.getByLabelText('Новий пароль')).toHaveFocus();
    await expectNoA11yViolations(view.container);
  });

  it('has no axe violations for the Clear button idle', async () => {
    const view = render(form(), { wrapper });

    await act(async () => undefined);

    await expectNoA11yViolations(view.container);
    expect(screen.getByRole('button', { name: 'Очистити' })).toBeInTheDocument();
  });

  it('has no axe violations with the name form revealed', async () => {
    const view = render(form(), { wrapper });

    await userEvent.type(screen.getByLabelText('Ваше ПІБ'), ' Іванівна');

    expect(screen.getByLabelText('Пароль для зміни імені')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Зберегти ім’я' })).toBeVisible();
    await expectNoA11yViolations(view.container);
  });

  it('has no axe violations with the name and e-mail forms revealed together', async () => {
    const view = render(form(), { wrapper });

    await userEvent.type(screen.getByLabelText('Ваше ПІБ'), ' Іванівна');
    await userEvent.type(screen.getByLabelText('E-mail'), '.ua');

    expect(screen.getAllByRole('button', { name: 'Очистити' })).toHaveLength(3);
    await expectNoA11yViolations(view.container);
  });

  it('has no axe violations with a server error on the revealed name password', async () => {
    mockUpdate.mockResolvedValue({
      kind: 'invalid',
      errors: { items: [{ field: 'currentPassword', reason: 'password_wrong' }] },
    });
    const view = render(form(), { wrapper });
    await userEvent.type(screen.getByLabelText('Ваше ПІБ'), ' Іванівна');
    await userEvent.type(screen.getByLabelText('Пароль для зміни імені'), 'abc');

    await userEvent.click(screen.getByRole('button', { name: 'Зберегти ім’я' }));
    await screen.findByText('Неправильний поточний пароль');

    await expectNoA11yViolations(view.container);
  });
});
