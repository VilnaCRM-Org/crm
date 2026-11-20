import '@testing-library/jest-dom';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type JSX, useRef } from 'react';
import { I18nextProvider } from 'react-i18next';

import UIBellNotice from '@/components/ui-bell-notice';
import type {
  NotificationView,
  NotificationViewSet,
} from '@/lib/notifications/types/notification-view';
import createToastLocaleI18n from '@tests/unit/utils/create-toast-locale-i18n';

const root = document.documentElement;

const row = (id: string, overrides: Partial<NotificationView> = {}): NotificationView => ({
  id,
  kind: 'success',
  message: `Рядок ${id}`,
  time: '10 листопада, 09:15',
  ...overrides,
});

const set = (...items: NotificationView[]): NotificationViewSet => ({ items });

interface HostProps {
  readonly views: NotificationViewSet;
  readonly onDismiss?: (id: string) => void;
}

function Host({ views, onDismiss = jest.fn() }: HostProps): JSX.Element {
  const bell = useRef<HTMLButtonElement>(null);
  const save = useRef<HTMLButtonElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);

  return (
    <I18nextProvider i18n={createToastLocaleI18n('uk', ['en'])}>
      <h1 tabIndex={-1} ref={heading}>
        Налаштування
      </h1>
      <button type="button" ref={bell}>
        Сповіщення
      </button>
      <UIBellNotice
        views={views}
        bellRef={bell}
        returnFocusRef={save}
        fallbackFocusRef={heading}
        onDismiss={onDismiss}
      />
      <button type="button" ref={save}>
        Зберегти
      </button>
    </I18nextProvider>
  );
}

const focus = (element: HTMLElement | undefined): void => {
  act(() => element?.focus());
};

const closeButtons = (): HTMLElement[] =>
  screen.getAllByRole('button', { name: 'Закрити сповіщення' });

describe('UIBellNotice', () => {
  afterEach(() => {
    jest.useRealTimers();
    root.removeAttribute('style');
  });

  it('lists the rows in order, newest last, each with a time and a close button', () => {
    render(<Host views={set(row('one'), row('two'), row('three'))} />);

    expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'Рядок one10 листопада, 09:15',
      'Рядок two10 листопада, 09:15',
      'Рядок three10 листопада, 09:15',
    ]);
    expect(closeButtons()).toHaveLength(3);
    expect(screen.getAllByText('10 листопада, 09:15')).toHaveLength(3);
  });

  it('shows only the newest three rows of a longer batch', () => {
    render(<Host views={set(row('one'), row('two'), row('three'), row('four'))} />);

    expect(screen.queryByText('Рядок one')).not.toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getByText('Рядок four')).toBeInTheDocument();
  });

  it.each([
    ['success', [row('one')], '#2E7D32'],
    ['error', [row('one'), row('two', { kind: 'error' })], '#DC3939'],
  ] as const)('takes the %s tone of the most severe row', (_name, rows, edge) => {
    render(<Host views={set(...rows)} />);
    const outer = screen
      .getAllByRole('generic')
      .find((node) => getComputedStyle(node).getPropertyValue('--bell-notice-tone') !== '');

    expect(getComputedStyle(outer as HTMLElement).getPropertyValue('--bell-notice-tone')).toBe(
      edge
    );
  });

  it('carries no role, aria-live or aria-atomic, so the time is never announced', () => {
    render(<Host views={set(row('one'), row('two', { kind: 'error' }))} />);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(document.body.innerHTML).not.toMatch(/aria-live|aria-atomic|role=/);
  });

  it('closes a row from the keyboard and focuses the next close button', async () => {
    const onDismiss = jest.fn();
    render(<Host views={set(row('one'), row('two'), row('three'))} onDismiss={onDismiss} />);
    const [, middle, last] = closeButtons();
    focus(middle);

    await userEvent.keyboard('{Enter}');

    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledWith('two');
    expect(last).toHaveFocus();
  });

  it('falls back to the previous close button, then the Save target', async () => {
    const onDismiss = jest.fn();
    const { rerender } = render(<Host views={set(row('one'), row('two'))} onDismiss={onDismiss} />);
    focus(closeButtons()[1]);
    await userEvent.keyboard('{Enter}');
    expect(closeButtons()[0]).toHaveFocus();

    rerender(<Host views={set(row('one'))} onDismiss={onDismiss} />);
    await userEvent.keyboard('{Enter}');
    expect(screen.getByRole('button', { name: 'Зберегти' })).toHaveFocus();
  });

  it('moves focus to the h1 when the Save target is disabled', async () => {
    render(<Host views={set(row('one'))} />);
    const save = screen.getByRole('button', { name: 'Зберегти' });
    save.setAttribute('disabled', '');
    focus(closeButtons()[0]);

    await userEvent.keyboard('{Enter}');

    expect(screen.getByRole('heading', { name: 'Налаштування' })).toHaveFocus();
  });

  it('sets the page properties while shown and removes them when it hides', () => {
    const { rerender } = render(<Host views={set(row('one'))} />);

    expect(root.style.getPropertyValue('--app-top-overhang')).not.toBe('');
    expect(root.style.getPropertyValue('--bell-centre-x')).not.toBe('');

    rerender(<Host views={set()} />);

    expect(root.style.getPropertyValue('--app-top-overhang')).toBe('');
    expect(root.style.getPropertyValue('--bell-centre-x')).toBe('');
  });

  it('renders nothing for an empty batch', () => {
    render(<Host views={set()} />);

    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('keeps every row shown after ten minutes', () => {
    jest.useFakeTimers();
    render(<Host views={set(row('one'), row('two'))} />);

    act(() => {
      jest.advanceTimersByTime(10 * 60 * 1000);
    });

    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('runs the retry handler of an error row once', async () => {
    const onActivate = jest.fn();
    render(
      <Host
        views={set(row('one', { kind: 'error', action: { label: 'Повторити', onActivate } }))}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: 'Повторити' }));

    expect(onActivate).toHaveBeenCalledTimes(1);
  });
});
