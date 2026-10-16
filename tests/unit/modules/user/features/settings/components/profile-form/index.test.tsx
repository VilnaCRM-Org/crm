import '@testing-library/jest-dom';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, type JSX, type ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

import ProfileForm from '@/modules/user/features/settings/components/profile-form';
import { buildUserEntity } from '@tests/builders';
import createSettingsLocaleI18n from '@tests/unit/utils/create-settings-locale-i18n';

const mockUpdate = jest.fn();
const mockProvider = { update: mockUpdate, resend: jest.fn() };

jest.mock('@/providers/di', () => ({
  __esModule: true,
  useService: (): object => mockProvider,
}));

const wrapper = ({ children }: { children: ReactNode }): JSX.Element => (
  <I18nextProvider i18n={createSettingsLocaleI18n('uk', ['en'])}>{children}</I18nextProvider>
);

type Props = Parameters<typeof ProfileForm>[0];

const user = buildUserEntity({
  id: '/api/users/1',
  fullName: 'Олена Петренко',
  email: 'olena@example.com',
  confirmed: true,
});

const NAME = 'Ваше ім’я та прізвище';
const CURRENT = 'Поточний пароль';
const NEW = 'Новий пароль';
const SAVE = 'Зберегти зміни';

const props = (overrides: Partial<Props> = {}): Props => ({
  user,
  adoption: { adopt: jest.fn(), confirm: jest.fn() },
  version: 0,
  refocus: false,
  toasts: { toasts: { items: [] }, announcement: '', show: jest.fn(), dismiss: jest.fn() },
  saveRef: createRef<HTMLButtonElement>(),
  ...overrides,
});

const form = (overrides: Partial<Props> = {}): JSX.Element => {
  const state = props(overrides);
  return (
    <ProfileForm
      user={state.user}
      adoption={state.adoption}
      version={state.version}
      refocus={state.refocus}
      toasts={state.toasts}
      saveRef={state.saveRef}
    />
  );
};

const field = (label: string): HTMLInputElement => screen.getByLabelText(label) as HTMLInputElement;

const save = (): HTMLElement => screen.getByRole('button', { name: SAVE });

const okOutcome = { kind: 'ok', user: buildUserEntity() };

describe('ProfileForm', () => {
  beforeEach(() => {
    mockUpdate.mockReset();
    mockUpdate.mockResolvedValue(okOutcome);
  });

  it('renders the personal and password sections with their fields', () => {
    render(form(), { wrapper });

    expect(screen.getByRole('heading', { level: 2, name: 'Особисті дані' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Пароль' })).toBeInTheDocument();
    expect(field(NAME)).toHaveValue('Олена Петренко');
    expect(field(NAME)).toHaveAttribute('autocomplete', 'name');
    expect(field('E-mail')).toHaveValue('olena@example.com');
    expect(field('E-mail')).toHaveAttribute('type', 'email');
    expect(field('E-mail')).toHaveAttribute('autocomplete', 'email');
    expect(field(CURRENT)).toHaveValue('');
    expect(field(CURRENT)).toHaveAttribute('autocomplete', 'current-password');
    expect(field(CURRENT)).toHaveAttribute('type', 'password');
    expect(field(NEW)).toHaveValue('');
    expect(field(NEW)).toHaveAttribute('autocomplete', 'new-password');
  });

  it('describes the new password by its hint and the translated rule list', () => {
    render(form(), { wrapper });

    const describedBy = field(NEW).getAttribute('aria-describedby') ?? '';

    expect(describedBy).toContain('new-password-hint');
    expect(describedBy).toContain('new-password-rules');
    expect(
      screen.getByText('Необов’язково. Залиште порожнім, щоб не змінювати пароль.')
    ).toBeInTheDocument();
    expect(screen.queryByText(/password_policy\./)).not.toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(4);
  });

  it('shows the password as text when its eye toggle is activated with Space', async () => {
    render(form(), { wrapper });
    const [toggle] = screen.getAllByRole('button', { name: 'Показати пароль' });
    act(() => toggle?.focus());

    await userEvent.keyboard(' ');

    expect(field(CURRENT)).toHaveAttribute('type', 'text');
    const pressed = screen.getByRole('button', { name: 'Приховати пароль' });
    expect(pressed).toHaveAttribute('aria-pressed', 'true');
  });

  it('exposes the save button through the save ref', () => {
    const saveRef = createRef<HTMLButtonElement>();
    render(form({ saveRef }), { wrapper });

    expect(saveRef.current).toBe(save());
  });

  it('sends an e-mail-only change for a legacy name that fails the client rule', async () => {
    const legacy = buildUserEntity({ fullName: 'admin', email: 'a@example.com' });
    render(form({ user: legacy }), { wrapper });
    await userEvent.clear(field('E-mail'));
    await userEvent.type(field('E-mail'), 'b@example.com');
    await userEvent.type(field(CURRENT), 'abc');

    await userEvent.click(save());

    await waitFor(() => expect(mockUpdate).toHaveBeenCalledTimes(1));
    expect(mockUpdate.mock.calls[0]?.[0]).toEqual({
      id: legacy.id,
      currentPassword: 'abc',
      email: 'b@example.com',
    });
    expect(screen.queryByText(/правильному форматі/)).not.toBeInTheDocument();
  });

  it('rejects an edited single-word name, focuses it and sends nothing', async () => {
    render(form(), { wrapper });
    await userEvent.clear(field(NAME));
    await userEvent.type(field(NAME), 'Олена');
    await userEvent.type(field(CURRENT), 'abc');

    await userEvent.click(save());

    expect(
      await screen.findByText('Будь ласка, введіть повне ім’я у правильному форматі')
    ).toBeInTheDocument();
    expect(field(NAME)).toHaveFocus();
    expect(field(NAME)).toHaveAttribute('aria-invalid', 'true');
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('requires the current password for a change, focuses it and sends nothing', async () => {
    render(form(), { wrapper });
    await userEvent.type(field('E-mail'), '.ua');

    await userEvent.click(save());

    expect(await screen.findByText("Це поле обов'язкове")).toBeInTheDocument();
    expect(field(CURRENT)).toHaveFocus();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('shows the no-change status for a lone current password and no field error', async () => {
    render(form(), { wrapper });
    await userEvent.type(field(CURRENT), 'abc');

    await userEvent.click(save());

    expect(await screen.findByText('Немає змін для збереження')).toBeInTheDocument();
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(screen.queryByText("Це поле обов'язкове")).not.toBeInTheDocument();
    expect(
      screen.getAllByRole('status').some((node) => node.textContent?.includes('Немає змін'))
    ).toBe(true);
  });

  it('sends no newPassword and shows no rule error for an empty new password', async () => {
    render(form(), { wrapper });
    await userEvent.type(field(NAME), ' Іванівна');
    await userEvent.type(field(CURRENT), 'abc');

    await userEvent.click(save());

    await waitFor(() => expect(mockUpdate).toHaveBeenCalledTimes(1));
    expect(Object.keys(mockUpdate.mock.calls[0]?.[0] as object)).not.toContain('newPassword');
  });

  it('marks only the length rule unmet for Pa1 and rejects it on Save', async () => {
    render(form(), { wrapper });
    await userEvent.type(field(CURRENT), 'abc');
    await userEvent.type(field(NEW), 'Pa1');

    expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      expect.stringContaining('не виконано'),
      expect.stringContaining('виконано'),
      expect.stringContaining('виконано'),
      expect.stringContaining('виконано'),
    ]);
    await userEvent.click(save());

    expect(await screen.findByText('Будь ласка, введіть від 8 до 64 символів')).toBeInTheDocument();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('shows the uppercase message for a Cyrillic-only password and focuses it', async () => {
    render(form(), { wrapper });
    await userEvent.type(field(CURRENT), 'abc');
    await userEvent.type(field(NEW), 'Пароль123');

    await userEvent.click(save());

    expect(
      await screen.findByText('Будь ласка, додайте принаймні одну велику латинську літеру (A–Z)')
    ).toBeInTheDocument();
    expect(field(NEW)).toHaveFocus();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('disables the button, flags the form busy and announces saving', async () => {
    let settle: (value: unknown) => void = () => undefined;
    mockUpdate.mockReturnValue(new Promise((resolve) => (settle = resolve)));
    render(form(), { wrapper });
    await userEvent.type(field(NAME), ' Іванівна');
    await userEvent.type(field(CURRENT), 'abc');

    await userEvent.click(save());

    expect(save()).toBeDisabled();
    expect(document.forms[0]).toHaveAttribute('aria-busy', 'true');
    expect(screen.getAllByRole('status').some((node) => node.textContent === 'Збереження…')).toBe(
      true
    );
    await act(async () => settle(okOutcome));
  });

  it('submits with Enter in any field', async () => {
    render(form(), { wrapper });
    await userEvent.type(field(NAME), ' Іванівна');
    await userEvent.type(field(CURRENT), 'abc{Enter}');

    await waitFor(() => expect(mockUpdate).toHaveBeenCalledTimes(1));
  });

  it('adopts the saved entity and focuses the save button once the save settled', async () => {
    const adopt = jest.fn();
    render(form({ adoption: { adopt, confirm: jest.fn() } }), { wrapper });
    await userEvent.type(field(NAME), ' Іванівна');
    await userEvent.type(field(CURRENT), 'abc');
    await userEvent.click(screen.getByRole('heading', { level: 2, name: 'Пароль' }));

    await userEvent.click(save());

    await waitFor(() => expect(adopt).toHaveBeenCalledWith(okOutcome.user));
    await waitFor(() => expect(save()).toHaveFocus());
  });

  it('focuses the first server field error in DOM order with aria-invalid', async () => {
    mockUpdate.mockResolvedValue({
      kind: 'invalid',
      errors: {
        items: [
          { field: 'currentPassword', reason: 'password_wrong' },
          { field: 'email', reason: 'email_taken' },
        ],
      },
    });
    render(form(), { wrapper });
    await userEvent.type(field('E-mail'), '.ua');
    await userEvent.type(field(CURRENT), 'abc');

    await userEvent.click(save());

    expect(await screen.findByText('Неправильний поточний пароль')).toBeInTheDocument();
    expect(field('E-mail')).toHaveAttribute('aria-invalid', 'true');
    expect(field(CURRENT)).toHaveAttribute('aria-invalid', 'true');
    await waitFor(() => expect(field('E-mail')).toHaveFocus());
  });

  it('shows the e-mail taken message for an email_taken violation', async () => {
    mockUpdate.mockResolvedValue({
      kind: 'invalid',
      errors: { items: [{ field: 'email', reason: 'email_taken' }] },
    });
    render(form(), { wrapper });
    await userEvent.type(field('E-mail'), '.ua');
    await userEvent.type(field(CURRENT), 'abc');

    await userEvent.click(save());

    expect(
      await screen.findByText(/вже використовується|вже зареєстрован|зайнят/i)
    ).toBeInTheDocument();
  });

  it('focuses the personal details heading when a retried read settled', async () => {
    render(form({ refocus: true }), { wrapper });

    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 2, name: 'Особисті дані' })).toHaveFocus()
    );
    expect(screen.getByRole('heading', { level: 2, name: 'Особисті дані' })).toHaveAttribute(
      'tabindex',
      '-1'
    );
  });

  it('does not move focus on the first render', () => {
    render(form(), { wrapper });

    expect(document.body).toHaveFocus();
  });

  it('reads the new defaults and clears the passwords when the version changes', async () => {
    const view = render(form({ version: 0 }), { wrapper });
    await userEvent.type(field(CURRENT), 'abc');
    const next = buildUserEntity({ fullName: 'Ірина Коваль', email: 'new@example.com' });

    view.rerender(form({ user: next, version: 1 }));

    expect(field(NAME)).toHaveValue('Ірина Коваль');
    expect(field('E-mail')).toHaveValue('new@example.com');
    expect(field(CURRENT)).toHaveValue('');
    expect(field(NEW)).toHaveValue('');
  });

  it('keeps edits and typed passwords when only the entity changes', async () => {
    const view = render(form({ version: 0 }), { wrapper });
    await userEvent.type(field(CURRENT), 'abc');
    await userEvent.type(field(NAME), ' Іванівна');

    view.rerender(form({ user: { ...user, confirmed: false }, version: 0 }));

    expect(field(CURRENT)).toHaveValue('abc');
    expect(field(NAME)).toHaveValue('Олена Петренко Іванівна');
  });

  describe('Clear', () => {
    it('restores the loaded values, empties both passwords and removes every error', async () => {
      render(form(), { wrapper });
      await userEvent.clear(field(NAME));
      await userEvent.type(field(NAME), 'Олена');
      await userEvent.type(field(CURRENT), 'abc');
      await userEvent.type(field(NEW), 'Next12345');
      await userEvent.click(save());
      await screen.findByText('Будь ласка, введіть повне ім’я у правильному форматі');
      const clear = screen.getByRole('button', { name: 'Очистити' });

      await userEvent.click(clear);

      expect(field(NAME)).toHaveValue('Олена Петренко');
      expect(field(CURRENT)).toHaveValue('');
      expect(field(NEW)).toHaveValue('');
      expect(field(NAME)).not.toHaveAttribute('aria-invalid', 'true');
      expect(field(CURRENT)).toHaveAttribute('type', 'password');
      expect(mockUpdate).not.toHaveBeenCalled();
      expect(clear).toHaveFocus();
    });

    it('clears the no-change status', async () => {
      render(form(), { wrapper });
      await userEvent.type(field(CURRENT), 'abc');
      await userEvent.click(save());
      await screen.findByText('Немає змін для збереження');

      await userEvent.click(screen.getByRole('button', { name: 'Очистити' }));

      expect(screen.queryByText('Немає змін для збереження')).not.toBeInTheDocument();
    });

    it('is a type=button that never submits', () => {
      render(form(), { wrapper });

      expect(screen.getByRole('button', { name: 'Очистити' })).toHaveAttribute('type', 'button');
    });

    it('is aria-disabled and does nothing while a save is running', async () => {
      let settle: (value: unknown) => void = () => undefined;
      mockUpdate.mockReturnValue(new Promise((resolve) => (settle = resolve)));
      render(form(), { wrapper });
      await userEvent.type(field(NAME), ' Іванівна');
      await userEvent.type(field(CURRENT), 'abc');
      await userEvent.click(save());
      const clear = screen.getByRole('button', { name: 'Очистити' });

      await userEvent.click(clear);

      expect(clear).toHaveAttribute('aria-disabled', 'true');
      expect(field(CURRENT)).toHaveValue('abc');
      await act(async () => settle(okOutcome));
    });
  });
});
