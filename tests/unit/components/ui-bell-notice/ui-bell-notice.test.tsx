import '@testing-library/jest-dom';
import { act, render, screen, waitFor, within } from '@testing-library/react';
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
  const save = useRef<HTMLButtonElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);

  return (
    <I18nextProvider i18n={createToastLocaleI18n('uk', ['en'])}>
      <h1 tabIndex={-1} ref={heading}>
        Налаштування
      </h1>
      <button type="button">Сповіщення</button>
      <UIBellNotice
        views={views}
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

  it('clears the header while shown and leaves the bell position to its owner', () => {
    root.style.setProperty('--bell-centre-x', '1111px');
    root.style.setProperty('--bell-bottom', '56px');
    const { rerender } = render(<Host views={set(row('one'))} />);

    expect(root.style.getPropertyValue('--app-top-overhang')).not.toBe('');

    rerender(<Host views={set()} />);

    expect(root.style.getPropertyValue('--app-top-overhang')).toBe('');
    expect(root.style.getPropertyValue('--bell-centre-x')).toBe('1111px');
    expect(root.style.getPropertyValue('--bell-bottom')).toBe('56px');
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

describe('UIBellNotice when a focused row leaves without being closed', () => {
  const focusedRow = (): string | undefined =>
    screen
      .getAllByRole('listitem')
      .find((item) =>
        within(item).getByRole('button', { name: 'Закрити сповіщення' }).matches(':focus')
      )?.textContent ?? undefined;

  it('follows the rows shown at the time, not the rows of the first render', () => {
    const { rerender } = render(<Host views={set(row('one'))} />);
    rerender(<Host views={set(row('one'), row('two'))} />);
    focus(closeButtons()[1]);

    rerender(<Host views={set(row('one'))} />);

    expect(focusedRow()).toContain('Рядок one');
  });

  it('moves focus to the new oldest row when a fourth outcome evicts the focused one', () => {
    const { rerender } = render(<Host views={set(row('one'), row('two'), row('three'))} />);
    focus(closeButtons()[0]);

    rerender(<Host views={set(row('one'), row('two'), row('three'), row('four'))} />);

    expect(closeButtons()[0]).toHaveFocus();
    expect(focusedRow()).toContain('Рядок two');
  });

  it('moves focus to the next row when a focused middle row expires', () => {
    const { rerender } = render(<Host views={set(row('one'), row('two'), row('three'))} />);
    focus(closeButtons()[1]);

    rerender(<Host views={set(row('one'), row('three'))} />);

    expect(focusedRow()).toContain('Рядок three');
  });

  it('moves focus to the previous row when the focused last row expires', () => {
    const { rerender } = render(<Host views={set(row('one'), row('two'), row('three'))} />);
    focus(closeButtons()[2]);

    rerender(<Host views={set(row('one'), row('two'))} />);

    expect(focusedRow()).toContain('Рядок two');
  });

  it('ends on the next surviving row when several rows leave in one commit', () => {
    const { rerender } = render(<Host views={set(row('one'), row('two'), row('three'))} />);
    focus(closeButtons()[0]);

    rerender(<Host views={set(row('three'), row('four'), row('five'))} />);

    expect(focusedRow()).toContain('Рядок three');
  });

  it('moves focus to the Save target when the card empties', () => {
    const { rerender } = render(<Host views={set(row('one'), row('two'))} />);
    focus(closeButtons()[1]);

    rerender(<Host views={set()} />);

    expect(screen.getByRole('button', { name: 'Зберегти' })).toHaveFocus();
  });

  it('moves focus to the h1 when the card empties and the Save target is disabled', () => {
    const { rerender } = render(<Host views={set(row('one'))} />);
    screen.getByRole('button', { name: 'Зберегти' }).setAttribute('disabled', '');
    focus(closeButtons()[0]);

    rerender(<Host views={set()} />);

    expect(screen.getByRole('heading', { name: 'Налаштування' })).toHaveFocus();
  });

  it('leaves focus alone when it is outside the card', () => {
    const { rerender } = render(<Host views={set(row('one'), row('two'), row('three'))} />);
    const bell = screen.getByRole('button', { name: 'Сповіщення' });
    focus(bell);

    rerender(<Host views={set(row('two'), row('three'), row('four'))} />);

    expect(bell).toHaveFocus();
  });

  it('keeps focus on its row when the same rows render again', async () => {
    const rows = set(row('one'), row('two'), row('three'));
    const { rerender } = render(<Host views={rows} />);
    const [, middle] = closeButtons();
    focus(middle);

    rerender(<Host views={set(...rows.items)} />);

    await waitFor(() => expect(middle).toHaveFocus());
    expect(focusedRow()).toContain('Рядок two');
  });

  it('moves focus once on close, so the row leaving later does not move it again', async () => {
    const { rerender } = render(<Host views={set(row('one'), row('two'), row('three'))} />);
    focus(closeButtons()[0]);
    await userEvent.keyboard('{Enter}');

    rerender(<Host views={set(row('two'), row('three'))} />);

    expect(focusedRow()).toContain('Рядок two');
  });
});
