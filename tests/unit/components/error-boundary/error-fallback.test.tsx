// @jest-environment jsdom

import '@tests/unit/utils/setup-bun-dom';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import ErrorFallback from '@/components/error-boundary/error-fallback';

describe('ErrorFallback', () => {
  const resetMock = jest.fn();

  afterEach(() => {
    resetMock.mockReset();
  });

  it('renders heading and reset button without a ThemeProvider or I18nextProvider (AC1)', () => {
    render(<ErrorFallback reset={resetMock} />);

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('announces the failure via an alert region inside a main landmark (AR1, AR17)', () => {
    render(<ErrorFallback reset={resetMock} />);

    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(/unexpected error occurred/i);
  });

  it('moves focus to the h1 on mount (AC3)', async () => {
    render(<ErrorFallback reset={resetMock} />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1 })).toHaveFocus();
    });
  });

  it('h1 has tabIndex=-1 to be programmatically focusable (AR5)', () => {
    render(<ErrorFallback reset={resetMock} />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveAttribute('tabindex', '-1');
  });

  it('calls reset() when the reset button is clicked (AC4)', () => {
    render(<ErrorFallback reset={resetMock} />);

    fireEvent.click(screen.getByRole('button', { name: /try again/i }));

    expect(resetMock).toHaveBeenCalledTimes(1);
  });

  it('does not render <details> diagnostics in production (AC5)', () => {
    const originalEnv = process.env.NODE_ENV;
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', configurable: true });

    try {
      render(<ErrorFallback error={new Error('boom')} reset={resetMock} />);

      expect(screen.queryByRole('group')).not.toBeInTheDocument();
    } finally {
      Object.defineProperty(process.env, 'NODE_ENV', { value: originalEnv, configurable: true });
    }
  });

  it('renders error.message inside a disclosure widget in test/dev environment (AC5)', () => {
    render(<ErrorFallback error={new Error('boom-message')} reset={resetMock} />);

    expect(screen.getByText('boom-message')).toBeInTheDocument();
  });

  it('does not render error details when no error is provided', () => {
    render(<ErrorFallback reset={resetMock} />);

    expect(screen.queryByText(/error details/i)).not.toBeInTheDocument();
  });

  it('renders the heading with dark text color for contrast compliance (AR11)', () => {
    render(<ErrorFallback reset={resetMock} />);

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveStyle({ color: '#1A1C1E' });
  });

  it('reset button has explicit focus indicator outline for WCAG 2.4.11 (AR WCAG)', () => {
    render(<ErrorFallback reset={resetMock} />);

    const button = screen.getByRole('button', { name: /try again/i });
    expect(button).toHaveStyle({ outline: '3px solid #005FCC' });
  });
});
