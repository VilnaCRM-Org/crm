import { render, screen, waitFor } from '@testing-library/react';
import type { ReactElement } from 'react';

import Authentication from '@/modules/user/features/auth';

jest.mock('@/styles/theme', () => ({
  __esModule: true,
  default: {},
}));

jest.mock('@/stores', () => ({
  __esModule: true,
  default: {
    getState: (): object => ({}),
    subscribe: (): (() => void) => () => undefined,
    dispatch: (): void => undefined,
  },
}));

jest.mock('@/components/ui-back-to-main', () => ({
  __esModule: true,
  default: (): ReactElement => <div data-testid="auth-shell-header" />,
}));

jest.mock('@/components/ui-footer', () => ({
  __esModule: true,
  default: (): ReactElement => <div data-testid="auth-shell-footer" />,
}));

jest.mock('@/modules/user/features/auth/components/auth-skeleton', () => ({
  __esModule: true,
  default: (): ReactElement => <div data-testid="auth-shell-skeleton" />,
}));

const mockFormSectionDefault = jest.fn(
  (): ReactElement => <div data-testid="auth-form-section" />
);

jest.mock('@/modules/user/features/auth/components/form-section', () => ({
  __esModule: true,
  default: (): ReactElement => mockFormSectionDefault(),
}));

describe('Authentication shell', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    mockFormSectionDefault.mockReset();
    mockFormSectionDefault.mockImplementation(
      (): ReactElement => <div data-testid="auth-form-section" />
    );
  });

  it('shows the auth skeleton while keeping the shell chrome visible', async () => {
    render(<Authentication />);

    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByTestId('auth-shell-header')).toBeInTheDocument();
    expect(screen.getByTestId('auth-shell-skeleton')).toBeInTheDocument();
    expect(screen.getByTestId('auth-shell-footer')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('auth-form-section')).toBeInTheDocument();
    });
  });

  it('shows the error boundary fallback when the form section throws synchronously', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    mockFormSectionDefault.mockImplementation((): never => {
      throw new Error('test sync error');
    });

    render(<Authentication />);

    await waitFor(() => {
      expect(screen.getByTestId('auth-error-boundary-fallback')).toBeInTheDocument();
    });
  });
});
