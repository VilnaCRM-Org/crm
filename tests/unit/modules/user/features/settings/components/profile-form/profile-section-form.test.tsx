import '@testing-library/jest-dom';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { type ComponentProps, createRef, type JSX, type ReactNode, useState } from 'react';
import * as ReactHookForm from 'react-hook-form';
import * as ReactI18next from 'react-i18next';
import { I18nextProvider } from 'react-i18next';

import useConnectivityStore from '@/lib/connectivity/use-connectivity-store';
import Form from '@/modules/user/features/settings/components/profile-form/profile-section-form';
import type { ProfileFieldError } from '@/modules/user/features/settings/types/user-profile';
import { buildFullName, buildPassword, buildUserEntity } from '@tests/builders';
import createSettingsLocaleI18n from '@tests/unit/utils/create-settings-locale-i18n';
import { styleRuleFor } from '@tests/unit/utils/emotion-style-rules';
import loadIsolated from '@tests/unit/utils/isolated-module';
import { resetClientStores } from '@tests/utils/reset-client-stores';

type ProfileSectionFormProps = ComponentProps<typeof Form>;
type ProfileSection = ProfileSectionFormProps['section'];

const NEW_NAME = buildFullName();
const NEW_PASSWORD = buildPassword();

const mockUpdate = jest.fn();

jest.mock('@/providers/di', () => ({
  __esModule: true,
  useService: (): object => ({ update: mockUpdate, resend: jest.fn() }),
}));

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
const OFFLINE = "Ви офлайн. Надсилання недоступне, доки з'єднання не відновиться.";
const WRONG_PASSWORD = 'Неправильний поточний пароль';

const user = buildUserEntity({
  fullName: 'Олена Петренко',
  email: 'olena@example.com',
  confirmed: true,
});

const wrapper = ({ children }: { children: ReactNode }): JSX.Element => (
  <I18nextProvider i18n={createSettingsLocaleI18n('uk', ['en'])}>
    <main>{children}</main>
  </I18nextProvider>
);

const contextOf = (entity = user): ProfileSectionFormProps['context'] => ({
  user: entity,
  adoption: {
    adopt: jest.fn(),
    confirm: jest.fn(),
    isCurrent: (): boolean => true,
    revision: (): number => 0,
  },
  toasts: {
    toasts: { items: [] },
    announcement: '',
    alert: '',
    show: jest.fn(),
    dismiss: jest.fn(),
  },
  saveRef: createRef<HTMLElement>(),
  headingRef: createRef<HTMLElement>(),
});

const renderFresh = async (section: ProfileSection, context = contextOf()): Promise<void> => {
  const Fresh = await loadIsolated(async () => {
    jest.doMock('react', () => React);
    jest.doMock('react-hook-form', () => ReactHookForm);
    jest.doMock('react-i18next', () => ReactI18next);
    return (
      await import('@/modules/user/features/settings/components/profile-form/profile-section-form')
    ).default;
  });
  render(<Fresh context={context} section={section} />, { wrapper });
};

const sectionForm = (section: ProfileSection, context = contextOf()): JSX.Element => (
  <Form context={context} section={section} />
);

function AdoptingSection(): JSX.Element {
  const [current, setCurrent] = useState(user);
  const [context] = useState(() => contextOf());
  return (
    <Form
      section="fullName"
      context={{
        ...context,
        user: current,
        adoption: { ...context.adoption, adopt: setCurrent },
      }}
    />
  );
}

const field = (label: string): HTMLInputElement => screen.getByLabelText(label) as HTMLInputElement;

const hiddenButton = (name: string): HTMLElement => {
  const button = screen
    .getAllByRole('button', { hidden: true })
    .find((candidate) => candidate.textContent === name);
  if (button === undefined) throw new Error(`no ${name} button`);
  return button;
};

const noticeHolder = (): HTMLElement => {
  const text = screen.getByText(OFFLINE);
  const holder = [...screen.queryAllByRole('status'), ...screen.getAllByRole('generic')].find(
    (node) => node.getAttribute('tabindex') === '-1' && node.contains(text)
  );
  if (holder === undefined) throw new Error('no offline notice');
  return holder;
};

const invalidWith = (...items: ProfileFieldError[]): object => ({
  kind: 'invalid',
  errors: { items },
});

const revealName = async (): Promise<void> => {
  await userEvent.type(field(NAME), ' Іванівна');
  await userEvent.type(field(NAME_PASSWORD), 'abc');
};

const revealEmail = async (): Promise<void> => {
  await userEvent.type(field(EMAIL), '.ua');
  await userEvent.type(field(EMAIL_PASSWORD), 'abc');
};

const revealPassword = async (): Promise<void> => {
  await userEvent.type(field(CURRENT), 'abc');
  await userEvent.type(field(NEW), NEW_PASSWORD);
};

const REVEALS: Record<ProfileSection, () => Promise<void>> = {
  fullName: revealName,
  email: revealEmail,
  password: revealPassword,
};

describe('ProfileSectionForm', () => {
  beforeEach(() => {
    mockUpdate.mockReset();
    mockUpdate.mockResolvedValue({ kind: 'ok', user });
    resetClientStores();
  });

  describe('at rest', () => {
    it.each([
      ['fullName', NAME, NAME_PASSWORD, SAVE_NAME],
      ['email', EMAIL, EMAIL_PASSWORD, SAVE_EMAIL],
    ] as const)(
      'shows only the %s field and hides its Save with display none',
      (section, label, passwordLabel, saveLabel) => {
        render(sectionForm(section), { wrapper });

        expect(field(label)).toBeVisible();
        expect(screen.queryByLabelText(passwordLabel)).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: saveLabel })).not.toBeInTheDocument();
        expect(hiddenButton(saveLabel)).toHaveStyle({ display: 'none' });
        expect(screen.queryByRole('button', { name: CLEAR })).not.toBeInTheDocument();
      }
    );

    it('keeps the password form fully visible with its Save and Clear', () => {
      render(sectionForm('password'), { wrapper });

      expect(field(CURRENT)).toBeVisible();
      expect(field(NEW)).toBeVisible();
      expect(screen.getByRole('button', { name: SAVE })).toBeVisible();
      expect(screen.getByRole('button', { name: CLEAR })).toBeVisible();
    });

    it('draws the actions divider in the password form only', () => {
      const dividers = (): HTMLElement[] =>
        screen
          .getAllByRole('generic', { hidden: true })
          .filter(
            (node) =>
              node.getAttribute('aria-hidden') === 'true' &&
              styleRuleFor(node)?.getPropertyValue('border-top') === '1px solid #EAECEE'
          );
      const { unmount } = render(sectionForm('password'), { wrapper });
      expect(dividers()).toHaveLength(1);
      unmount();

      render(sectionForm('fullName'), { wrapper });

      expect(dividers()).toEqual([]);
    });

    it('keeps its status region empty', () => {
      render(sectionForm('fullName'), { wrapper });

      screen.getAllByRole('status').forEach((region) => expect(region).toBeEmptyDOMElement());
    });

    it('never moves focus', () => {
      render(sectionForm('fullName'), { wrapper });

      expect(document.body).toHaveFocus();
    });
  });

  describe('reveal and collapse', () => {
    it.each([
      ['fullName', NAME, ' Іванівна', NAME_PASSWORD, SAVE_NAME],
      ['email', EMAIL, '.ua', EMAIL_PASSWORD, SAVE_EMAIL],
    ] as const)(
      'reveals the %s password, Save and Clear once the value differs',
      async (section, label, edit, passwordLabel, saveLabel) => {
        render(sectionForm(section), { wrapper });

        await userEvent.type(field(label), edit);

        expect(field(passwordLabel)).toBeVisible();
        const save = screen.getByRole('button', { name: saveLabel });
        expect(save).toBeVisible();
        expect(save).toHaveStyle({ display: 'inline-flex' });
        expect(screen.getByRole('button', { name: CLEAR })).toBeVisible();
      }
    );

    it('collapses again when the value is typed back to the saved one', async () => {
      render(sectionForm('fullName'), { wrapper });
      await userEvent.type(field(NAME), 'x');
      expect(field(NAME_PASSWORD)).toBeVisible();

      await userEvent.type(field(NAME), '{Backspace}');

      expect(screen.queryByLabelText(NAME_PASSWORD)).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: CLEAR })).not.toBeInTheDocument();
      expect(hiddenButton(SAVE_NAME)).toHaveStyle({ display: 'none' });
      expect(field(NAME)).toHaveFocus();
    });

    it('moves focus to the input when Clear removes itself', async () => {
      render(sectionForm('email'), { wrapper });
      await revealEmail();

      await userEvent.click(screen.getByRole('button', { name: CLEAR }));

      expect(field(EMAIL)).toHaveValue(user.email);
      expect(screen.queryByLabelText(EMAIL_PASSWORD)).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: CLEAR })).not.toBeInTheDocument();
      expect(field(EMAIL)).toHaveFocus();
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('keeps focus on the password Clear, which never leaves', async () => {
      render(sectionForm('password'), { wrapper });
      await userEvent.type(field(NEW), NEW_PASSWORD);
      const clear = screen.getByRole('button', { name: CLEAR });

      await userEvent.click(clear);

      expect(field(NEW)).toHaveValue('');
      expect(clear).toHaveFocus();
    });

    it('collapses after a save and reads the new value from the saved entity', async () => {
      const saved = { ...user, fullName: NEW_NAME };
      mockUpdate.mockResolvedValue({ kind: 'ok', user: saved });
      render(<AdoptingSection />, { wrapper });
      await userEvent.clear(field(NAME));
      await userEvent.type(field(NAME), NEW_NAME);
      await userEvent.type(field(NAME_PASSWORD), 'abc');

      await userEvent.click(screen.getByRole('button', { name: SAVE_NAME }));

      await waitFor(() => expect(field(NAME)).toHaveFocus());
      expect(field(NAME)).toHaveValue(NEW_NAME);
      expect(screen.queryByLabelText(NAME_PASSWORD)).not.toBeInTheDocument();
      expect(hiddenButton(SAVE_NAME)).toHaveStyle({ display: 'none' });
    });

    it('keeps the form open and its values after a failed save', async () => {
      mockUpdate.mockResolvedValue({ kind: 'failed', reason: 'rejected' });
      render(sectionForm('fullName'), { wrapper });
      await revealName();

      await userEvent.click(screen.getByRole('button', { name: SAVE_NAME }));

      await waitFor(() => expect(screen.getByRole('button', { name: SAVE_NAME })).toHaveFocus());
      expect(field(NAME_PASSWORD)).toHaveValue('abc');
      expect(field(NAME)).toHaveValue(`${user.fullName} Іванівна`);
    });
  });

  describe('submitting', () => {
    it.each([
      ['fullName', NAME],
      ['email', EMAIL],
    ] as const)('says there is nothing to save on Enter in a clean %s form', async (section, l) => {
      render(sectionForm(section), { wrapper });

      await userEvent.type(field(l), '{Enter}');

      expect(await screen.findByText(NO_CHANGES)).toBeInTheDocument();
      expect(mockUpdate).not.toHaveBeenCalled();
      expect(screen.queryByRole('button', { name: CLEAR })).not.toBeInTheDocument();
    });

    it('sends only the name with its own password', async () => {
      render(sectionForm('fullName'), { wrapper });
      await revealName();

      await userEvent.click(screen.getByRole('button', { name: SAVE_NAME }));

      await waitFor(() => expect(mockUpdate).toHaveBeenCalledTimes(1));
      expect(mockUpdate.mock.calls[0]?.[0]).toEqual({
        id: user.id,
        currentPassword: 'abc',
        fullName: `${user.fullName} Іванівна`,
      });
    });

    it('sends only the e-mail with its own password', async () => {
      render(sectionForm('email'), { wrapper });
      await revealEmail();

      await userEvent.click(screen.getByRole('button', { name: SAVE_EMAIL }));

      await waitFor(() => expect(mockUpdate).toHaveBeenCalledTimes(1));
      expect(mockUpdate.mock.calls[0]?.[0]).toEqual({
        id: user.id,
        currentPassword: 'abc',
        email: `${user.email}.ua`,
      });
    });

    it('announces the running save with the saving label', async () => {
      mockUpdate.mockReturnValue(new Promise(() => undefined));
      render(sectionForm('fullName'), { wrapper });
      await revealName();

      await userEvent.click(screen.getByRole('button', { name: SAVE_NAME }));

      expect(screen.getAllByRole('status').map((node) => node.textContent)).toContain(
        'Збереження…'
      );
    });
  });

  describe('server errors', () => {
    it.each([
      ['fullName', revealName, NAME_PASSWORD, SAVE_NAME, 'fullNamePassword'],
      ['email', revealEmail, EMAIL_PASSWORD, SAVE_EMAIL, 'emailPassword'],
    ] as const)(
      'routes a current password error to the %s password field',
      async (section, reveal, label, saveLabel, id) => {
        mockUpdate.mockResolvedValue(
          invalidWith({ field: 'currentPassword', reason: 'password_wrong' })
        );
        render(sectionForm(section), { wrapper });
        await reveal();

        await userEvent.click(screen.getByRole('button', { name: saveLabel }));

        expect(await screen.findByText(WRONG_PASSWORD)).toHaveAttribute('id', `${id}-helper-text`);
        expect(field(label)).toHaveAttribute('aria-invalid', 'true');
        await waitFor(() => expect(field(label)).toHaveFocus());
      }
    );

    it('routes a current password error to the current field of the password form', async () => {
      mockUpdate.mockResolvedValue(
        invalidWith({ field: 'currentPassword', reason: 'password_wrong' })
      );
      render(sectionForm('password'), { wrapper });
      await userEvent.type(field(CURRENT), 'abc');
      await userEvent.type(field(NEW), NEW_PASSWORD);

      await userEvent.click(screen.getByRole('button', { name: SAVE }));

      expect(await screen.findByText(WRONG_PASSWORD)).toHaveAttribute(
        'id',
        'currentPassword-helper-text'
      );
      await waitFor(() => expect(field(CURRENT)).toHaveFocus());
    });

    it('focuses the name before its password when the server rejects both', async () => {
      mockUpdate.mockResolvedValue(
        invalidWith(
          { field: 'currentPassword', reason: 'password_not_accepted' },
          { field: 'fullName', reason: 'name_rejected' }
        )
      );
      render(sectionForm('fullName'), { wrapper });
      await revealName();

      await userEvent.click(screen.getByRole('button', { name: SAVE_NAME }));

      expect(
        await screen.findByText('Будь ласка, введіть повне ім’я у правильному форматі')
      ).toBeInTheDocument();
      expect(field(NAME_PASSWORD)).toHaveAttribute('aria-invalid', 'true');
      await waitFor(() => expect(field(NAME)).toHaveFocus());
    });

    it.each([
      ['email_taken', 'Електронна адреса вже використовується'],
      ['email_invalid', 'Будь ласка, введіть коректну електронну адресу'],
    ] as const)('shows the %s message on the e-mail field', async (reason, message) => {
      mockUpdate.mockResolvedValue(invalidWith({ field: 'email', reason }));
      render(sectionForm('email'), { wrapper });
      await revealEmail();

      await userEvent.click(screen.getByRole('button', { name: SAVE_EMAIL }));

      await waitFor(() => expect(field(EMAIL)).toHaveAttribute('aria-invalid', 'true'));
      expect(field(EMAIL)).toHaveAccessibleDescription(expect.stringContaining(message));
    });

    it('shows the new password error on the new password field', async () => {
      mockUpdate.mockResolvedValue(
        invalidWith({ field: 'newPassword', reason: 'new_password_rejected' })
      );
      render(sectionForm('password'), { wrapper });
      await userEvent.type(field(CURRENT), 'abc');
      await userEvent.type(field(NEW), NEW_PASSWORD);

      await userEvent.click(screen.getByRole('button', { name: SAVE }));

      expect(
        await screen.findByText('Пароль не відповідає вимогам. Перевірте правила нижче')
      ).toHaveAttribute('id', 'newPassword-helper-text');
      await waitFor(() => expect(field(NEW)).toHaveFocus());
    });

    it('ignores an error on a field its section does not own', async () => {
      mockUpdate.mockResolvedValue(invalidWith({ field: 'email', reason: 'email_taken' }));
      render(sectionForm('fullName'), { wrapper });
      await revealName();

      await userEvent.click(screen.getByRole('button', { name: SAVE_NAME }));
      await waitFor(() => expect(mockUpdate).toHaveBeenCalledTimes(1));
      await act(async () => undefined);

      expect(screen.queryByText('Електронна адреса вже використовується')).not.toBeInTheDocument();
      expect(field(NAME)).not.toHaveAttribute('aria-invalid', 'true');
    });

    it('ignores an unknown reason on a field it owns', async () => {
      mockUpdate.mockResolvedValue(
        invalidWith({ field: 'fullName', reason: 'unknown' } as unknown as ProfileFieldError)
      );
      render(sectionForm('fullName'), { wrapper });
      await revealName();

      await userEvent.click(screen.getByRole('button', { name: SAVE_NAME }));
      await waitFor(() => expect(mockUpdate).toHaveBeenCalledTimes(1));
      await act(async () => undefined);

      expect(field(NAME)).not.toHaveAttribute('aria-invalid', 'true');
    });
  });

  describe('on a module loaded in the test', () => {
    it.each([
      ['fullName', SAVE_NAME],
      ['email', SAVE_EMAIL],
      ['password', SAVE],
    ] as const)('labels the %s Save', async (section, label) => {
      await renderFresh(section);

      expect(hiddenButton(label)).toBeInTheDocument();
    });

    it.each([
      [
        'name_rejected',
        'fullName',
        'fullName',
        NAME,
        'Будь ласка, введіть повне ім’я у правильному форматі',
      ],
      [
        'password_wrong',
        'currentPassword',
        'fullName',
        NAME_PASSWORD,
        'Неправильний поточний пароль',
      ],
      ['email_taken', 'email', 'email', EMAIL, 'Електронна адреса вже використовується'],
      ['email_invalid', 'email', 'email', EMAIL, 'Будь ласка, введіть коректну електронну адресу'],
      [
        'password_not_accepted',
        'currentPassword',
        'email',
        EMAIL_PASSWORD,
        'Поточний пароль не прийнято. Перевірте його та спробуйте ще раз',
      ],
      ['password_wrong', 'currentPassword', 'password', CURRENT, 'Неправильний поточний пароль'],
      [
        'new_password_rejected',
        'newPassword',
        'password',
        NEW,
        'Пароль не відповідає вимогам. Перевірте правила нижче',
      ],
    ] as const)(
      'maps %s on %s to its message, under its field, focused, in the %s section',
      async (reason, name, section, label, message) => {
        mockUpdate.mockResolvedValue(invalidWith({ field: name, reason }));
        await renderFresh(section);
        await REVEALS[section]();

        await userEvent.keyboard('{Enter}');

        await waitFor(() => expect(field(label)).toHaveFocus());
        expect(field(label)).toHaveAttribute('aria-invalid', 'true');
        expect(field(label)).toHaveAccessibleDescription(expect.stringContaining(message));
      }
    );

    it('links the e-mail to its status row', async () => {
      await renderFresh('email', contextOf(buildUserEntity({ confirmed: false })));

      expect(screen.getByText('E-mail не підтверджено')).toHaveAttribute('id', 'email-status');
      expect(field(EMAIL).getAttribute('aria-describedby')?.split(' ')).toContain('email-status');
    });
  });

  describe('offline notice', () => {
    const goOffline = (): void => {
      act(() => useConnectivityStore.setState({ online: false }));
    };

    it('renders no notice in a clean name form, even offline, and holds its Save', () => {
      render(sectionForm('fullName'), { wrapper });

      goOffline();

      expect(screen.queryByText(OFFLINE)).not.toBeInTheDocument();
      expect(hiddenButton(SAVE_NAME)).toHaveAttribute('aria-disabled', 'true');
      expect(hiddenButton(SAVE_NAME)).not.toHaveAttribute('aria-describedby');
    });

    it('renders the notice before the Save of a revealed form, in no live region', async () => {
      render(sectionForm('email'), { wrapper });
      await userEvent.type(field(EMAIL), '.ua');

      goOffline();

      const save = screen.getByRole('button', { name: SAVE_EMAIL });
      const holder = noticeHolder();
      expect(holder).not.toHaveAttribute('role');
      expect(holder).not.toHaveAttribute('aria-atomic');
      expect(field(EMAIL).compareDocumentPosition(holder)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
      expect(holder.compareDocumentPosition(save)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
      expect(save).toBeDisabled();
      expect(save).toHaveAccessibleDescription(OFFLINE);
    });

    it('announces through the live notice in the password form', () => {
      render(sectionForm('password'), { wrapper });

      goOffline();

      expect(noticeHolder()).toHaveAttribute('role', 'status');
      expect(screen.getByRole('button', { name: SAVE })).toBeDisabled();
    });
  });

  describe('three forms side by side', () => {
    it('never duplicates an input id, with both passwords revealed', async () => {
      render(
        <>
          {sectionForm('fullName')}
          {sectionForm('email')}
          {sectionForm('password')}
        </>,
        { wrapper }
      );

      await userEvent.type(field(NAME), 'x');
      await userEvent.type(field(EMAIL), 'x');

      expect(
        [NAME, NAME_PASSWORD, EMAIL, EMAIL_PASSWORD, CURRENT, NEW].map((l) => field(l).id)
      ).toEqual([
        'fullName',
        'fullNamePassword',
        'email',
        'emailPassword',
        'currentPassword',
        'newPassword',
      ]);
      const allIds = [...document.body.innerHTML.matchAll(/ id="([^"]+)"/g)].map((id) => id[1]);
      expect(allIds.length).toBeGreaterThan(6);
      expect(new Set(allIds).size).toBe(allIds.length);
    });
  });
});
