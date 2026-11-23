import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { JSX, ReactNode } from 'react';
import { createRef } from 'react';
import { I18nextProvider } from 'react-i18next';

import UINotificationContent from '@/components/ui-notification-content';
import type { NotificationView } from '@/lib/notifications/types/notification-view';
import createContentI18n from '@tests/unit/utils/create-notification-content-locale-i18n';
import findSvg from '@tests/unit/utils/find-svg';

const MESSAGE = 'Зміни збережено';

const withLocale = (locale: 'uk' | 'en'): ((props: { children: ReactNode }) => JSX.Element) => {
  function LocaleWrapper({ children }: { children: ReactNode }): JSX.Element {
    return <I18nextProvider i18n={createContentI18n(locale)}>{children}</I18nextProvider>;
  }

  return LocaleWrapper;
};

const view = (overrides: Partial<NotificationView> = {}): NotificationView => ({
  id: '7',
  kind: 'success',
  message: MESSAGE,
  ...overrides,
});

describe('UINotificationContent', () => {
  it('draws the message in the dark text colour with a hidden icon', () => {
    const { container } = render(<UINotificationContent view={view()} onClose={jest.fn()} />, {
      wrapper: withLocale('uk'),
    });

    expect(screen.getByText(MESSAGE)).toHaveStyle({ color: 'rgb(26, 28, 30)' });
    expect(findSvg(container)).toHaveAttribute('aria-hidden', 'true');
  });

  it.each([
    ['uk', 'Закрити сповіщення'],
    ['en', 'Close notification'],
  ] as const)('names the close button in %s and describes it by the message', (locale, name) => {
    render(<UINotificationContent view={view()} onClose={jest.fn()} />, {
      wrapper: withLocale(locale),
    });

    const close = screen.getByRole('button', { name });

    expect(close).toHaveAccessibleDescription(MESSAGE);
  });

  it('hands the view id to the close handler once and exposes closeRef', async () => {
    const onClose = jest.fn();
    const closeRef = createRef<HTMLButtonElement>();
    render(
      <UINotificationContent view={view({ id: '42' })} onClose={onClose} closeRef={closeRef} />,
      {
        wrapper: withLocale('uk'),
      }
    );

    await userEvent.click(screen.getByRole('button', { name: 'Закрити сповіщення' }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledWith('42');
    expect(closeRef.current).toBe(screen.getByRole('button', { name: 'Закрити сповіщення' }));
  });

  describe('action', () => {
    const errorView = (onActivate: () => void): NotificationView =>
      view({ kind: 'error', action: { label: 'Повторити', onActivate } });

    it.each([
      [
        'a click',
        async (): Promise<void> =>
          userEvent.click(screen.getByRole('button', { name: 'Повторити' })),
      ],
      [
        'Enter',
        async (): Promise<void> => {
          screen.getByRole('button', { name: 'Повторити' }).focus();
          await userEvent.keyboard('{Enter}');
        },
      ],
      [
        'Space',
        async (): Promise<void> => {
          screen.getByRole('button', { name: 'Повторити' }).focus();
          await userEvent.keyboard(' ');
        },
      ],
    ])('runs the action handler once on %s', async (_label, activate) => {
      const onActivate = jest.fn();
      render(<UINotificationContent view={errorView(onActivate)} onClose={jest.fn()} />, {
        wrapper: withLocale('uk'),
      });

      await activate();

      expect(onActivate).toHaveBeenCalledTimes(1);
    });

    it('draws the action as an underlined dark text button, never the link blue', () => {
      render(<UINotificationContent view={errorView(jest.fn())} onClose={jest.fn()} />, {
        wrapper: withLocale('uk'),
      });

      const button = screen.getByRole('button', { name: 'Повторити' });

      expect(button).toHaveStyle({ color: 'rgb(26, 28, 30)', textDecoration: 'underline' });
      expect(button).not.toHaveStyle({ color: '#0074B5' });
    });

    it('draws no action without one', () => {
      render(<UINotificationContent view={view()} onClose={jest.fn()} />, {
        wrapper: withLocale('uk'),
      });

      expect(screen.getAllByRole('button')).toHaveLength(1);
    });
  });

  describe('time', () => {
    it('shows the time as visible text outside any live region', () => {
      render(<UINotificationContent view={view({ time: '10:15' })} onClose={jest.fn()} />, {
        wrapper: withLocale('uk'),
      });

      expect(screen.getByText('10:15')).toBeVisible();
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('renders nothing for a missing time', () => {
      const { container } = render(<UINotificationContent view={view()} onClose={jest.fn()} />, {
        wrapper: withLocale('uk'),
      });

      expect(container).toHaveTextContent(new RegExp(`^${MESSAGE}$`));
    });
  });

  it('carries no role, aria-live or aria-atomic in any state', () => {
    const { container } = render(
      <UINotificationContent
        view={view({ time: '10:15', action: { label: 'Повторити', onActivate: jest.fn() } })}
        onClose={jest.fn()}
      />,
      { wrapper: withLocale('uk') }
    );

    expect(container.innerHTML).not.toMatch(/\brole=/);
    expect(container.innerHTML).not.toMatch(/aria-live/);
    expect(container.innerHTML).not.toMatch(/aria-atomic/);
  });

  it('draws the message semi-bold', () => {
    render(<UINotificationContent view={view()} onClose={jest.fn()} />, {
      wrapper: withLocale('uk'),
    });

    expect(screen.getByText(MESSAGE)).toHaveStyle({ fontWeight: '600' });
  });
});
