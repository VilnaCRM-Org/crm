import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, type JSX, type ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

import ProfileForm from '@/modules/user/features/settings/components/profile-form';
import { buildUserEntity } from '@tests/builders';
import createSettingsLocaleI18n from '@tests/unit/utils/create-settings-locale-i18n';
import expectNoA11yViolations from '@tests/utils/a11y/expect-no-a11y-violations';

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
    adoption={{ adopt: jest.fn(), confirm: jest.fn() }}
    version={0}
    refocus={false}
    toasts={{
      toasts: { items: [] },
      announcement: '',
      alert: '',
      show: jest.fn(),
      dismiss: jest.fn(),
    }}
    saveRef={createRef<HTMLButtonElement>()}
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
    await userEvent.type(screen.getByLabelText('Новий пароль'), 'Next12345');
    await userEvent.type(screen.getByLabelText('Поточний пароль'), 'abc');
    await userEvent.click(screen.getByRole('button', { name: 'Зберегти зміни' }));

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

  it('has no axe violations for the Clear button idle', async () => {
    const view = render(form(), { wrapper });

    await act(async () => undefined);

    await expectNoA11yViolations(view.container);
    expect(screen.getByRole('button', { name: 'Очистити' })).toBeInTheDocument();
  });
});
