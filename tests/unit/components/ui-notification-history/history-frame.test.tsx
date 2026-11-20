import '@testing-library/jest-dom';
import { act, render, screen, within } from '@testing-library/react';
import { type JSX, lazy } from 'react';
import { I18nextProvider } from 'react-i18next';

import UINotificationHistoryFrame from '@/components/ui-notification-history/history-frame';
import createToastLocaleI18n from '@tests/unit/utils/create-toast-locale-i18n';

const Suspending = lazy(() => new Promise<{ default: () => JSX.Element }>(() => undefined));

function Frame({ open, children }: { open: boolean; children?: JSX.Element }): JSX.Element {
  return (
    <I18nextProvider i18n={createToastLocaleI18n('uk', ['en'])}>
      <button type="button" aria-controls="history" aria-expanded={open}>
        Сповіщення
      </button>
      <UINotificationHistoryFrame id="history" open={open}>
        {children}
      </UINotificationHistoryFrame>
    </I18nextProvider>
  );
}

const host = (): HTMLElement =>
  screen
    .getAllByRole('generic', { hidden: true })
    .find((node) => node.id === 'history') as HTMLElement;

describe('UINotificationHistoryFrame', () => {
  afterEach(() => jest.useRealTimers());

  it('renders the host with the given id and hidden while closed and empty', () => {
    render(<Frame open={false} />);

    expect(host()).toBeInTheDocument();
    expect(host()).toHaveAttribute('id', 'history');
    expect(host()).toHaveAttribute('hidden');
    expect(host()).not.toBeVisible();
  });

  it('drops hidden and shows its children when open', () => {
    render(
      <Frame open>
        <p>Вміст панелі</p>
      </Frame>
    );

    expect(host()).not.toHaveAttribute('hidden');
    expect(screen.getByText('Вміст панелі')).toBeVisible();
  });

  it('stays hidden with its children mounted while closed', () => {
    render(
      <Frame open={false}>
        <p>Вміст панелі</p>
      </Frame>
    );

    expect(host()).toHaveAttribute('hidden');
    expect(screen.getByText('Вміст панелі')).not.toBeVisible();
  });

  it('carries no role, aria-live or aria-atomic', () => {
    render(
      <Frame open>
        <p>Вміст панелі</p>
      </Frame>
    );

    expect(host()).not.toHaveAttribute('role');
    expect(host()).not.toHaveAttribute('aria-live');
    expect(host()).not.toHaveAttribute('aria-atomic');
  });

  it('shows the deferred route fallback inside the host while a child suspends', () => {
    jest.useFakeTimers();
    render(
      <Frame open>
        <Suspending />
      </Frame>
    );

    expect(within(host()).queryByText('Завантаження сторінки')).not.toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(150);
    });

    expect(within(host()).getByText('Завантаження сторінки')).toBeInTheDocument();
  });
});
