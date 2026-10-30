import '@testing-library/jest-dom';
import { ThemeProvider } from '@mui/material/styles';
import { act, fireEvent, render, type RenderResult, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router';

import Notification from '@auth/components/form-section/auth-forms/registration-notification';
import createLocaleI18n from '@tests/unit/utils/create-locale-i18n';
import { testTheme } from '@tests/unit/utils/render-with-providers';
import expectNoA11yViolations from '@tests/utils/a11y/expect-no-a11y-violations';

jest.mock('@/assets/notification/confetti.svg', () => ({ ReactComponent: 'svg' }));
jest.mock('@/assets/notification/error.svg', () => ({ ReactComponent: 'svg' }));
jest.mock('@/assets/notification/settings.svg', () => ({ ReactComponent: 'svg' }));

type Reason = 'invalid_credentials' | 'locked' | 'rate_limited' | 'transient';
type Locale = 'uk' | 'en';

interface Handlers {
  readonly onBack: jest.Mock;
  readonly onRetry: jest.Mock;
}

const CASES: readonly (readonly [Reason, string, string, boolean])[] = [
  [
    'invalid_credentials',
    'Невірна електронна адреса або пароль',
    'Invalid e-mail or password',
    false,
  ],
  [
    'locked',
    'Обліковий запис тимчасово заблоковано через забагато невдалих спроб. Спробуйте пізніше.',
    'Your account is temporarily locked after too many failed attempts. Try again later.',
    false,
  ],
  [
    'rate_limited',
    'Забагато спроб входу. Спробуйте пізніше',
    'Too many sign-in attempts. Try again later',
    false,
  ],
  [
    'transient',
    "Не вдалося надіслати запит. Перевірте з'єднання та спробуйте ще раз.",
    'The request could not be sent. Check your connection and try again.',
    true,
  ],
];

const RETRY_LABEL: Record<Locale, string> = { uk: 'Спробувати ще раз', en: 'Try again' };
const BACK_LABEL: Record<Locale, string> = { uk: 'Назад', en: 'Go back' };
const IMAGE_LABEL: Record<Locale, string> = {
  uk: 'Червоний трикутник з попередженням про помилку.',
  en: 'Red triangle with a warning about an error',
};

const exactly = (text: string): RegExp =>
  new RegExp(`^${text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'u');

const handlersOf = (): Handlers => ({ onBack: jest.fn(), onRetry: jest.fn() });

interface CardOptions {
  readonly locale: Locale;
  readonly reason: Reason;
  readonly retryable: boolean;
  readonly isSubmitting?: boolean;
  readonly handlers: Handlers;
}

const cardOf = ({
  locale,
  reason,
  retryable,
  isSubmitting = false,
  handlers,
}: CardOptions): ReactElement => {
  const i18n = createLocaleI18n(locale);
  return (
    <MemoryRouter>
      <ThemeProvider theme={testTheme}>
        <I18nextProvider i18n={i18n}>
          <main>
            <Notification
              flow="signIn"
              view="error"
              errorText={i18n.t(`sign_in.errors.${reason}`)}
              isSubmitting={isSubmitting}
              onBack={handlers.onBack}
              onRetry={retryable ? handlers.onRetry : undefined}
            />
          </main>
        </I18nextProvider>
      </ThemeProvider>
    </MemoryRouter>
  );
};

const renderCard = (options: CardOptions): RenderResult => render(cardOf(options));

const focusOn = (element: HTMLElement): void => {
  act(() => element.focus());
};

describe('sign-in failure cards', () => {
  describe.each(CASES)('%s', (reason, uk, en, retryable) => {
    it.each([
      ['uk', uk],
      ['en', en],
    ] as const)('shows the %s text exactly in the alert', async (locale, text) => {
      renderCard({ locale, reason, retryable, handlers: handlersOf() });

      expect(await screen.findByRole('alert')).toHaveTextContent(exactly(text));
    });

    it.each(['uk', 'en'] as const)('moves focus to the heading in %s', async (locale) => {
      renderCard({ locale, reason, retryable, handlers: handlersOf() });

      expect(await screen.findByRole('heading', { level: 2 })).toHaveFocus();
    });

    it.each(['uk', 'en'] as const)('always offers Back and names the image in %s', (locale) => {
      renderCard({ locale, reason, retryable, handlers: handlersOf() });

      expect(screen.getByRole('button', { name: BACK_LABEL[locale] })).toBeInTheDocument();
      expect(screen.getByRole('img', { name: IMAGE_LABEL[locale] })).toBeInTheDocument();
    });

    it.each(['uk', 'en'] as const)('offers retry only where retrying helps in %s', (locale) => {
      renderCard({ locale, reason, retryable, handlers: handlersOf() });

      expect(screen.queryAllByRole('button', { name: RETRY_LABEL[locale] })).toHaveLength(
        retryable ? 1 : 0
      );
    });

    it('has no accessibility violations', async () => {
      const { container } = renderCard({
        locale: 'uk',
        reason,
        retryable,
        handlers: handlersOf(),
      });

      await expectNoA11yViolations(container);
    });
  });

  it('sends exactly one retry from the transient card and none on its own', () => {
    const handlers = handlersOf();
    renderCard({ locale: 'uk', reason: 'transient', retryable: true, handlers });

    expect(handlers.onRetry).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: RETRY_LABEL.uk }));

    expect(handlers.onRetry).toHaveBeenCalledTimes(1);
  });

  it('keeps the alert empty and Retry inert while a retry is in flight', () => {
    const handlers = handlersOf();
    renderCard({
      locale: 'uk',
      reason: 'transient',
      retryable: true,
      isSubmitting: true,
      handlers,
    });

    expect(screen.getByRole('alert')).toBeEmptyDOMElement();
    const retry = screen.getByRole('button', { name: RETRY_LABEL.uk });
    expect(retry).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(retry);

    expect(handlers.onRetry).not.toHaveBeenCalled();
  });

  it('has no accessibility violations while a retry is in flight', async () => {
    const { container } = renderCard({
      locale: 'uk',
      reason: 'transient',
      retryable: true,
      isSubmitting: true,
      handlers: handlersOf(),
    });

    await expectNoA11yViolations(container);
  });

  describe('when a retry settles with a failure that offers no retry', () => {
    const settle = async (): Promise<void> => {
      const handlers = handlersOf();
      const view = renderCard({
        locale: 'uk',
        reason: 'transient',
        retryable: true,
        handlers,
      });
      const retry = screen.getByRole('button', { name: RETRY_LABEL.uk });
      focusOn(retry);
      view.rerender(
        cardOf({ locale: 'uk', reason: 'transient', retryable: true, isSubmitting: true, handlers })
      );
      view.rerender(cardOf({ locale: 'uk', reason: 'locked', retryable: false, handlers }));
      await screen.findByText(CASES[1]?.[1] ?? '');
    };

    it('moves focus from the removed Retry button to the heading', async () => {
      await settle();

      expect(screen.queryByRole('button', { name: RETRY_LABEL.uk })).not.toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2 })).toHaveFocus();
    });

    it('announces the new text in the alert', async () => {
      await settle();

      expect(screen.getByRole('alert')).toHaveTextContent(exactly(CASES[1]?.[1] ?? ''));
    });
  });

  it('keeps focus where it is when the text changes while another control holds it', async () => {
    const handlers = handlersOf();
    const view = renderCard({ locale: 'uk', reason: 'transient', retryable: true, handlers });
    focusOn(screen.getByRole('button', { name: BACK_LABEL.uk }));

    view.rerender(cardOf({ locale: 'uk', reason: 'rate_limited', retryable: true, handlers }));
    await screen.findByText(CASES[2]?.[1] ?? '');

    expect(screen.getByRole('button', { name: BACK_LABEL.uk })).toHaveFocus();
  });

  it('returns focus to the heading when it was lost, even while the text is blank', () => {
    const handlers = handlersOf();
    const view = renderCard({ locale: 'uk', reason: 'transient', retryable: true, handlers });
    act(() => screen.getByRole('heading', { level: 2 }).blur());
    expect(document.body).toHaveFocus();

    view.rerender(
      cardOf({ locale: 'uk', reason: 'transient', retryable: true, isSubmitting: true, handlers })
    );

    expect(screen.getByRole('heading', { level: 2 })).toHaveFocus();
  });

  it('pulls focus to the heading on mount even when another control holds it', () => {
    const outside = document.createElement('button');
    document.body.append(outside);
    focusOn(outside);

    renderCard({ locale: 'uk', reason: 'locked', retryable: false, handlers: handlersOf() });

    expect(screen.getByRole('heading', { level: 2 })).toHaveFocus();
    outside.remove();
  });
});
