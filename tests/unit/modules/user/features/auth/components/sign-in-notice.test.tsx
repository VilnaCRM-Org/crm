import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import * as React from 'react';
import { type JSX, type ReactNode, useLayoutEffect } from 'react';
import * as ReactI18next from 'react-i18next';
import { I18nextProvider } from 'react-i18next';

import SignInNotice from '@auth/components/sign-in-notice';
import type { SignInNoticeProps } from '@auth/types/components/sign-in-notice';
import createLocaleI18n from '@tests/unit/utils/create-locale-i18n';
import loadIsolated from '@tests/unit/utils/isolated-module';
import expectNoA11yViolations from '@tests/utils/a11y/expect-no-a11y-violations';

const i18n = createLocaleI18n('uk');

function Wrapper({ children }: { children: ReactNode }): JSX.Element {
  return (
    <I18nextProvider i18n={i18n}>
      <main>{children}</main>
    </I18nextProvider>
  );
}

const NOTICE_TEXT = 'Пароль змінено. Увійдіть з новим паролем.';
const SESSION_ENDED_TEXT = 'Сеанс завершився. Увійдіть знову.';

type SignInNoticeComponent = (props: SignInNoticeProps) => JSX.Element | null;

const loadFreshSignInNotice = (): Promise<SignInNoticeComponent> =>
  loadIsolated(async () => {
    jest.doMock('react', () => React);
    jest.doMock('react-i18next', () => ReactI18next);
    return (await import('@auth/components/sign-in-notice')).default;
  });

function CommitProbe({ notice, commits }: SignInNoticeProps & { commits: string[] }): JSX.Element {
  useLayoutEffect(() => {
    commits.push(screen.queryByRole('status')?.textContent ?? 'absent');
  });
  return <SignInNotice notice={notice} />;
}

describe('SignInNotice', () => {
  it.each([
    ['password_reset', NOTICE_TEXT],
    ['session_ended', SESSION_ENDED_TEXT],
  ] as const)(
    'maps the %s notice to its message when the module loads inside the test',
    async (notice, message) => {
      const FreshSignInNotice = await loadFreshSignInNotice();

      render(<FreshSignInNotice notice={notice} />, { wrapper: Wrapper });

      expect(await screen.findByRole('status')).toHaveTextContent(message);
    }
  );

  it('commits the status region empty before the notice text fills it', async () => {
    const commits: string[] = [];
    render(<CommitProbe notice="password_reset" commits={commits} />, { wrapper: Wrapper });

    expect(await screen.findByRole('status')).toHaveTextContent(NOTICE_TEXT);
    expect(commits[0]).toBe('');
  });

  it('fills the status region when a notice arrives after mounting without one', async () => {
    const { rerender } = render(<SignInNotice notice={null} />, { wrapper: Wrapper });

    rerender(<SignInNotice notice="password_reset" />);

    expect(await screen.findByRole('status')).toHaveTextContent(NOTICE_TEXT);
  });

  it('renders the password-reset notice in a polite status region', async () => {
    const view = render(<SignInNotice notice="password_reset" />, { wrapper: Wrapper });

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Пароль змінено. Увійдіть з новим паролем.'
    );
    await expectNoA11yViolations(view.container);
  });

  it('renders the session-ended notice with the info icon and neutral text', async () => {
    const view = render(<SignInNotice notice="session_ended" />, { wrapper: Wrapper });

    const status = await screen.findByRole('status');

    expect(status).toHaveTextContent(SESSION_ENDED_TEXT);
    expect(status).toHaveStyle({ color: '#404142' });
    expect(status.innerHTML).toContain('data-testid="InfoOutlinedIcon"');
    expect(status.innerHTML).toContain('aria-hidden="true"');
    expect(status.innerHTML).not.toContain('CheckCircleOutlinedIcon');
    await expectNoA11yViolations(view.container);
  });

  it('keeps the success icon and colour on the password-reset notice', async () => {
    render(<SignInNotice notice="password_reset" />, { wrapper: Wrapper });

    const status = await screen.findByRole('status');

    expect(status).toHaveStyle({ color: '#2E7D32' });
    expect(status.innerHTML).toContain('data-testid="CheckCircleOutlinedIcon"');
  });

  it('renders nothing without a notice', () => {
    render(<SignInNotice notice={null} />, { wrapper: Wrapper });

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
