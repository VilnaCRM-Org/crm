import '@testing-library/jest-dom';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { JSX, ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

import type { ToastItem } from '@/components/types/ui-toast';
import UIToast from '@/components/ui-toast/ui-toast';
import createLocaleI18n from '@tests/unit/utils/create-locale-i18n';

const ukWrapper = ({ children }: { children: ReactNode }): JSX.Element => (
  <I18nextProvider i18n={createLocaleI18n('uk', ['en'])}>{children}</I18nextProvider>
);

const buildToast = (overrides: Partial<ToastItem> = {}): ToastItem => ({
  id: 7,
  tone: 'success',
  message: 'Зміни збережено',
  ...overrides,
});

const toastRoot = (message: string): HTMLElement => {
  const candidates = screen
    .getAllByRole('generic')
    .filter((node) => node.tagName === 'DIV' && node.textContent?.includes(message));
  return candidates[candidates.length - 1] as HTMLElement;
};

const closeButton = (): HTMLElement => screen.getByRole('button', { name: 'Закрити сповіщення' });

describe('UIToast', () => {
  it('shows a success toast without a role, on the success surface in the dark text', () => {
    render(<UIToast toast={buildToast()} onDismiss={jest.fn()} />, { wrapper: ukWrapper });

    const toast = toastRoot('Зміни збережено');

    expect(toast).not.toHaveAttribute('role');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(toast).toHaveStyle({ backgroundColor: '#E8F4EF', color: '#1A1C1E' });
  });

  it('shows an error toast without a role, on the error surface in the dark text', () => {
    render(
      <UIToast
        toast={buildToast({ tone: 'error', message: 'Не вдалося' })}
        onDismiss={jest.fn()}
      />,
      {
        wrapper: ukWrapper,
      }
    );

    const toast = toastRoot('Не вдалося');

    expect(toast).not.toHaveAttribute('role');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(toast).toHaveStyle({ backgroundColor: '#FDECEC', color: '#1A1C1E' });
  });

  it('describes each close button by the message of its own toast', () => {
    render(
      <>
        <UIToast toast={buildToast({ id: 1, message: 'Перше' })} onDismiss={jest.fn()} />
        <UIToast toast={buildToast({ id: 2, message: 'Друге' })} onDismiss={jest.fn()} />
      </>,
      { wrapper: ukWrapper }
    );

    const [first, second] = screen.getAllByRole('button', { name: 'Закрити сповіщення' });

    expect(first).toHaveAccessibleDescription('Перше');
    expect(second).toHaveAccessibleDescription('Друге');
    expect(first?.getAttribute('aria-describedby')).toBe(screen.getByText('Перше').id);
  });

  it.each([
    ['success', '#2E7D32', 'M7.5 12L10.5 15L16.5 9'],
    ['error', '#DC3939', 'M12 8V12M12 16H12.01'],
  ] as const)('draws the %s icon in %s, hidden from assistive technology', (tone, color, path) => {
    render(<UIToast toast={buildToast({ tone })} onDismiss={jest.fn()} />, { wrapper: ukWrapper });

    const holder = within(toastRoot('Зміни збережено')).getAllByRole('generic')[0] as HTMLElement;

    expect(holder).toHaveStyle({ color });
    expect(holder.innerHTML).toContain('aria-hidden="true"');
    expect(holder.innerHTML).toContain(`d="${path}`);
  });

  it('names the close button in Ukrainian and in English', () => {
    const { unmount } = render(<UIToast toast={buildToast()} onDismiss={jest.fn()} />, {
      wrapper: ukWrapper,
    });
    expect(closeButton()).toBeInTheDocument();
    unmount();

    render(
      <I18nextProvider i18n={createLocaleI18n('en')}>
        <UIToast toast={buildToast()} onDismiss={jest.fn()} />
      </I18nextProvider>
    );

    expect(screen.getByRole('button', { name: 'Close notification' })).toBeInTheDocument();
  });

  it('draws the close icon in the dark text colour', () => {
    render(<UIToast toast={buildToast()} onDismiss={jest.fn()} />, { wrapper: ukWrapper });

    expect(closeButton()).toHaveStyle({ color: '#1A1C1E' });
    expect(within(closeButton()).queryByText(/./)).not.toBeInTheDocument();
  });

  it('dismisses the toast by its id when the close button is clicked', async () => {
    const onDismiss = jest.fn();
    render(<UIToast toast={buildToast({ id: 42 })} onDismiss={onDismiss} />, {
      wrapper: ukWrapper,
    });

    await userEvent.click(closeButton());

    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledWith(42);
  });

  it('dismisses by the current id through the current callback after a re-render', async () => {
    const first = jest.fn();
    const second = jest.fn();
    const { rerender } = render(<UIToast toast={buildToast({ id: 1 })} onDismiss={first} />, {
      wrapper: ukWrapper,
    });

    rerender(<UIToast toast={buildToast({ id: 2 })} onDismiss={second} />);
    await userEvent.click(closeButton());

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith(2);
  });

  it('renders no action button when the draft has no action', () => {
    render(<UIToast toast={buildToast()} onDismiss={jest.fn()} />, { wrapper: ukWrapper });

    expect(screen.getAllByRole('button')).toHaveLength(1);
  });

  describe('action', () => {
    const renderWithAction = (): { onDismiss: jest.Mock; onActivate: jest.Mock } => {
      const onDismiss = jest.fn();
      const onActivate = jest.fn();
      render(
        <UIToast
          toast={buildToast({ id: 3, action: { label: 'Повторити', onActivate } })}
          onDismiss={onDismiss}
        />,
        { wrapper: ukWrapper }
      );
      return { onDismiss, onActivate };
    };

    it('is an underlined text button in the dark text colour, never the link colour', () => {
      renderWithAction();

      const action = screen.getByRole('button', { name: 'Повторити' });

      expect(action).toHaveStyle({ textDecoration: 'underline', color: '#1A1C1E' });
      expect(action).not.toHaveStyle({ color: '#0074B5' });
    });

    it('removes the toast and runs onActivate once on a click', async () => {
      const { onDismiss, onActivate } = renderWithAction();

      await userEvent.click(screen.getByRole('button', { name: 'Повторити' }));

      expect(onDismiss).toHaveBeenCalledTimes(1);
      expect(onDismiss).toHaveBeenCalledWith(3);
      expect(onActivate).toHaveBeenCalledTimes(1);
    });

    it('runs the current action and dismissal after a re-render', async () => {
      const staleDismiss = jest.fn();
      const staleActivate = jest.fn();
      const onDismiss = jest.fn();
      const onActivate = jest.fn();
      const toastWith = (id: number, activate: jest.Mock): ToastItem =>
        buildToast({ id, action: { label: 'Повторити', onActivate: activate } });
      const { rerender } = render(
        <UIToast toast={toastWith(3, staleActivate)} onDismiss={staleDismiss} />,
        { wrapper: ukWrapper }
      );

      rerender(<UIToast toast={toastWith(4, onActivate)} onDismiss={onDismiss} />);
      await userEvent.click(screen.getByRole('button', { name: 'Повторити' }));

      expect(staleDismiss).not.toHaveBeenCalled();
      expect(staleActivate).not.toHaveBeenCalled();
      expect(onDismiss).toHaveBeenCalledWith(4);
      expect(onActivate).toHaveBeenCalledTimes(1);
    });

    it.each(['{Enter}', ' '])('removes the toast and runs onActivate once on %j', async (key) => {
      const { onDismiss, onActivate } = renderWithAction();
      screen.getByRole('button', { name: 'Повторити' }).focus();

      await userEvent.keyboard(key);

      expect(onDismiss).toHaveBeenCalledTimes(1);
      expect(onActivate).toHaveBeenCalledTimes(1);
    });
  });
});
