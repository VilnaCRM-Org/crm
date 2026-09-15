import { faker } from '@faker-js/faker';
import { ThemeProvider } from '@mui/material/styles';
import { fireEvent, render, screen } from '@testing-library/react';
import type { JSX, ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

import localization from '@/i18n/localization.json';
import AuthErrorBoundary from '@auth/components/auth-error-boundary';
import type { AuthFallbackRenderArgs } from '@auth/types/auth-error-boundary';
import createLocaleI18n from '@tests/unit/utils/create-locale-i18n';
import renderWithProviders, { testI18n, testTheme } from '@tests/unit/utils/render-with-providers';

const TITLE = 'Something went wrong';
const DEFAULT_TEXT = 'Something went wrong. Please try again later.';
const UNRECOVERABLE_TEXT =
  "Something went wrong and this form can't be retried. " +
  'Use "Back to homepage" to leave this page.';
const TRY_AGAIN = 'Try again';

function Bomb({ thrown }: { thrown: unknown }): JSX.Element {
  throw thrown;
}

function makeControlledChild(): { Child: () => JSX.Element; recover: () => void; error: Error } {
  const error = new Error(faker.lorem.words(2));
  let throwing = true;

  return {
    error,
    recover: (): void => {
      throwing = false;
    },
    Child: (): JSX.Element => {
      if (throwing) throw error;
      return <p>recovered content</p>;
    },
  };
}

function Providers({ children }: { children: ReactNode }): JSX.Element {
  return (
    <ThemeProvider theme={testTheme}>
      <I18nextProvider i18n={testI18n}>{children}</I18nextProvider>
    </ThemeProvider>
  );
}

function focusTarget(): HTMLElement {
  const targets = screen.getAllByRole('generic').filter((node) => node.hasAttribute('tabindex'));
  expect(targets).toHaveLength(1);
  return targets[0] as HTMLElement;
}

describe('AuthErrorBoundary', () => {
  let onCaughtError: jest.Mock;

  beforeEach(() => {
    onCaughtError = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders its children and no fallback while nothing throws', () => {
    renderWithProviders(
      <AuthErrorBoundary>
        <p>healthy child</p>
      </AuthErrorBoundary>,
      { onCaughtError }
    );

    expect(screen.getByText('healthy child')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(onCaughtError).not.toHaveBeenCalled();
  });

  it('replaces a throwing child with the focused, localized fallback', () => {
    const error = new Error(faker.lorem.words(3));

    renderWithProviders(
      <AuthErrorBoundary>
        <Bomb thrown={error} />
      </AuthErrorBoundary>,
      { onCaughtError, i18nMock: createLocaleI18n('en') }
    );

    expect(onCaughtError).toHaveBeenCalledTimes(1);
    expect(onCaughtError).toHaveBeenCalledWith(
      error,
      expect.objectContaining({ componentStack: expect.any(String) })
    );
    const target = focusTarget();
    expect(target).toHaveFocus();
    expect(target).toContainElement(screen.getByRole('heading', { level: 1, name: TITLE }));
    expect(screen.getByRole('alert')).toHaveTextContent(DEFAULT_TEXT);
    expect(screen.getByRole('button', { name: TRY_AGAIN })).toBeInTheDocument();
  });

  it('renders the Ukrainian fallback strings', () => {
    renderWithProviders(
      <AuthErrorBoundary>
        <Bomb thrown={new Error(faker.lorem.word())} />
      </AuthErrorBoundary>,
      { onCaughtError, i18nMock: createLocaleI18n('uk') }
    );

    expect(onCaughtError).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole('heading', { level: 1, name: localization.uk.translation.auth.error.title })
    ).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(
      localization.uk.translation.auth.error.default
    );
    expect(
      screen.getByRole('button', { name: localization.uk.translation.auth.error.tryAgain })
    ).toBeInTheDocument();
  });

  it('renders a custom fallback node inside the alert', () => {
    const custom = faker.lorem.sentence();

    renderWithProviders(
      <AuthErrorBoundary fallback={<span>{custom}</span>}>
        <Bomb thrown={new Error(faker.lorem.word())} />
      </AuthErrorBoundary>,
      { onCaughtError }
    );

    expect(onCaughtError).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('alert')).toHaveTextContent(custom);
    expect(screen.queryByText(DEFAULT_TEXT)).not.toBeInTheDocument();
  });

  it('shows the latest custom fallback after the prop changes while still failing', () => {
    const first = faker.lorem.sentence();
    const second = faker.lorem.sentence();
    const thrown = new Error(faker.lorem.word());

    const view = render(
      <AuthErrorBoundary fallback={<span>{first}</span>}>
        <Bomb thrown={thrown} />
      </AuthErrorBoundary>,
      { wrapper: Providers, onCaughtError }
    );
    expect(screen.getByRole('alert')).toHaveTextContent(first);

    view.rerender(
      <AuthErrorBoundary fallback={<span>{second}</span>}>
        <Bomb thrown={thrown} />
      </AuthErrorBoundary>
    );

    expect(onCaughtError).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('alert')).toHaveTextContent(second);
    expect(screen.queryByText(first)).not.toBeInTheDocument();
  });

  it('hands a render-function fallback the caught error and a working reset', () => {
    const { Child, recover, error } = makeControlledChild();
    const fallback = jest.fn(({ error: caught, reset }: AuthFallbackRenderArgs): JSX.Element => (
      <button type="button" onClick={reset}>
        {caught?.message}
      </button>
    ));

    renderWithProviders(
      <AuthErrorBoundary fallback={fallback}>
        <Child />
      </AuthErrorBoundary>,
      { onCaughtError }
    );

    expect(fallback).toHaveBeenCalledWith({ error, reset: expect.any(Function) });
    expect(screen.getByRole('alert')).toContainElement(
      screen.getByRole('button', { name: error.message })
    );

    recover();
    fireEvent.click(screen.getByRole('button', { name: error.message }));

    expect(screen.getByText('recovered content')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('re-renders the children when "Try again" is activated after the cause is fixed', () => {
    const { Child, recover } = makeControlledChild();

    renderWithProviders(
      <AuthErrorBoundary>
        <Child />
      </AuthErrorBoundary>,
      { onCaughtError }
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();

    recover();
    fireEvent.click(screen.getByRole('button', { name: TRY_AGAIN }));

    expect(screen.getByText('recovered content')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(onCaughtError).toHaveBeenCalledTimes(1);
  });

  it('remounts the fallback and refocuses it when the retry throws again', () => {
    renderWithProviders(
      <AuthErrorBoundary>
        <Bomb thrown={new Error(faker.lorem.word())} />
      </AuthErrorBoundary>,
      { onCaughtError }
    );

    const firstTarget = focusTarget();
    screen.getByRole('button', { name: TRY_AGAIN }).focus();
    expect(firstTarget).not.toHaveFocus();

    fireEvent.click(screen.getByRole('button', { name: TRY_AGAIN }));

    const secondTarget = focusTarget();
    expect(secondTarget).not.toBe(firstTarget);
    expect(secondTarget).toHaveFocus();
    expect(onCaughtError).toHaveBeenCalledTimes(2);
  });

  it.each([
    ['a retryable: false shape', { retryable: false }],
    [
      'a RecoverableError with the none strategy',
      {
        recoverable: false,
        strategy: 'none',
        messageKey: 'auth.error.unrecoverable',
        severity: 'error',
      },
    ],
  ])('withholds the retry and explains the exit for %s', (_label, thrown) => {
    renderWithProviders(
      <AuthErrorBoundary>
        <Bomb thrown={thrown} />
      </AuthErrorBoundary>,
      { onCaughtError }
    );

    expect(onCaughtError).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('alert')).toHaveTextContent(UNRECOVERABLE_TEXT);
    expect(screen.queryByRole('button', { name: TRY_AGAIN })).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(focusTarget()).toHaveFocus();
  });

  it('keeps offering a retry for a retryable: true shape', () => {
    renderWithProviders(
      <AuthErrorBoundary>
        <Bomb thrown={{ retryable: true }} />
      </AuthErrorBoundary>,
      { onCaughtError }
    );

    expect(screen.getByRole('alert')).toHaveTextContent(DEFAULT_TEXT);
    expect(screen.getByRole('button', { name: TRY_AGAIN })).toBeInTheDocument();
  });

  it('ships every auth error translation in both locales', () => {
    for (const locale of ['en', 'uk'] as const) {
      const { error } = localization[locale].translation.auth;
      expect(error.default).toBeTruthy();
      expect(error.details).toBeTruthy();
      expect(error.title).toBeTruthy();
      expect(error.tryAgain).toBeTruthy();
      expect(error.unrecoverable).toBeTruthy();
    }
  });
});
