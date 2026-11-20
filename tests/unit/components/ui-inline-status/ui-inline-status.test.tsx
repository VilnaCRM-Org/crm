import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';

import UIInlineStatus from '@/components/ui-inline-status';
import type {
  NotificationView,
  NotificationViewSet,
} from '@/lib/notifications/types/notification-view';

const view = (id: string, overrides: Partial<NotificationView> = {}): NotificationView => ({
  id,
  kind: 'success',
  message: `Повідомлення ${id}`,
  ...overrides,
});

const views = (...items: NotificationView[]): NotificationViewSet => ({ items });

const block = (message: string): HTMLElement => {
  const candidates = screen
    .getAllByRole('generic')
    .filter((node) => node.tagName === 'DIV' && node.textContent?.includes(message));
  return candidates[candidates.length - 2] as HTMLElement;
};

describe('UIInlineStatus', () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = jest.fn();
  });

  it('lists the lines in the order given with no close button', () => {
    render(<UIInlineStatus views={views(view('name'), view('email'), view('password'))} />);

    expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'Повідомлення name',
      'Повідомлення email',
      'Повідомлення password',
    ]);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('uses the success tone when every line succeeded', () => {
    render(<UIInlineStatus views={views(view('1'), view('2'))} />);

    expect(block('Повідомлення 1')).toHaveStyle({ backgroundColor: '#E8F4EF' });
  });

  it('uses the error tone as soon as one line failed', () => {
    render(<UIInlineStatus views={views(view('1'), view('2', { kind: 'error' }), view('3'))} />);

    expect(block('Повідомлення 1')).toHaveStyle({ backgroundColor: '#FDECEC' });
  });

  it('uses the error tone for a single error line', () => {
    render(<UIInlineStatus views={views(view('1', { kind: 'error' }))} />);

    expect(block('Повідомлення 1')).toHaveStyle({ backgroundColor: '#FDECEC' });
  });

  it('sits 16 px below the action row by default and 8 px for the e-mail placement', () => {
    const { rerender } = render(<UIInlineStatus views={views(view('1'))} />);

    expect(block('Повідомлення 1')).toHaveStyle({ marginTop: '1rem' });

    rerender(<UIInlineStatus views={views(view('1'))} placement="email" />);

    expect(block('Повідомлення 1')).toHaveStyle({ marginTop: '0.5rem' });
  });

  it('runs the retry handler of a transient error line once', async () => {
    const onActivate = jest.fn();
    render(
      <UIInlineStatus
        views={views(view('1', { kind: 'error', action: { label: 'Повторити', onActivate } }))}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: 'Повторити' }));

    expect(onActivate).toHaveBeenCalledTimes(1);
  });

  it('carries no role, aria-live or aria-atomic', () => {
    render(<UIInlineStatus views={views(view('1'), view('2', { kind: 'error' }))} />);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(block('Повідомлення 1')).not.toHaveAttribute('role');
    expect(document.body.innerHTML).not.toMatch(/aria-live|aria-atomic|role=/);
  });

  it('stays shown after ten minutes', () => {
    jest.useFakeTimers();
    render(<UIInlineStatus views={views(view('1'))} />);

    act(() => {
      jest.advanceTimersByTime(10 * 60 * 1000);
    });

    expect(screen.getByText('Повідомлення 1')).toBeInTheDocument();
    jest.useRealTimers();
  });

  it('renders nothing for an empty batch', () => {
    const { container } = render(<UIInlineStatus views={views()} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('reveals itself through the viewport check on mount', () => {
    jest.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
      top: 900,
      bottom: 1000,
    } as DOMRect);
    render(<UIInlineStatus views={views(view('1'))} />);

    expect(Element.prototype.scrollIntoView).toHaveBeenCalledTimes(1);
  });
});
