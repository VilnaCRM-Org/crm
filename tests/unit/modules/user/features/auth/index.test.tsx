import { render, screen, waitFor } from '@testing-library/react';
import type { ReactElement } from 'react';

import Authentication from '@/modules/user/features/auth';

jest.mock('@/styles/theme', () => ({
  __esModule: true,
  default: {},
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

const mockFormSectionDefault = jest.fn((): never => {
  throw new Promise<void>(() => {
    // Keep pending to force the suspense fallback.
  });
});

jest.mock('@/modules/user/features/auth/components/form-section', () => ({
  __esModule: true,
  default: (): never => mockFormSectionDefault(),
}));

describe('Authentication shell', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    mockFormSectionDefault.mockReset();
    mockFormSectionDefault.mockImplementation((): never => {
      throw new Promise<void>(() => {
        // Keep pending to force the suspense fallback.
      });
    });
  });

  it('keeps the header and footer visible while the form section is loading', () => {
    render(<Authentication />);

    expect(screen.getByTestId('auth-shell-header')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByTestId('auth-shell-skeleton')).toBeInTheDocument();
    expect(screen.getByTestId('auth-shell-footer')).toBeInTheDocument();
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
