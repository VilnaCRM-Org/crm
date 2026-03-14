import { render, screen, waitFor } from '@testing-library/react';
import type { ReactElement } from 'react';

import Authentication from '@/modules/User/features/Auth';

jest.mock('@/styles/theme', () => ({
  __esModule: true,
  default: {},
}));

jest.mock('@/modules/BackToMain', () => ({
  __esModule: true,
  default: (): ReactElement => <div data-testid="auth-shell-header" />,
}));

jest.mock('@/components/UIFooter', () => ({
  __esModule: true,
  default: (): ReactElement => <div data-testid="auth-shell-footer" />,
}));

jest.mock('@/components/Skeletons/AuthSkeleton', () => ({
  __esModule: true,
  default: (): ReactElement => <div data-testid="auth-shell-skeleton" />,
}));

const mockFormSectionDefault = jest.fn((): never => {
  throw new Promise<void>((): void => {
    // keep pending to force suspense fallback
  });
});

jest.mock('@/modules/User/features/Auth/components/FormSection', () => ({
  __esModule: true,
  default: (): never => mockFormSectionDefault(),
}));

describe('Authentication shell', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    mockFormSectionDefault.mockReset();
    mockFormSectionDefault.mockImplementation((): never => {
      throw new Promise<void>((): void => {
        // keep pending to force suspense fallback
      });
    });
  });

  it('keeps header and footer visible while form section is loading', () => {
    render(<Authentication />);

    expect(screen.getByTestId('auth-shell-header')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByTestId('auth-shell-skeleton')).toBeInTheDocument();
    expect(screen.getByTestId('auth-shell-footer')).toBeInTheDocument();
  });

  it('shows error boundary fallback when FormSection throws synchronously', async () => {
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
