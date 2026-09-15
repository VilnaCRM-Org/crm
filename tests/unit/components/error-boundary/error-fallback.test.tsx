// @jest-environment jsdom

import '@tests/unit/utils/setup-bun-dom';
import '@testing-library/jest-dom';
import { faker } from '@faker-js/faker';
import { fireEvent, render, screen } from '@testing-library/react';
import i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';

import ErrorFallback from '@/components/error-boundary/error-fallback';
import type { ErrorFallbackProps } from '@/components/types/error-boundary';
import type { RecoverableError, RecoveryStrategy } from '@/lib/reliability/types/recoverable-error';

import createLocaleI18n from '../../utils/create-locale-i18n';
import { mediaStyleRuleFor, styleRuleFor } from '../../utils/emotion-style-rules';
import renderWithProviders from '../../utils/render-with-providers';

const HEADING = 'Something went wrong';
const TRY_AGAIN = 'Try again';
const RELOAD = 'Reload the page';
const GO_HOME = 'Go to homepage';
const DETAILS = 'Error details';

const MESSAGES: Record<string, string> = {
  'error_boundary.unexpected':
    'An unexpected error occurred. You can try again or go to the homepage.',
  'error_boundary.retryable': 'The last action did not complete. Try again.',
  'error_boundary.unrecoverable': "This error can't be retried. Go to the homepage to continue.",
  'error_boundary.chunk_load':
    'Part of the page failed to load. Reload the page to get the latest version.',
  'error_boundary.route': 'This page is not available. Go to the homepage.',
  'error_boundary.bootstrap': 'The application could not start. Reload the page.',
};

function recoveryFor(strategy: RecoveryStrategy, messageKey: string): RecoverableError {
  return { recoverable: strategy !== 'none', strategy, messageKey, severity: 'error' };
}

const RESET_RECOVERY = recoveryFor('reset', 'error_boundary.unexpected');

function renderFallback(
  overrides: Partial<ErrorFallbackProps> = {},
  i18nMock = createLocaleI18n('en')
): ReturnType<typeof renderWithProviders> & { reset: jest.Mock; reload: jest.Mock } {
  const reset = jest.fn();
  const reload = jest.fn();
  const props: ErrorFallbackProps = { recovery: RESET_RECOVERY, reset, reload, ...overrides };
  const view = renderWithProviders(
    <ErrorFallback
      error={props.error}
      recovery={props.recovery}
      reset={props.reset}
      reload={props.reload}
      landmark={props.landmark}
    />,
    { i18nMock }
  );
  return { ...view, reset, reload };
}

function precedes(first: HTMLElement, second: HTMLElement): boolean {
  return (first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
}

describe('ErrorFallback', () => {
  describe('structure and announcement', () => {
    it('renders a main landmark with a focused, programmatically focusable h1', () => {
      renderFallback();

      const main = screen.getByRole('main');
      const heading = screen.getByRole('heading', { level: 1, name: HEADING });
      expect(main).not.toHaveAttribute('aria-labelledby');
      expect(heading).toHaveAttribute('tabindex', '-1');
      expect(heading).toHaveFocus();
      expect(screen.queryByRole('region')).not.toBeInTheDocument();
    });

    it('renders a labelled region instead of a second main when asked to', () => {
      renderFallback({ landmark: 'region' });

      const region = screen.getByRole('region', { name: HEADING });
      const heading = screen.getByRole('heading', { level: 1, name: HEADING });
      expect(region).toHaveAttribute('aria-labelledby', heading.id);
      expect(heading.id).not.toBe('');
      expect(heading).toHaveFocus();
      expect(screen.queryByRole('main')).not.toBeInTheDocument();
    });

    it.each(Object.entries(MESSAGES))(
      'announces the %s message through a single alert',
      (messageKey, message) => {
        renderFallback({ recovery: recoveryFor('none', messageKey) });

        expect(screen.getAllByRole('alert')).toHaveLength(1);
        expect(screen.getByRole('alert')).toHaveTextContent(message);
      }
    );
  });

  describe('recovery actions', () => {
    it.each<RecoveryStrategy>(['retry', 'reset'])(
      'offers "Try again" wired to reset for the %s strategy',
      (strategy) => {
        const { reset, reload } = renderFallback({
          recovery: recoveryFor(strategy, 'error_boundary.unexpected'),
        });

        fireEvent.click(screen.getByRole('button', { name: TRY_AGAIN }));

        expect(reset).toHaveBeenCalledTimes(1);
        expect(reload).not.toHaveBeenCalled();
        expect(screen.queryByRole('button', { name: RELOAD })).not.toBeInTheDocument();
      }
    );

    it('offers "Reload the page" wired to reload for the reload strategy', () => {
      const { reset, reload } = renderFallback({
        recovery: recoveryFor('reload', 'error_boundary.chunk_load'),
      });

      fireEvent.click(screen.getByRole('button', { name: RELOAD }));

      expect(reload).toHaveBeenCalledTimes(1);
      expect(reset).not.toHaveBeenCalled();
      expect(screen.queryByRole('button', { name: TRY_AGAIN })).not.toBeInTheDocument();
    });

    it('offers no button for the reload strategy when no reload action was given', () => {
      renderFallback({
        recovery: recoveryFor('reload', 'error_boundary.chunk_load'),
        reload: undefined,
      });

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
      expect(screen.getByRole('link', { name: GO_HOME })).toBeInTheDocument();
    });

    it.each<RecoveryStrategy>(['navigate-home', 'none'])(
      'offers no button for the %s strategy',
      (strategy) => {
        renderFallback({ recovery: recoveryFor(strategy, 'error_boundary.route') });

        expect(screen.queryByRole('button')).not.toBeInTheDocument();
        expect(screen.getByRole('link', { name: GO_HOME })).toBeInTheDocument();
      }
    );

    it('always renders a real homepage link after the action button', () => {
      renderFallback();

      const button = screen.getByRole('button', { name: TRY_AGAIN });
      const link = screen.getByRole('link', { name: GO_HOME });
      expect(link).toHaveAttribute('href', '/');
      expect(precedes(button, link)).toBe(true);
    });

    it('sets a non-submitting button type on the action', () => {
      renderFallback({ recovery: recoveryFor('reload', 'error_boundary.chunk_load') });

      expect(screen.getByRole('button', { name: RELOAD })).toHaveAttribute('type', 'button');
    });
  });

  describe('localisation', () => {
    it('renders the English copy and marks the landmark with lang="en"', () => {
      renderFallback();

      expect(screen.getByRole('main')).toHaveAttribute('lang', 'en');
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(HEADING);
      expect(screen.getByRole('button', { name: TRY_AGAIN })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: GO_HOME })).toBeInTheDocument();
    });

    it('renders the Ukrainian copy and marks the landmark with lang="uk"', () => {
      renderFallback({ error: new Error('boom') }, createLocaleI18n('uk'));

      expect(screen.getByRole('main')).toHaveAttribute('lang', 'uk');
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Щось пішло не так');
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Сталася неочікувана помилка. Спробуйте ще раз або перейдіть на головну сторінку.'
      );
      expect(screen.getByRole('button', { name: 'Спробувати ще раз' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'На головну сторінку' })).toBeInTheDocument();
      expect(screen.getByText('Деталі помилки')).toBeInTheDocument();
    });

    it('falls back to lang="en" and renders bare keys when no language resolved', () => {
      const unresolved = i18next.createInstance();
      unresolved.use(initReactI18next).init({
        lng: 'cimode',
        resources: { en: { translation: { error_boundary: { title: 'x' } } } },
        initAsync: false,
      });

      render(
        <I18nextProvider i18n={unresolved}>
          <ErrorFallback recovery={RESET_RECOVERY} reset={jest.fn()} />
        </I18nextProvider>
      );

      expect(unresolved.resolvedLanguage).toBeUndefined();
      expect(screen.getByRole('main')).toHaveAttribute('lang', 'en');
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('error_boundary.title');
      expect(screen.getByRole('alert')).toHaveTextContent('error_boundary.unexpected');
    });
  });

  describe('diagnostics', () => {
    it('discloses the error message under a details widget outside production', () => {
      const message = faker.lorem.sentence();

      renderFallback({ error: new Error(message) });

      expect(screen.getByRole('group')).toBeInTheDocument();
      expect(screen.getByText(DETAILS)).toBeInTheDocument();
      expect(screen.getByText(message)).toBeInTheDocument();
    });

    it('renders no details when there is no error to disclose', () => {
      renderFallback({ error: undefined });

      expect(screen.queryByRole('group')).not.toBeInTheDocument();
      expect(screen.queryByText(DETAILS)).not.toBeInTheDocument();
    });

    it('renders no details in production even when an error is given', () => {
      const originalEnv = process.env.NODE_ENV;
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', configurable: true });

      try {
        const message = faker.lorem.sentence();
        renderFallback({ error: new Error(message) });

        expect(screen.queryByRole('group')).not.toBeInTheDocument();
        expect(screen.queryByText(message)).not.toBeInTheDocument();
        expect(screen.getByRole('heading', { level: 1, name: HEADING })).toBeInTheDocument();
      } finally {
        Object.defineProperty(process.env, 'NODE_ENV', {
          value: originalEnv,
          configurable: true,
        });
      }
    });
  });

  describe('styling contract', () => {
    function actionControls(): { button: HTMLElement; link: HTMLElement } {
      renderFallback();
      return {
        button: screen.getByRole('button', { name: TRY_AGAIN }),
        link: screen.getByRole('link', { name: GO_HOME }),
      };
    }

    function declared(element: HTMLElement, property: string, suffix = ''): string | undefined {
      return styleRuleFor(element, suffix)?.getPropertyValue(property);
    }

    it('shows the focus ring only under :focus-visible, offset from the control', () => {
      const { button, link } = actionControls();

      for (const control of [button, link]) {
        expect(declared(control, 'outline')).toBe('');
        expect(declared(control, 'outline', ':focus-visible')).toBe('3px solid #005FCC');
        expect(declared(control, 'outline-offset', ':focus-visible')).toBe('2px');
      }
    });

    it('sizes both controls to the shared 2.75rem action floor', () => {
      const { button, link } = actionControls();

      for (const control of [button, link]) {
        expect(declared(control, 'min-height')).toBe('2.75rem');
        expect(declared(control, 'line-height')).toBe('1.5');
        expect(declared(control, 'display')).toBe('inline-flex');
      }
    });

    it('keeps a visible border for both controls under forced colours', () => {
      const { button, link } = actionControls();

      for (const control of [button, link]) {
        expect(mediaStyleRuleFor(control, 'forced-colors:active')?.getPropertyValue('border')).toBe(
          '1px solid ButtonText'
        );
      }
    });

    it('wraps long diagnostic output instead of overflowing', () => {
      const message = faker.string.alphanumeric(200);
      renderFallback({ error: new Error(message) });

      const details = screen.getByRole('group');
      expect(screen.getByText(message).tagName).toBe('PRE');
      expect(declared(details, 'white-space', ' pre')).toBe('pre-wrap');
      expect(declared(details, 'overflow-wrap', ' pre')).toBe('anywhere');
    });
  });
});
