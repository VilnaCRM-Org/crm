import { render, screen, waitFor } from '@testing-library/react';
import type { ReactElement } from 'react';
import { I18nextProvider } from 'react-i18next';

import localization from '@/i18n/localization.json';
import AuthPageLayout from '@/modules/user/features/auth/components/auth-page-layout';
import testI18n from '@tests/i18n/test-i18n';

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
  afterEach(() => {
    jest.restoreAllMocks();
  });

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
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    render(
      <I18nextProvider i18n={testI18n}>
        <AuthPageLayout>
          <ThrowingChild />
        </AuthPageLayout>
      </I18nextProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        localization.en.translation.auth.error.default
      );
    });
    expect(consoleError).toHaveBeenCalledWith(
      'AuthErrorBoundary caught an error:',
      expect.objectContaining({ message: 'test chunk-load error' }),
      expect.objectContaining({ componentStack: expect.any(String) })
    );
  });
});
