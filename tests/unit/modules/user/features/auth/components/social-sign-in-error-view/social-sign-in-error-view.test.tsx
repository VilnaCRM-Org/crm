import '@testing-library/jest-dom';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { JSX } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router';

import SocialSignInErrorView from '@auth/components/social-sign-in-error-view';
import type { SocialSignInErrorKind } from '@auth/types/social-sign-in/social-sign-in-error-kind';
import createLocaleI18n from '@tests/unit/utils/create-locale-i18n';
import expectNoA11yViolations from '@tests/utils/a11y/expect-no-a11y-violations';

const i18n = createLocaleI18n('uk');

const TITLE = 'Не вдалося увійти через Google';
const TRY_AGAIN = 'Спробувати ще раз';
const BACK = 'Повернутися до входу';

const view = (kind: SocialSignInErrorKind, onRetry?: () => void): JSX.Element => (
  <I18nextProvider i18n={i18n}>
    <MemoryRouter>
      <main>
        <SocialSignInErrorView kind={kind} providerLabel="Google" onRetry={onRetry} />
      </main>
    </MemoryRouter>
  </I18nextProvider>
);

const RETRYABLE: ReadonlyArray<[SocialSignInErrorKind, string]> = [
  ['cancelled', 'Вхід через Google скасовано. Спробуйте ще раз або увійдіть іншим способом.'],
  ['missing_parameters', 'Google не повернув даних для входу. Спробуйте ще раз.'],
  ['expired', 'Спроба входу застаріла або вже використана. Спробуйте ще раз.'],
  [
    'email_unavailable',
    'Google не надав вашу адресу пошти, без якої VilnaCRM не може виконати вхід. ' +
      'Дозвольте Google поділитися нею й спробуйте ще раз ' +
      'або увійдіть за допомогою пошти та пароля.',
  ],
  [
    'email_unverified',
    'Ваша адреса пошти в Google не підтверджена. Підтвердьте її в Google і спробуйте ще раз.',
  ],
  ['unavailable', 'Google зараз не відповідає. Спробуйте ще раз за хвилину.'],
  ['generic', 'Під час входу через Google щось пішло не так. Спробуйте ще раз.'],
];

const FINAL: ReadonlyArray<[SocialSignInErrorKind, string]> = [
  [
    'provider_mismatch',
    'Відповідь надійшла від іншого сервісу, ніж той, який ви обрали. Поверніться й почніть знову.',
  ],
  [
    'unsupported_provider',
    'Вхід через Google недоступний. Увійдіть за допомогою пошти та пароля або іншого сервісу.',
  ],
  [
    'duplicate_email',
    'Ваша адреса електронної пошти в Google збігається з кількома обліковими записами VilnaCRM, ' +
      'тому її не можна прив’язати автоматично. Увійдіть за допомогою пошти та пароля.',
  ],
  [
    'two_factor_required',
    'Ваш обліковий запис захищено двофакторною автентифікацією. ' +
      'Увійдіть за допомогою пошти та пароля, щоб завершити вхід.',
  ],
];

describe('SocialSignInErrorView', () => {
  it('focuses its h1, which names the provider', () => {
    render(view('expired', jest.fn()));

    const heading = screen.getByRole('heading', { level: 1, name: TITLE });
    expect(heading).toHaveAttribute('tabindex', '-1');
    expect(heading).toHaveFocus();
  });

  it('fills its polite status after the first paint, so the message is announced', () => {
    const host = document.body.appendChild(document.createElement('div'));
    try {
      host.innerHTML = renderToStaticMarkup(view('expired', jest.fn()));
      expect(within(host).getByRole('status')).toHaveTextContent('');
    } finally {
      host.remove();
    }
  });

  it.each(RETRYABLE)('offers a retry for %s', async (kind, message) => {
    const onRetry = jest.fn();
    render(view(kind, onRetry));

    expect(await screen.findByRole('status')).toHaveTextContent(message);
    await userEvent.click(screen.getByRole('button', { name: TRY_AGAIN }));
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('link', { name: BACK })).toHaveAttribute('href', '/sign-in');
  });

  it.each(FINAL)('offers only the way back for %s', async (kind, message) => {
    render(view(kind, jest.fn()));

    expect(await screen.findByRole('status')).toHaveTextContent(message);
    expect(screen.queryByRole('button', { name: TRY_AGAIN })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: BACK })).toHaveAttribute('href', '/sign-in');
  });

  it('hides the retry of a retryable kind when no retry handler is given', async () => {
    render(view('expired'));

    await screen.findByText('Спроба входу застаріла або вже використана. Спробуйте ще раз.');
    expect(screen.queryByRole('button', { name: TRY_AGAIN })).not.toBeInTheDocument();
  });

  it('makes the way back the primary action only when there is no retry', () => {
    const { unmount } = render(view('expired', jest.fn()));
    expect(screen.getByRole('button', { name: TRY_AGAIN })).toHaveClass('MuiButton-contained');
    expect(screen.getByRole('link', { name: BACK })).toHaveClass('MuiButton-text');
    unmount();

    render(view('duplicate_email', jest.fn()));
    expect(screen.getByRole('link', { name: BACK })).toHaveClass('MuiButton-contained');
  });

  it('stacks its actions in one column', async () => {
    const { default: styles } = await import('@auth/components/social-sign-in-error-view/styles');

    expect(styles.actions).toEqual({ display: 'flex', flexDirection: 'column', gap: '0.75rem' });
  });

  it('keeps the secondary link coloured when visited and gives it a focus ring', async () => {
    const { default: styles } = await import('@auth/components/social-sign-in-error-view/styles');

    expect(styles.backText).toMatchObject({
      color: '#0074B5',
      '&:visited': { color: '#0074B5' },
      '&:hover': { color: '#00588A', backgroundColor: 'transparent' },
      '&:focus-visible, &.Mui-focusVisible': { outline: '2px solid #404142', outlineOffset: '2px' },
      height: '3.125rem',
    });
  });

  it('announces politely, after the focused heading', async () => {
    render(view('expired', jest.fn()));

    expect(await screen.findByRole('status')).toHaveAttribute('aria-live', 'polite');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('has no axe violations with and without a retry', async () => {
    const { container, unmount } = render(view('expired', jest.fn()));
    await screen.findByRole('button', { name: TRY_AGAIN });
    await expectNoA11yViolations(container);
    unmount();

    const { container: finalContainer } = render(view('duplicate_email'));
    await expectNoA11yViolations(finalContainer);
  });

  it('re-announces when the kind changes on the same view', async () => {
    const { rerender } = render(view('expired', jest.fn()));
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Спроба входу застаріла або вже використана. Спробуйте ще раз.'
    );

    rerender(view('unavailable', jest.fn()));

    expect(
      await screen.findByText('Google зараз не відповідає. Спробуйте ще раз за хвилину.')
    ).toBeInTheDocument();
  });

  it('styles the way back as the text link beside a retry, else as the primary action', () => {
    const { unmount } = render(view('expired', jest.fn()));
    expect(screen.getByRole('link', { name: BACK })).toHaveStyle({ color: '#0074B5' });
    unmount();

    render(view('duplicate_email'));
    expect(screen.getByRole('link', { name: BACK })).not.toHaveStyle({ color: '#0074B5' });
  });

  it('styles its heading as the auth form title', () => {
    render(view('expired', jest.fn()));

    expect(screen.getByRole('heading', { level: 1, name: TITLE })).toHaveStyle({
      fontSize: '1.375rem',
      fontWeight: '700',
    });
  });
});
