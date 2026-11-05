import '@testing-library/jest-dom';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps, JSX, ReactNode } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { I18nextProvider } from 'react-i18next';

import SectionFields from '@/modules/user/features/settings/components/profile-form/section-fields';
import type { ProfileSave } from '@/modules/user/features/settings/types/hooks/use-profile-save';
import type { ProfileFormValues } from '@/modules/user/features/settings/types/user-profile';
import ProfileChangeDetector from '@/modules/user/features/settings/utils/profile-change-detector';
import passwordValidator from '@/modules/user/lib/validations/password';
import { buildPassword, buildUserEntity } from '@tests/builders';
import createSettingsLocaleI18n from '@tests/unit/utils/create-settings-locale-i18n';

type ProfileSectionFieldsProps = ComponentProps<typeof SectionFields>;

const mockResend = jest.fn();

jest.mock('@/providers/di', () => ({
  __esModule: true,
  useService: (): object => ({ update: jest.fn(), resend: mockResend }),
}));

const NAME = 'Ваше ПІБ';
const EMAIL = 'E-mail';
const NAME_PASSWORD = 'Пароль для зміни імені';
const EMAIL_PASSWORD = 'Пароль для зміни пошти';
const CURRENT = 'Поточний пароль';
const NEW = 'Новий пароль';
const HINT = 'Щоб зберегти зміну, введіть поточний пароль.';

const user = buildUserEntity({
  fullName: 'Олена Петренко',
  email: 'olena@example.com',
  confirmed: true,
});

const values: ProfileFormValues = {
  fullName: user.fullName,
  email: user.email,
  fullNamePassword: '',
  emailPassword: '',
  currentPassword: '',
  newPassword: '',
};

const rules = {
  fullName: {},
  email: {},
  fullNamePassword: {},
  emailPassword: {},
  currentPassword: {},
  newPassword: {},
  evaluate: (value: string): ReturnType<typeof passwordValidator.evaluate> =>
    passwordValidator.evaluate(value),
};

const saveOf = (overrides: Partial<ProfileSave> = {}): ProfileSave => ({
  state: {
    fieldErrors: { items: [] },
    noChanges: false,
    noChangesMarked: false,
    settled: 0,
    saved: 0,
    lastSettleSaved: false,
    cleared: 0,
    attempts: 0,
  },
  isSubmitting: false,
  changes: new ProfileChangeDetector(),
  buttonRef: { current: null },
  save: jest.fn(),
  clear: jest.fn(),
  block: jest.fn(),
  ...overrides,
});

const contextOf = (entity = user): ProfileSectionFieldsProps['context'] => ({
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
  saveRef: { current: null },
});

function Frame({ children }: { children: ReactNode }): JSX.Element {
  const methods = useForm<ProfileFormValues>({ defaultValues: values });
  return (
    <I18nextProvider i18n={createSettingsLocaleI18n('uk', ['en'])}>
      <FormProvider {...methods}>{children}</FormProvider>
    </I18nextProvider>
  );
}

interface Options {
  readonly save?: ProfileSave;
  readonly entity?: typeof user;
  readonly onChange?: jest.Mock;
}

const fieldsOf = (
  section: ProfileSectionFieldsProps['section'],
  { save = saveOf(), entity = user, onChange = jest.fn() }: Options = {}
): JSX.Element => (
  <SectionFields
    context={contextOf(entity)}
    section={section}
    rules={rules}
    save={save}
    onChange={onChange}
  />
);

const field = (label: string): HTMLInputElement => screen.getByLabelText(label) as HTMLInputElement;

describe('SectionFields', () => {
  describe('the name section', () => {
    it('shows only the name at rest, described by the hidden password hint', () => {
      const onChange = jest.fn();
      render(fieldsOf('fullName', { onChange }), { wrapper: Frame });

      expect(field(NAME)).toHaveValue(user.fullName);
      expect(field(NAME)).toHaveAttribute('type', 'text');
      expect(field(NAME)).toHaveAttribute('autocomplete', 'name');
      expect(field(NAME)).toHaveAttribute('placeholder', 'Михайло Светський');
      expect(field(NAME)).toHaveAccessibleDescription(HINT);
      expect(field(NAME)).toHaveAttribute('aria-describedby', 'full-name-save-hint');
      expect(screen.queryByLabelText(NAME_PASSWORD)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(EMAIL)).not.toBeInTheDocument();
      expect(onChange).toHaveBeenLastCalledWith(false);
    });

    it('reveals its own password once the name differs and hides it when restored', async () => {
      const onChange = jest.fn();
      render(fieldsOf('fullName', { onChange }), { wrapper: Frame });

      await userEvent.type(field(NAME), 'x');

      expect(onChange).toHaveBeenLastCalledWith(true);
      expect(field(NAME_PASSWORD)).toHaveAttribute('type', 'password');
      expect(field(NAME_PASSWORD)).toHaveAttribute('autocomplete', 'current-password');
      expect(field(NAME_PASSWORD)).toHaveAttribute('placeholder', 'Введіть пароль');
      expect(field(NAME_PASSWORD)).toHaveAttribute('id', 'fullNamePassword');

      await userEvent.type(field(NAME), '{Backspace}');

      expect(screen.queryByLabelText(NAME_PASSWORD)).not.toBeInTheDocument();
      expect(onChange).toHaveBeenLastCalledWith(false);
    });

    it('makes its fields read-only while busy', async () => {
      const view = render(fieldsOf('fullName'), { wrapper: Frame });
      await userEvent.type(field(NAME), 'x');
      expect(field(NAME)).not.toHaveAttribute('readonly');
      expect(field(NAME_PASSWORD)).not.toHaveAttribute('readonly');

      view.rerender(fieldsOf('fullName', { save: saveOf({ isSubmitting: true }) }));

      expect(field(NAME)).toHaveAttribute('readonly');
      expect(field(NAME_PASSWORD)).toHaveAttribute('readonly');
    });
  });

  describe('the e-mail section', () => {
    it('shows only the e-mail at rest, described by the hidden password hint', () => {
      render(fieldsOf('email'), { wrapper: Frame });

      expect(field(EMAIL)).toHaveValue(user.email);
      expect(field(EMAIL)).toHaveAttribute('type', 'email');
      expect(field(EMAIL)).toHaveAttribute('autocomplete', 'email');
      expect(field(EMAIL)).toHaveAttribute('placeholder', 'vilnaCRM@gmail.com');
      expect(field(EMAIL)).toHaveAttribute('aria-describedby', 'email-save-hint');
      expect(field(EMAIL)).toHaveAccessibleDescription(HINT);
      expect(screen.queryByLabelText(EMAIL_PASSWORD)).not.toBeInTheDocument();
      expect(screen.queryByText('E-mail не підтверджено')).not.toBeInTheDocument();
    });

    it('adds the status row to the description of an unconfirmed address', () => {
      render(fieldsOf('email', { entity: { ...user, confirmed: false } }), { wrapper: Frame });

      expect(field(EMAIL)).toHaveAttribute('aria-describedby', 'email-save-hint email-status');
      expect(screen.getByText('E-mail не підтверджено')).toHaveAttribute('id', 'email-status');
    });

    it('resends through the status row', async () => {
      mockResend.mockResolvedValue({ kind: 'sent', confirmed: false });
      render(fieldsOf('email', { entity: { ...user, confirmed: false } }), { wrapper: Frame });

      await userEvent.click(screen.getByRole('button', { name: 'Надіслати повторно' }));

      expect(mockResend).toHaveBeenCalledTimes(1);
      await act(async () => undefined);
    });

    it('marks the resend busy while this section saves', () => {
      render(
        fieldsOf('email', {
          entity: { ...user, confirmed: false },
          save: saveOf({ isSubmitting: true }),
        }),
        { wrapper: Frame }
      );

      expect(screen.getByRole('button', { name: 'Надіслати повторно' })).toHaveAttribute(
        'aria-disabled',
        'true'
      );
    });

    it('reveals its own password once the e-mail differs', async () => {
      const onChange = jest.fn();
      render(fieldsOf('email', { onChange }), { wrapper: Frame });

      await userEvent.type(field(EMAIL), '.ua');

      expect(onChange).toHaveBeenLastCalledWith(true);
      expect(field(EMAIL_PASSWORD)).toHaveAttribute('type', 'password');
      expect(field(EMAIL_PASSWORD)).toHaveAttribute('autocomplete', 'current-password');
      expect(field(EMAIL_PASSWORD)).toHaveAttribute('placeholder', 'Введіть пароль');
      expect(field(EMAIL_PASSWORD)).toHaveAttribute('id', 'emailPassword');
    });

    it('makes its fields read-only while busy', async () => {
      const view = render(fieldsOf('email'), { wrapper: Frame });
      await userEvent.type(field(EMAIL), '.ua');
      expect(field(EMAIL)).not.toHaveAttribute('readonly');
      expect(field(EMAIL_PASSWORD)).not.toHaveAttribute('readonly');

      view.rerender(fieldsOf('email', { save: saveOf({ isSubmitting: true }) }));

      expect(field(EMAIL)).toHaveAttribute('readonly');
      expect(field(EMAIL_PASSWORD)).toHaveAttribute('readonly');
    });
  });

  describe('the password section', () => {
    it('renders the current and new password pair and never reports a change', async () => {
      const onChange = jest.fn();
      render(fieldsOf('password', { onChange }), { wrapper: Frame });

      expect(screen.getByRole('heading', { level: 2, name: 'Пароль' })).toBeInTheDocument();
      expect(field(CURRENT)).toHaveValue('');
      expect(field(NEW)).toHaveValue('');
      await userEvent.type(field(NEW), buildPassword());

      expect(onChange).not.toHaveBeenCalled();
    });

    it('passes the busy flag down to both fields', () => {
      render(fieldsOf('password', { save: saveOf({ isSubmitting: true }) }), { wrapper: Frame });

      expect(field(CURRENT)).toHaveAttribute('readonly');
      expect(field(NEW)).toHaveAttribute('readonly');
    });

    it('resets the password toggles when the section is cleared', async () => {
      const base = saveOf();
      const view = render(fieldsOf('password', { save: base }), { wrapper: Frame });
      const [toggle] = screen.getAllByRole('button', { name: 'Показати пароль' });
      await userEvent.click(toggle as HTMLElement);
      expect(field(CURRENT)).toHaveAttribute('type', 'text');

      view.rerender(
        fieldsOf('password', { save: { ...base, state: { ...base.state, cleared: 1 } } })
      );

      expect(field(CURRENT)).toHaveAttribute('type', 'password');
    });

    it('keeps the toggles when the section was not cleared', async () => {
      const base = saveOf();
      const view = render(fieldsOf('password', { save: base }), { wrapper: Frame });
      const [toggle] = screen.getAllByRole('button', { name: 'Показати пароль' });
      await userEvent.click(toggle as HTMLElement);

      view.rerender(
        fieldsOf('password', { save: { ...base, state: { ...base.state, attempts: 1 } } })
      );

      expect(field(CURRENT)).toHaveAttribute('type', 'text');
    });
  });
});
