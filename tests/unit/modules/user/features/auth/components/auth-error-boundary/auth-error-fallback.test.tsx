import { faker } from '@faker-js/faker';
import { fireEvent, screen } from '@testing-library/react';
import type { JSX } from 'react';

import localization from '@/i18n/localization.json';
import type { RecoverableError, RecoveryStrategy } from '@/lib/reliability/types/recoverable-error';
import AuthErrorFallback from '@auth/components/auth-error-boundary/auth-error-fallback';
import type { AuthErrorFallbackProps } from '@auth/types/auth-error-boundary';
import createLocaleI18n from '@tests/unit/utils/create-locale-i18n';
import { mediaStyleRuleFor, styleRuleFor } from '@tests/unit/utils/emotion-style-rules';
import renderWithProviders from '@tests/unit/utils/render-with-providers';

const EN = {
  title: 'Something went wrong',
  fallback: 'Something went wrong. Please try again later.',
  unrecoverable:
    "Something went wrong and this form can't be retried. " +
    'Use "Back to homepage" to leave this page.',
  tryAgain: 'Try again',
  reload: 'Reload the page',
  reloadRequired: 'Part of the page failed to load. Reload the page to get the latest version.',
  details: 'Error Details',
};

const UK = {
  title: 'Щось пішло не так',
  fallback: 'Щось пішло не так. Спробуйте пізніше.',
  unrecoverable:
    'Щось пішло не так, і цю форму ' +
    'не вдасться повторити. ' +
    'Скористайтеся посиланням «На головну сторінку», ' +
    'щоб вийти з цієї сторінки.',
  tryAgain: 'Спробувати ще раз',
  reload: 'Перезавантажити сторінку',
  reloadRequired: localization.uk.translation.auth.error.reloadRequired,
  details: 'Деталі помилки',
};

function recoveryFor(strategy: RecoveryStrategy): RecoverableError {
  return {
    recoverable: strategy !== 'none',
    strategy,
    messageKey: 'error_boundary.unexpected',
    severity: 'error',
  };
}

function renderFallback(
  overrides: Partial<AuthErrorFallbackProps> = {},
  locale: 'en' | 'uk' = 'en'
): { reset: jest.Mock; reload: jest.Mock } {
  const reset = jest.fn();
  const reload = jest.fn();
  const props: AuthErrorFallbackProps = {
    recovery: recoveryFor('reset'),
    reset,
    reload,
    ...overrides,
  };

  renderWithProviders(
    <AuthErrorFallback
      error={props.error}
      recovery={props.recovery}
      reset={props.reset}
      reload={props.reload}
      fallback={props.fallback}
    />,
    { i18nMock: createLocaleI18n(locale) }
  );

  return { reset, reload };
}

function focusTarget(): HTMLElement {
  const targets = screen.getAllByRole('generic').filter((node) => node.hasAttribute('tabindex'));
  expect(targets).toHaveLength(1);
  return targets[0] as HTMLElement;
}

describe('AuthErrorFallback', () => {
  describe('structure and focus', () => {
    it('renders the localized title, alert and retry button inside one focus target', () => {
      renderFallback();

      const target = focusTarget();
      const heading = screen.getByRole('heading', { level: 1, name: EN.title });
      const alert = screen.getByRole('alert');
      const retry = screen.getByRole('button', { name: EN.tryAgain });

      expect(target).toHaveAttribute('tabindex', '-1');
      expect(target).toHaveFocus();
      expect(heading).toHaveClass('MuiTypography-h4');
      expect(target).toContainElement(heading);
      expect(target).toContainElement(alert);
      expect(target).toContainElement(retry);
      expect(alert).toHaveTextContent(EN.fallback);
      expect(alert).not.toContainElement(heading);
      expect(alert).not.toContainElement(retry);
    });

    it('does not stack aria-live attributes on top of the alert role', () => {
      renderFallback();

      const alert = screen.getByRole('alert');
      expect(alert).not.toHaveAttribute('aria-live');
      expect(alert).not.toHaveAttribute('aria-atomic');
    });

    it('hides the focus ring on the programmatic target unless focus is visible', () => {
      renderFallback();

      const rule = styleRuleFor(focusTarget(), ':focus:not(:focus-visible)');
      expect(rule?.getPropertyValue('outline')).toBe('none');
      expect(styleRuleFor(focusTarget())?.getPropertyValue('outline')).toBe('');
    });

    it('renders the Ukrainian strings from the shipped catalog', () => {
      renderFallback({}, 'uk');

      expect(screen.getByRole('heading', { level: 1, name: UK.title })).toBeInTheDocument();
      expect(screen.getByRole('alert')).toHaveTextContent(UK.fallback);
      expect(screen.getByRole('button', { name: UK.tryAgain })).toBeInTheDocument();
    });
  });

  describe('retry control', () => {
    it('calls reset when the retry button is activated', () => {
      const { reset } = renderFallback();

      fireEvent.click(screen.getByRole('button', { name: EN.tryAgain }));

      expect(reset).toHaveBeenCalledTimes(1);
    });

    it('is a real button that never submits an enclosing form', () => {
      renderFallback();

      expect(screen.getByRole('button', { name: EN.tryAgain })).toHaveAttribute('type', 'button');
    });

    it('meets the 44px target floor and draws its focus ring only under :focus-visible', () => {
      renderFallback();

      const retry = screen.getByRole('button', { name: EN.tryAgain });
      const base = styleRuleFor(retry);
      const focusVisible = styleRuleFor(retry, ':focus-visible');

      expect(base?.getPropertyValue('min-height')).toBe('2.75rem');
      expect(base?.getPropertyValue('outline')).toBe('');
      expect(focusVisible?.getPropertyValue('outline')).toBe('3px solid #005FCC');
      expect(focusVisible?.getPropertyValue('outline-offset')).toBe('2px');
      expect(mediaStyleRuleFor(retry, 'forced-colors:active')?.getPropertyValue('border')).toBe(
        '1px solid ButtonText'
      );
    });

    it.each<RecoveryStrategy>(['retry', 'reset'])(
      'offers a retry for the %s strategy',
      (strategy) => {
        renderFallback({ recovery: recoveryFor(strategy) });

        expect(screen.getByRole('button', { name: EN.tryAgain })).toBeInTheDocument();
        expect(screen.getByRole('alert')).toHaveTextContent(EN.fallback);
      }
    );

    it('offers a page reload instead of a retry when a stale chunk cannot be re-imported', () => {
      const { reset, reload } = renderFallback({ recovery: recoveryFor('reload') });

      expect(screen.queryByRole('button', { name: EN.tryAgain })).not.toBeInTheDocument();
      expect(screen.getByRole('alert')).toHaveTextContent(EN.reloadRequired);
      fireEvent.click(screen.getByRole('button', { name: EN.reload }));

      expect(reload).toHaveBeenCalledTimes(1);
      expect(reset).not.toHaveBeenCalled();
    });

    it('renders no reload button when no reload action was supplied', () => {
      renderFallback({ recovery: recoveryFor('reload'), reload: undefined });

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
      expect(screen.getByRole('alert')).toHaveTextContent(EN.reloadRequired);
    });

    it('offers only the surviving homepage link for the navigate-home strategy', () => {
      renderFallback({ recovery: recoveryFor('navigate-home') });

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
      expect(screen.getByRole('alert')).toHaveTextContent(EN.unrecoverable);
    });

    it('explains the reload in Ukrainian', () => {
      renderFallback({ recovery: recoveryFor('reload') }, 'uk');

      expect(screen.getByRole('button', { name: UK.reload })).toBeInTheDocument();
      expect(screen.getByRole('alert')).toHaveTextContent(UK.reloadRequired);
    });

    it('prefers the reload explanation over a custom fallback', () => {
      renderFallback({ recovery: recoveryFor('reload'), fallback: <span>custom copy</span> });

      expect(screen.getByRole('alert')).toHaveTextContent(EN.reloadRequired);
      expect(screen.queryByText('custom copy')).not.toBeInTheDocument();
    });

    it('drops the retry and explains the exit when nothing can be retried', () => {
      renderFallback({ recovery: recoveryFor('none') });

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
      expect(screen.getByRole('alert')).toHaveTextContent(EN.unrecoverable);
      expect(focusTarget()).toHaveFocus();
    });

    it('explains the exit in Ukrainian when nothing can be retried', () => {
      renderFallback({ recovery: recoveryFor('none') }, 'uk');

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
      expect(screen.getByRole('alert')).toHaveTextContent(UK.unrecoverable);
    });

    it('prefers the unrecoverable explanation over a custom fallback', () => {
      const custom = faker.lorem.sentence();

      renderFallback({ recovery: recoveryFor('none'), fallback: <span>{custom}</span> });

      expect(screen.getByRole('alert')).toHaveTextContent(EN.unrecoverable);
      expect(screen.queryByText(custom)).not.toBeInTheDocument();
    });
  });

  describe('custom fallback content', () => {
    it('renders a custom node inside the alert', () => {
      const custom = faker.lorem.sentence();

      renderFallback({ fallback: <em>{custom}</em> });

      expect(screen.getByRole('alert')).toHaveTextContent(custom);
      expect(screen.getByRole('alert')).toContainElement(screen.getByText(custom));
      expect(screen.queryByText(EN.fallback)).not.toBeInTheDocument();
    });

    it('renders a plain string fallback verbatim', () => {
      const custom = faker.lorem.sentence();

      renderFallback({ fallback: custom });

      expect(screen.getByRole('alert')).toHaveTextContent(custom);
    });

    it('calls a render function with the error and the reset action', () => {
      const error = new Error(faker.lorem.words(3));
      const { reset } = renderFallback({
        error,
        fallback: ({ error: caught, reset: retry }): JSX.Element => (
          <button type="button" onClick={retry}>
            {caught?.message}
          </button>
        ),
      });

      const custom = screen.getByRole('button', { name: error.message });
      expect(screen.getByRole('alert')).toContainElement(custom);

      fireEvent.click(custom);

      expect(reset).toHaveBeenCalledTimes(1);
    });
  });

  describe('diagnostics', () => {
    it('shows the caught message in a wrapping block outside production', () => {
      const error = new Error('line one\nline two');

      renderFallback({ error });

      expect(screen.getByText(EN.details)).toBeInTheDocument();
      const message = screen.getByText(error.message, { normalizer: (value) => value });
      expect(message.tagName).toBe('PRE');
      expect(message).toHaveStyle({ whiteSpace: 'pre-wrap' });
      expect(styleRuleFor(message)?.getPropertyValue('overflow-wrap')).toBe('anywhere');
    });

    it('labels the diagnostics in Ukrainian', () => {
      renderFallback({ error: new Error(faker.lorem.word()) }, 'uk');

      expect(screen.getByText(UK.details)).toBeInTheDocument();
    });

    it('renders no diagnostics when no error object was caught', () => {
      renderFallback();

      expect(screen.queryByText(EN.details)).not.toBeInTheDocument();
    });
  });
});
