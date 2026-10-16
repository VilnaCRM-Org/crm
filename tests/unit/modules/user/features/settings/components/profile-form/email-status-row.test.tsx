import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { JSX, ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

import Row from '@/modules/user/features/settings/components/profile-form/email-status-row';
import createSettingsLocaleI18n from '@tests/unit/utils/create-settings-locale-i18n';
import expectNoA11yViolations from '@tests/utils/a11y/expect-no-a11y-violations';

const wrapper = ({ children }: { children: ReactNode }): JSX.Element => (
  <I18nextProvider i18n={createSettingsLocaleI18n('uk', ['en'])}>
    <main>{children}</main>
  </I18nextProvider>
);

const row = (busy = false, onResend = jest.fn()): JSX.Element => (
  <Row statusId="email-status" busy={busy} onResend={onResend} />
);

const resend = (): HTMLElement => screen.getByRole('button', { name: 'Надіслати повторно' });

describe('EmailStatusRow', () => {
  it('renders the status text under its id and a type=button resend control', () => {
    render(row(), { wrapper });

    expect(screen.getByText('E-mail не підтверджено')).toHaveAttribute('id', 'email-status');
    expect(resend()).toHaveAttribute('type', 'button');
    expect(resend()).not.toHaveAttribute('aria-disabled');
  });

  it('styles the control as a #0074B5 link of 24 px or more and the status in #57595B', () => {
    render(row(), { wrapper });

    expect(resend()).toHaveStyle({ color: '#0074B5', minHeight: '1.5rem' });
    expect(screen.getByText('E-mail не підтверджено')).toHaveStyle({ color: '#57595B' });
  });

  it('asks for one resend per activation', async () => {
    const onResend = jest.fn();
    render(row(false, onResend), { wrapper });

    await userEvent.click(resend());

    expect(onResend).toHaveBeenCalledTimes(1);
  });

  it('is aria-disabled, ignores activation and keeps focus while busy', async () => {
    const onResend = jest.fn();
    render(row(true, onResend), { wrapper });
    resend().focus();

    await userEvent.click(resend());
    await userEvent.keyboard('{Enter}');

    expect(resend()).toHaveAttribute('aria-disabled', 'true');
    expect(onResend).not.toHaveBeenCalled();
    expect(resend()).toHaveFocus();
  });

  it('speaks English when the language is English', async () => {
    const i18n = createSettingsLocaleI18n('uk', ['en']);
    await i18n.changeLanguage('en');
    render(
      <I18nextProvider i18n={i18n}>
        <Row statusId="s" busy={false} onResend={jest.fn()} />
      </I18nextProvider>
    );

    expect(screen.getByText('E-mail not confirmed')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send again' })).toBeInTheDocument();
  });

  it.each([false, true])('has no axe violations when busy is %s', async (busy) => {
    const view = render(row(busy), { wrapper });

    await expectNoA11yViolations(view.container);
  });
});
