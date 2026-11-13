import '@testing-library/jest-dom';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, type JSX, type ReactNode, useState } from 'react';
import { I18nextProvider } from 'react-i18next';

import ProfileForm from '@/modules/user/features/settings/components/profile-form';
import { buildEmail, buildFullName, buildPassword, buildUserEntity } from '@tests/builders';
import createSettingsLocaleI18n from '@tests/unit/utils/create-settings-locale-i18n';
import { doubledClass, styleRuleFor } from '@tests/unit/utils/emotion-style-rules';

const NEW_EMAIL = buildEmail();
const NEW_NAME = buildFullName();
const NEW_PASSWORD = buildPassword();
const SECTION_PASSWORD = buildPassword();
const ENTERED_PASSWORD = buildPassword();
const KEPT_PASSWORD = buildPassword();
const EMAIL_FORM_PASSWORD = buildPassword();
const PASSWORD_FORM_PASSWORD = buildPassword();

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

const NAME = 'Ваше ПІБ';
const EMAIL = 'E-mail';
const NAME_PASSWORD = 'Пароль для зміни імені';
const EMAIL_PASSWORD = 'Пароль для зміни пошти';
const CURRENT = 'Поточний пароль';
const NEW = 'Новий пароль';
const SAVE_NAME = 'Зберегти ім’я';
const SAVE_EMAIL = 'Зберегти пошту';
const SAVE = 'Зберегти зміни';
const CLEAR = 'Очистити';
const NO_CHANGES = 'Немає змін для збереження';
const REQUIRED = "Це поле обов'язкове";
const BAD_NAME = 'Будь ласка, введіть повне ім’я у правильному форматі';
const BAD_LENGTH = 'Будь ласка, введіть від 8 до 64 символів';

const props = (overrides: Partial<Props> = {}): Props => ({
  user,
  adoption: {
    adopt: jest.fn(),
    confirm: jest.fn(),
    isCurrent: (): boolean => true,
    revision: (): number => 0,
  },
  refocus: false,
  toasts: {
    toasts: { items: [] },
    announcement: '',
    alert: '',
    show: jest.fn(),
    dismiss: jest.fn(),
  },
  saveRef: createRef<HTMLElement>(),
  headingRef: createRef<HTMLElement>(),
  ...overrides,
});

const form = (overrides: Partial<Props> = {}): JSX.Element => {
  const state = props(overrides);
  return (
    <ProfileForm
      user={state.user}
      adoption={state.adoption}
      refocus={state.refocus}
      toasts={state.toasts}
      saveRef={state.saveRef}
      headingRef={state.headingRef}
    />
  );
};

function AdoptingForm({ initial }: { readonly initial: Props['user'] }): JSX.Element {
  const [current, setCurrent] = useState(initial);
  const [base] = useState(() => props());
  return (
    <ProfileForm
      user={current}
      adoption={{ ...base.adoption, adopt: setCurrent }}
      refocus={base.refocus}
      toasts={base.toasts}
      saveRef={base.saveRef}
      headingRef={base.headingRef}
    />
  );
}

const field = (label: string): HTMLInputElement => screen.getByLabelText(label) as HTMLInputElement;

const save = (name = SAVE): HTMLElement => screen.getByRole('button', { name });

const formOf = (label: string): HTMLFormElement => {
  const owner = Array.from(document.forms).find((candidate) => candidate.contains(field(label)));
  if (owner === undefined) throw new Error(`${label} is outside a form`);
  return owner;
};

const clearIn = (label: string): HTMLElement =>
  within(formOf(label)).getByRole('button', { name: CLEAR });

const editName = async (value = ' Іванівна', password = ENTERED_PASSWORD): Promise<void> => {
  await userEvent.type(field(NAME), value);
  await userEvent.type(field(NAME_PASSWORD), password);
};

const editEmail = async (value = '.ua', password = ENTERED_PASSWORD): Promise<void> => {
  await userEvent.type(field(EMAIL), value);
  await userEvent.type(field(EMAIL_PASSWORD), password);
};

const okOutcome = { kind: 'ok', user: buildUserEntity() };

describe('ProfileForm', () => {
  beforeEach(() => {
    mockUpdate.mockReset();
    mockUpdate.mockResolvedValue(okOutcome);
    mockProvider.resend.mockReset();
  });

  it('renders the personal and password sections with their fields', () => {
    render(form(), { wrapper });

    expect(screen.getByRole('heading', { level: 2, name: 'Особисті дані' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Пароль' })).toBeInTheDocument();
    expect(field(NAME)).toHaveValue('Олена Петренко');
    expect(field(NAME)).toHaveAttribute('autocomplete', 'name');
    expect(field(NAME)).toHaveAttribute('placeholder', 'Михайло Светський');
    expect(field(EMAIL)).toHaveValue('olena@example.com');
    expect(field(EMAIL)).toHaveAttribute('type', 'email');
    expect(field(EMAIL)).toHaveAttribute('autocomplete', 'email');
    expect(field(EMAIL)).toHaveAttribute('placeholder', 'vilnaCRM@gmail.com');
    expect(field(CURRENT)).toHaveValue('');
    expect(field(CURRENT)).toHaveAttribute('autocomplete', 'current-password');
    expect(field(CURRENT)).toHaveAttribute('type', 'password');
    expect(field(NEW)).toHaveValue('');
    expect(field(NEW)).toHaveAttribute('autocomplete', 'new-password');
  });

  it('renders three forms, one per thing that can be saved, in reading order', () => {
    render(form(), { wrapper });

    expect(document.forms).toHaveLength(3);
    expect(document.forms[0]).toContainElement(field(NAME));
    expect(document.forms[1]).toContainElement(field(EMAIL));
    expect(document.forms[2]).toContainElement(field(CURRENT));
    expect(document.forms[2]).toContainElement(field(NEW));
    const heading = screen.getByRole('heading', { level: 2, name: 'Особисті дані' });
    expect(document.forms[0]?.compareDocumentPosition(heading)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
    expect(heading.compareDocumentPosition(document.forms[1] as Node)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
  });

  it('describes the new password by its hint and the translated rule list', () => {
    render(form(), { wrapper });

    const describedBy = field(NEW).getAttribute('aria-describedby') ?? '';

    expect(describedBy).toContain('new-password-hint');
    expect(describedBy).toContain('new-password-rules');
    expect(screen.getByText('Введіть новий пароль, щоб замінити поточний.')).toBeInTheDocument();
    expect(screen.queryByText(/password_policy\./)).not.toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(4);
  });

  it('shows the unconfirmed status row with a resend control for an unconfirmed e-mail', () => {
    render(form({ user: buildUserEntity({ confirmed: false }) }), { wrapper });

    expect(screen.getByText('E-mail не підтверджено')).toHaveAttribute('id', 'email-status');
    expect(screen.getByRole('button', { name: 'Надіслати повторно' })).toBeInTheDocument();
    expect(field(EMAIL).getAttribute('aria-describedby')?.split(' ')).toEqual([
      'email-save-hint',
      'email-status',
    ]);
  });

  it('renders no status row and no resend control for a confirmed e-mail', () => {
    render(form(), { wrapper });

    expect(screen.queryByText('E-mail не підтверджено')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Надіслати повторно' })).not.toBeInTheDocument();
    expect(field(EMAIL)).toHaveAttribute('aria-describedby', 'email-save-hint');
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

  it('hands the save ref to the Save of the section that started saving', async () => {
    const saveRef = createRef<HTMLElement>();
    mockUpdate.mockReturnValue(new Promise(() => undefined));
    render(form({ saveRef }), { wrapper });
    expect(saveRef.current).toBeNull();
    await userEvent.type(field(CURRENT), ENTERED_PASSWORD);
    await userEvent.type(field(NEW), NEW_PASSWORD);

    await userEvent.click(save());

    expect(saveRef.current).toBe(save());
  });

  it('sends an e-mail-only change for a legacy name that fails the client rule', async () => {
    const legacy = buildUserEntity({ fullName: 'admin', email: 'a@example.com' });
    render(form({ user: legacy }), { wrapper });
    await userEvent.clear(field(EMAIL));
    await userEvent.type(field(EMAIL), 'b@example.com');
    await userEvent.type(field(EMAIL_PASSWORD), ENTERED_PASSWORD);

    await userEvent.click(save(SAVE_EMAIL));

    await waitFor(() => expect(mockUpdate).toHaveBeenCalledTimes(1));
    expect(mockUpdate.mock.calls[0]?.[0]).toEqual({
      id: legacy.id,
      currentPassword: ENTERED_PASSWORD,
      email: 'b@example.com',
    });
    expect(screen.queryByText(/правильному форматі/)).not.toBeInTheDocument();
  });

  it('rejects an edited single-word name, focuses it and sends nothing', async () => {
    render(form(), { wrapper });
    await userEvent.clear(field(NAME));
    await editName('Олена');

    await userEvent.click(save(SAVE_NAME));

    expect(await screen.findByText(BAD_NAME)).toBeInTheDocument();
    expect(field(NAME)).toHaveFocus();
    expect(field(NAME)).toHaveAttribute('aria-invalid', 'true');
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('requires the section password for a change, focuses it and sends nothing', async () => {
    render(form(), { wrapper });
    await userEvent.type(field(EMAIL), '.ua');

    await userEvent.click(save(SAVE_EMAIL));

    expect(await screen.findByText(REQUIRED)).toBeInTheDocument();
    expect(field(EMAIL_PASSWORD)).toHaveFocus();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('shows the no-change status for a lone current password and no field error', async () => {
    render(form(), { wrapper });
    await userEvent.type(field(CURRENT), ENTERED_PASSWORD);

    await userEvent.click(save());

    expect(await screen.findByText(NO_CHANGES)).toBeInTheDocument();
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(screen.queryByText(REQUIRED)).not.toBeInTheDocument();
    expect(
      screen.getAllByRole('status').some((node) => node.textContent?.includes('Немає змін'))
    ).toBe(true);
  });

  it('keeps a whitespace-only new password draft out of a name save', async () => {
    render(form(), { wrapper });
    await userEvent.type(field(NEW), '  ');
    await editName();

    await userEvent.click(save(SAVE_NAME));

    await waitFor(() => expect(mockUpdate).toHaveBeenCalledTimes(1));
    expect(Object.keys(mockUpdate.mock.calls[0]?.[0] as object)).not.toContain('newPassword');
    expect(screen.queryByText(REQUIRED)).not.toBeInTheDocument();
  });

  it('sends a name save alone and keeps the e-mail and password drafts', async () => {
    mockUpdate.mockResolvedValue({ kind: 'ok', user: { ...user, fullName: NEW_NAME } });
    render(<AdoptingForm initial={user} />, { wrapper });
    await userEvent.clear(field(EMAIL));
    await userEvent.type(field(EMAIL), NEW_EMAIL);
    await userEvent.type(field(EMAIL_PASSWORD), KEPT_PASSWORD);
    await userEvent.type(field(NEW), NEW_PASSWORD);
    await userEvent.clear(field(NAME));
    await editName(NEW_NAME, SECTION_PASSWORD);

    await userEvent.click(save(SAVE_NAME));

    await waitFor(() => expect(field(NAME)).toHaveFocus());
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdate.mock.calls[0]?.[0]).toEqual({
      id: user.id,
      currentPassword: SECTION_PASSWORD,
      fullName: NEW_NAME,
    });
    expect(field(NAME)).toHaveValue(NEW_NAME);
    expect(screen.queryByLabelText(NAME_PASSWORD)).not.toBeInTheDocument();
    expect(field(EMAIL)).toHaveValue(NEW_EMAIL);
    expect(field(EMAIL_PASSWORD)).toHaveValue(KEPT_PASSWORD);
    expect(field(NEW)).toHaveValue(NEW_PASSWORD);
  });

  it('sends the e-mail and the password in separate saves with their own passwords', async () => {
    const saved = { ...user, email: NEW_EMAIL };
    mockUpdate.mockResolvedValue({ kind: 'ok', user: saved });
    render(<AdoptingForm initial={user} />, { wrapper });
    await userEvent.clear(field(EMAIL));
    await editEmail(NEW_EMAIL, EMAIL_FORM_PASSWORD);
    await userEvent.type(field(CURRENT), PASSWORD_FORM_PASSWORD);
    await userEvent.type(field(NEW), NEW_PASSWORD);

    await userEvent.click(save(SAVE_EMAIL));
    await waitFor(() => expect(field(EMAIL)).toHaveFocus());
    await userEvent.click(save());
    await waitFor(() => expect(mockUpdate).toHaveBeenCalledTimes(2));

    expect(mockUpdate.mock.calls[0]?.[0]).toEqual({
      id: user.id,
      currentPassword: EMAIL_FORM_PASSWORD,
      email: NEW_EMAIL,
    });
    expect(mockUpdate.mock.calls[1]?.[0]).toEqual({
      id: user.id,
      currentPassword: PASSWORD_FORM_PASSWORD,
      newPassword: NEW_PASSWORD,
    });
  });

  it('shows the no-change status for a whitespace-only new password alone', async () => {
    render(form(), { wrapper });
    await userEvent.type(field(CURRENT), ENTERED_PASSWORD);
    await userEvent.type(field(NEW), ' ');

    await userEvent.click(save());

    expect(await screen.findByText(NO_CHANGES)).toBeInTheDocument();
    expect(field(NEW)).not.toHaveAttribute('aria-invalid', 'true');
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('marks only the length rule unmet for Pa1 and rejects it on Save', async () => {
    render(form(), { wrapper });
    await userEvent.type(field(CURRENT), ENTERED_PASSWORD);
    await userEvent.type(field(NEW), 'Pa1');

    expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      expect.stringContaining('не виконано'),
      expect.stringContaining('виконано'),
      expect.stringContaining('виконано'),
      expect.stringContaining('виконано'),
    ]);
    await userEvent.click(save());

    expect(await screen.findByText(BAD_LENGTH)).toBeInTheDocument();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('shows the uppercase message for a Cyrillic-only password and focuses it', async () => {
    render(form(), { wrapper });
    await userEvent.type(field(CURRENT), ENTERED_PASSWORD);
    await userEvent.type(field(NEW), 'Пароль123');

    await userEvent.click(save());

    expect(
      await screen.findByText('Будь ласка, додайте принаймні одну велику латинську літеру (A–Z)')
    ).toBeInTheDocument();
    expect(field(NEW)).toHaveFocus();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('disables only the running Save, flags its form busy and announces saving', async () => {
    let settle: (value: unknown) => void = () => undefined;
    mockUpdate.mockReturnValue(new Promise((resolve) => (settle = resolve)));
    render(form(), { wrapper });
    await editName();

    await userEvent.click(save(SAVE_NAME));

    expect(save(SAVE_NAME)).toBeDisabled();
    expect(save()).toBeEnabled();
    expect(document.forms[0]).toHaveAttribute('aria-busy', 'true');
    expect(document.forms[1]).toHaveAttribute('aria-busy', 'false');
    expect(document.forms[2]).toHaveAttribute('aria-busy', 'false');
    expect(screen.getAllByRole('status').some((node) => node.textContent === 'Збереження…')).toBe(
      true
    );
    await act(async () => settle(okOutcome));
  });

  it('leaves Save and the form enabled while a resend is in flight', async () => {
    let settle: (value: unknown) => void = () => undefined;
    mockProvider.resend.mockReturnValue(new Promise((resolve) => (settle = resolve)));
    render(form({ user: buildUserEntity({ confirmed: false }) }), { wrapper });

    await userEvent.click(screen.getByRole('button', { name: 'Надіслати повторно' }));

    expect(save()).toBeEnabled();
    expect(document.forms[1]).toHaveAttribute('aria-busy', 'false');
    expect(clearIn(CURRENT)).not.toHaveAttribute('aria-disabled');
    expect(field(NAME)).not.toHaveAttribute('readonly');

    await act(async () => settle({ kind: 'sent', confirmed: false }));

    expect(save()).toBeEnabled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('keeps the fields of the saving form read-only, so no input is lost', async () => {
    let settle: (value: unknown) => void = () => undefined;
    mockUpdate.mockReturnValue(new Promise((resolve) => (settle = resolve)));
    const adopt = jest.fn();
    render(
      form({
        adoption: {
          adopt,
          confirm: jest.fn(),
          isCurrent: (): boolean => true,
          revision: (): number => 0,
        },
      }),
      {
        wrapper,
      }
    );
    await userEvent.type(field(NAME), ' Іванівна');
    await userEvent.type(field(NAME_PASSWORD), `${ENTERED_PASSWORD}{Enter}`);
    await waitFor(() => expect(mockUpdate).toHaveBeenCalledTimes(1));

    expect(field(NAME_PASSWORD)).toHaveFocus();
    await userEvent.type(field(NAME_PASSWORD), 'def{Enter}');
    await userEvent.type(field(NAME), 'x');

    [NAME, NAME_PASSWORD].forEach((label) => {
      expect(field(label)).toHaveAttribute('readonly');
    });
    [EMAIL, CURRENT, NEW].forEach((label) => {
      expect(field(label)).not.toHaveAttribute('readonly');
    });
    expect(field(NAME_PASSWORD)).toHaveValue(ENTERED_PASSWORD);
    expect(field(NAME)).toHaveValue('Олена Петренко Іванівна');
    expect(mockUpdate).toHaveBeenCalledTimes(1);

    await act(async () => settle({ kind: 'failed', reason: 'transient' }));

    [NAME, NAME_PASSWORD].forEach((label) => {
      expect(field(label)).not.toHaveAttribute('readonly');
    });
    await userEvent.type(field(NAME_PASSWORD), 'def');
    expect(field(NAME_PASSWORD)).toHaveValue(`${ENTERED_PASSWORD}def`);
    expect(adopt).not.toHaveBeenCalled();
  });

  it('submits with Enter in the section password field', async () => {
    render(form(), { wrapper });
    await userEvent.type(field(NAME), ' Іванівна');
    await userEvent.type(field(NAME_PASSWORD), `${ENTERED_PASSWORD}{Enter}`);

    await waitFor(() => expect(mockUpdate).toHaveBeenCalledTimes(1));
  });

  it('adopts the saved entity and focuses the text input once a name save settled', async () => {
    const adopt = jest.fn();
    render(
      form({
        adoption: {
          adopt,
          confirm: jest.fn(),
          isCurrent: (): boolean => true,
          revision: (): number => 0,
        },
      }),
      {
        wrapper,
      }
    );
    await editName();

    await userEvent.click(save(SAVE_NAME));

    await waitFor(() => expect(adopt).toHaveBeenCalledWith(okOutcome.user));
    await waitFor(() => expect(field(NAME)).toHaveFocus());
  });

  it('focuses the password Save once a password save settled', async () => {
    render(form(), { wrapper });
    await userEvent.type(field(CURRENT), ENTERED_PASSWORD);
    await userEvent.type(field(NEW), NEW_PASSWORD);

    await userEvent.click(save());

    await waitFor(() => expect(mockUpdate).toHaveBeenCalledTimes(1));
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
    await editEmail();

    await userEvent.click(save(SAVE_EMAIL));

    expect(await screen.findByText('Неправильний поточний пароль')).toBeInTheDocument();
    expect(field(EMAIL)).toHaveAttribute('aria-invalid', 'true');
    expect(field(EMAIL_PASSWORD)).toHaveAttribute('aria-invalid', 'true');
    await waitFor(() => expect(field(EMAIL)).toHaveFocus());
  });

  it('shows the e-mail taken message for an email_taken violation', async () => {
    mockUpdate.mockResolvedValue({
      kind: 'invalid',
      errors: { items: [{ field: 'email', reason: 'email_taken' }] },
    });
    render(form(), { wrapper });
    await editEmail();

    await userEvent.click(save(SAVE_EMAIL));

    expect(
      await screen.findByText(/вже використовується|вже зареєстрован|зайнят/i)
    ).toBeInTheDocument();
  });

  it.each([
    ['email_taken', 'email', 'email', EMAIL, 'Електронна адреса вже використовується'],
    [
      'password_wrong',
      'currentPassword',
      'emailPassword',
      EMAIL_PASSWORD,
      'Неправильний поточний пароль',
    ],
  ] as const)(
    'shows, describes and focuses a repeated %s error again on the second Save',
    async (reason, name, fieldName, label, message) => {
      mockUpdate.mockResolvedValue({
        kind: 'invalid',
        errors: { items: [{ field: name, reason }] },
      });
      render(form(), { wrapper });
      await editEmail();
      await userEvent.click(save(SAVE_EMAIL));
      await waitFor(() => expect(field(label)).toHaveFocus());

      await userEvent.click(save(SAVE_EMAIL));

      await waitFor(() => expect(mockUpdate).toHaveBeenCalledTimes(2));
      await waitFor(() => expect(field(label)).toHaveFocus());
      expect(field(label)).toHaveAttribute('aria-invalid', 'true');
      const helperId = `${fieldName}-helper-text`;
      expect(field(label).getAttribute('aria-describedby') ?? '').toContain(helperId);
      expect(screen.getByText(message)).toHaveAttribute('id', helperId);
      expect(field(label)).toHaveAccessibleDescription(expect.stringContaining(message));
    }
  );

  it('clears the no-change status when a later Save is blocked by a short password', async () => {
    render(form(), { wrapper });
    await userEvent.type(field(CURRENT), ENTERED_PASSWORD);
    await userEvent.click(save());
    await screen.findByText(NO_CHANGES);
    await userEvent.type(field(NEW), 'Pa1');

    await userEvent.click(save());

    expect(await screen.findByText(BAD_LENGTH)).toBeInTheDocument();
    expect(field(NEW)).toHaveFocus();
    expect(screen.queryByText(NO_CHANGES)).not.toBeInTheDocument();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('clears the no-change status when a later name Save is blocked by a bad name', async () => {
    render(form(), { wrapper });
    await userEvent.type(field(NAME), '{Enter}');
    await screen.findByText(NO_CHANGES);
    await userEvent.clear(field(NAME));
    await editName('Олена');

    await userEvent.click(save(SAVE_NAME));

    expect(await screen.findByText(BAD_NAME)).toBeInTheDocument();
    expect(field(NAME)).toHaveFocus();
    expect(screen.queryByText(NO_CHANGES)).not.toBeInTheDocument();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('shows the no-change status again after a blocked Save is corrected back', async () => {
    render(form(), { wrapper });
    await userEvent.type(field(CURRENT), ENTERED_PASSWORD);
    await userEvent.click(save());
    await userEvent.type(field(NEW), 'Pa1');
    await userEvent.click(save());
    await screen.findByText(BAD_LENGTH);
    await userEvent.clear(field(NEW));

    await userEvent.click(save());

    expect(await screen.findByText(NO_CHANGES)).toBeInTheDocument();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('re-announces a repeated no-change Save with an alternating mark', async () => {
    render(form(), { wrapper });
    await userEvent.type(field(CURRENT), ENTERED_PASSWORD);
    const status = (): HTMLElement =>
      screen.getAllByRole('status').find((node) => node.textContent?.includes('Немає змін')) ??
      document.body;

    await userEvent.click(save());
    const first = status().textContent;
    await userEvent.click(save());
    const second = status().textContent;
    await userEvent.click(save());
    const third = status().textContent;

    expect(first).toBe(NO_CHANGES);
    expect(second).toBe(`${NO_CHANGES}\u200B`);
    expect(second?.replace('\u200B', '')).toBe(first);
    expect(third).toBe(first);
    expect(mockUpdate).not.toHaveBeenCalled();
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
    expect(screen.getByRole('heading', { level: 2, name: 'Особисті дані' })).toHaveAttribute(
      'tabindex',
      '-1'
    );
  });

  it('keeps every status region empty until something is announced', () => {
    render(form(), { wrapper });

    const regions = screen.getAllByRole('status');

    expect(regions.length).toBeGreaterThan(0);
    regions.forEach((region) => expect(region).toBeEmptyDOMElement());
  });

  it('keeps edits and typed passwords when only the entity changes', async () => {
    const view = render(form(), { wrapper });
    await userEvent.type(field(CURRENT), ENTERED_PASSWORD);
    await userEvent.type(field(NAME), ' Іванівна');

    view.rerender(form({ user: { ...user, confirmed: false } }));

    expect(field(CURRENT)).toHaveValue(ENTERED_PASSWORD);
    expect(field(NAME)).toHaveValue('Олена Петренко Іванівна');
  });

  describe('Clear', () => {
    it('restores the password form, empties both fields and removes every error', async () => {
      render(form(), { wrapper });
      await userEvent.type(field(CURRENT), ENTERED_PASSWORD);
      await userEvent.type(field(NEW), 'Pa1');
      await userEvent.click(save());
      await screen.findByText(BAD_LENGTH);
      const clear = clearIn(CURRENT);

      await userEvent.click(clear);

      expect(field(CURRENT)).toHaveValue('');
      expect(field(NEW)).toHaveValue('');
      expect(field(NEW)).not.toHaveAttribute('aria-invalid', 'true');
      expect(field(CURRENT)).toHaveAttribute('type', 'password');
      expect(mockUpdate).not.toHaveBeenCalled();
      expect(clear).toHaveFocus();
    });

    it('restores the name form, collapses it and moves focus to the text input', async () => {
      render(form(), { wrapper });
      await userEvent.clear(field(NAME));
      await editName('Олена');
      await userEvent.click(save(SAVE_NAME));
      await screen.findByText(BAD_NAME);

      await userEvent.click(clearIn(NAME));

      expect(field(NAME)).toHaveValue('Олена Петренко');
      expect(field(NAME)).not.toHaveAttribute('aria-invalid', 'true');
      expect(screen.queryByLabelText(NAME_PASSWORD)).not.toBeInTheDocument();
      expect(within(formOf(NAME)).queryByRole('button', { name: CLEAR })).not.toBeInTheDocument();
      expect(mockUpdate).not.toHaveBeenCalled();
      expect(field(NAME)).toHaveFocus();
    });

    it('clears the no-change status', async () => {
      render(form(), { wrapper });
      await userEvent.type(field(CURRENT), ENTERED_PASSWORD);
      await userEvent.click(save());
      await screen.findByText(NO_CHANGES);

      await userEvent.click(clearIn(CURRENT));

      expect(screen.queryByText(NO_CHANGES)).not.toBeInTheDocument();
      screen.getAllByRole('status').forEach((region) => expect(region).toBeEmptyDOMElement());
    });

    it('masks both passwords again and resets their toggles', async () => {
      render(form(), { wrapper });
      await userEvent.type(field(CURRENT), ENTERED_PASSWORD);
      await userEvent.type(field(NEW), NEW_PASSWORD);
      const [currentToggle, newToggle] = screen.getAllByRole('button', { name: 'Показати пароль' });
      await userEvent.click(currentToggle as HTMLElement);
      await userEvent.click(newToggle as HTMLElement);
      expect(field(CURRENT)).toHaveAttribute('type', 'text');
      expect(field(NEW)).toHaveAttribute('type', 'text');

      await userEvent.click(clearIn(CURRENT));

      expect(field(CURRENT)).toHaveAttribute('type', 'password');
      expect(field(NEW)).toHaveAttribute('type', 'password');
      const toggles = screen.getAllByRole('button', { name: 'Показати пароль' });
      expect(toggles).toHaveLength(2);
      toggles.forEach((toggle) => expect(toggle).toHaveAttribute('aria-pressed', 'false'));
      expect(screen.queryByRole('button', { name: 'Приховати пароль' })).not.toBeInTheDocument();
    });

    it('draws the repository focus ring and a muted look while busy', () => {
      render(form(), { wrapper });
      const clear = clearIn(CURRENT);

      const ring = styleRuleFor(clear, doubledClass(clear, ':focus-visible'));
      const busy = styleRuleFor(clear, doubledClass(clear, '[aria-disabled="true"]'));
      const busyHover = styleRuleFor(clear, doubledClass(clear, '[aria-disabled="true"]:hover'));

      expect(ring?.getPropertyValue('outline')).toBe('2px solid #1A1C1E');
      expect(ring?.getPropertyValue('outline-offset')).toBe('2px');
      expect(busy?.getPropertyValue('opacity')).toBe('0.6');
      expect(busy?.getPropertyValue('cursor')).toBe('default');
      expect(busyHover?.getPropertyValue('background-color')).toBe('#FFFFFF');
    });

    it('is a type=button that never submits', () => {
      render(form(), { wrapper });

      expect(clearIn(CURRENT)).toHaveAttribute('type', 'button');
    });

    it('is aria-disabled and does nothing while a save is running', async () => {
      let settle: (value: unknown) => void = () => undefined;
      mockUpdate.mockReturnValue(new Promise((resolve) => (settle = resolve)));
      render(form(), { wrapper });
      await editName();
      await userEvent.click(save(SAVE_NAME));
      const clear = clearIn(NAME);

      await userEvent.click(clear);

      expect(clear).toHaveAttribute('aria-disabled', 'true');
      expect(clear).toBeEnabled();
      expect(clear).toHaveFocus();
      expect(field(NAME_PASSWORD)).toHaveValue(ENTERED_PASSWORD);
      expect(field(NAME)).toHaveValue('Олена Петренко Іванівна');
      await act(async () => settle(okOutcome));
    });
  });
});
