import { render, screen, waitFor } from '@testing-library/react';
import type { ReactElement } from 'react';

import AuthPageLayout from '@/modules/user/features/auth/components/auth-page-layout';

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

jest.mock('@/components/skeletons/auth-skeleton', () => ({
  __esModule: true,
  default: (): ReactElement => <div data-testid="auth-shell-skeleton" />,
}));

function SuspendingChild(): ReactElement {
  throw new Promise<void>((): void => {
    // keep pending to force the suspense fallback
  });
}

function ThrowingChild(): ReactElement {
  throw new Error('test chunk-load error');
}

describe('AuthPageLayout', () => {
  it('renders the back link, main landmark, child, and footer (AC1)', () => {
    render(
      <AuthPageLayout>
        <div data-testid="page-child">child</div>
      </AuthPageLayout>
    );

    expect(screen.getByTestId('auth-shell-header')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByTestId('page-child')).toBeInTheDocument();
    expect(screen.getByTestId('auth-shell-footer')).toBeInTheDocument();
  });

  it('renders the AuthSkeleton fallback while the child suspends (AC2)', () => {
    render(
      <AuthPageLayout>
        <SuspendingChild />
      </AuthPageLayout>
    );

    expect(screen.getByTestId('auth-shell-skeleton')).toBeInTheDocument();
    expect(screen.getByTestId('auth-shell-header')).toBeInTheDocument();
    expect(screen.getByTestId('auth-shell-footer')).toBeInTheDocument();
  });

  it('renders the AuthErrorBoundary fallback when the child throws (AC3)', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <AuthPageLayout>
        <ThrowingChild />
      </AuthPageLayout>
    );

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });
});
