// @jest-environment jsdom

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { Component, Suspense, type ReactElement, type ReactNode } from 'react';

import ROUTE_PATHS from '@/routes/route-paths';
import authRoutes from '@auth/routes';
import SignIn from '@auth/routes/sign-in';

const mockLoadSignInFormSection = jest.fn();

jest.mock('@auth/routes/sign-in/form-section-loader', () => ({
  __esModule: true,
  default: {
    load: (): unknown => mockLoadSignInFormSection(),
  },
}));

jest.mock('@auth/components/auth-page-layout', () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }): ReactElement => <>{children}</>,
}));

jest.mock('@auth/hooks/use-page-title', () => ({
  __esModule: true,
  default: (): void => undefined,
}));

jest.mock('@auth/hooks/use-post-login-redirect', () => ({
  __esModule: true,
  default: (): void => undefined,
}));

class LazyErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  public override state: { error: Error | null } = { error: null };

  public static getDerivedStateFromError(error: Error): { error: Error } {
    return { error };
  }

  public override render(): ReactNode {
    return this.state.error ? <p>{this.state.error.message}</p> : this.props.children;
  }
}

describe('sign-in form-section lazy loading', () => {
  beforeEach(() => {
    mockLoadSignInFormSection.mockReset();
  });

  it('loads the sign-in page without executing the form loader before render', async () => {
    const signInRoute = authRoutes.routes.find((route) => route.path === ROUTE_PATHS.signIn);
    expect(signInRoute).toBeDefined();
    if (!signInRoute) {
      throw new Error('Sign-in route is missing');
    }

    const pageModule = await signInRoute.load();

    expect(mockLoadSignInFormSection).not.toHaveBeenCalled();
    expect(pageModule.default).toBeDefined();
  });

  it('does not execute the sign-in form loader when loading sign-up', async () => {
    const signUpRoute = authRoutes.routes.find((route) => route.path === ROUTE_PATHS.signUp);
    expect(signUpRoute).toBeDefined();
    if (!signUpRoute) {
      throw new Error('Sign-up route is missing');
    }

    await signUpRoute.load();

    expect(mockLoadSignInFormSection).not.toHaveBeenCalled();
  });

  it('keeps a rejected form import visible to the lazy consumer', async () => {
    const error = new Error('sign-in form chunk failed');
    mockLoadSignInFormSection.mockReturnValue(Promise.reject(error));
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    render(
      <LazyErrorBoundary>
        <Suspense fallback={<p>loading</p>}>
          <SignIn />
        </Suspense>
      </LazyErrorBoundary>
    );

    expect(await screen.findByText(error.message)).toBeInTheDocument();
    expect(mockLoadSignInFormSection).toHaveBeenCalledTimes(1);
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
