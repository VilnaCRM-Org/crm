import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComponentProps } from 'react';

import AuthErrorBoundary from '@/modules/User/features/Auth/components/auth-error-boundary';

jest.mock('react-i18next', () => ({
  useTranslation: (): { t: (key: string) => string } => ({
    t: (key: string): string =>
      (
        {
          'auth.error.default': 'Something went wrong. Please try again later.',
          'auth.error.details': 'Error Details',
          'auth.error.tryAgain': 'Try again',
        } as Record<string, string>
      )[key] ?? key,
  }),
}));

function ThrowingChild({ shouldThrow }: { shouldThrow: boolean }): JSX.Element {
  if (shouldThrow) throw new Error('test error');
  return <div data-testid="child">OK</div>;
}

function renderWithBoundary(
  props: Partial<ComponentProps<typeof AuthErrorBoundary>> = {},
  shouldThrow = true
): ReturnType<typeof render> {
  const { fallback, onError } = props;
  return render(
    <AuthErrorBoundary fallback={fallback} onError={onError}>
      <ThrowingChild shouldThrow={shouldThrow} />
    </AuthErrorBoundary>
  );
}

describe('AuthErrorBoundary', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders children when no error occurs', () => {
    renderWithBoundary({}, false);
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('renders default fallback when a child throws', () => {
    renderWithBoundary();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Something went wrong. Please try again later.'
    );
  });

  it('renders custom ReactNode fallback', () => {
    renderWithBoundary({ fallback: <span>Custom fallback</span> });
    expect(screen.getByRole('alert')).toHaveTextContent('Custom fallback');
  });

  it('calls function fallback with error and reset', () => {
    const fallbackFn = jest.fn(({ error }: { error?: Error }) => <span>{error?.message}</span>);

    renderWithBoundary({ fallback: fallbackFn });

    expect(fallbackFn).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.any(Error),
        reset: expect.any(Function),
      })
    );
    expect(screen.getByRole('alert')).toHaveTextContent('test error');
  });

  it('calls onError prop when provided', () => {
    const mockOnError = jest.fn();
    renderWithBoundary({ onError: mockOnError });

    expect(mockOnError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ componentStack: expect.any(String) })
    );
  });

  it('resets error state when "Try again" is clicked', async () => {
    let shouldThrow = true;

    const { rerender } = render(
      <AuthErrorBoundary>
        <ThrowingChild shouldThrow={shouldThrow} />
      </AuthErrorBoundary>
    );

    expect(screen.getByTestId('auth-error-boundary-fallback')).toBeInTheDocument();

    shouldThrow = false;
    rerender(
      <AuthErrorBoundary>
        <ThrowingChild shouldThrow={shouldThrow} />
      </AuthErrorBoundary>
    );

    await userEvent.click(screen.getByTestId('auth-error-boundary-try-again'));

    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('shows error details in test mode', () => {
    renderWithBoundary();

    expect(screen.getByText('Error Details')).toBeInTheDocument();
    expect(screen.getByText('test error')).toBeInTheDocument();
  });
});
