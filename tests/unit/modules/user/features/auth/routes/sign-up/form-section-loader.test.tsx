// @jest-environment jsdom

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { Component, Suspense, type ReactElement, type ReactNode } from 'react';

import ROUTE_PATHS from '@/routes/route-paths';
import authRoutes from '@auth/routes';
import SignUp from '@auth/routes/sign-up';

const mockLoadSignUpFormSection = jest.fn();

jest.mock('@auth/routes/sign-up/form-section-loader', () => ({
  __esModule: true,
  default: {
    load: (): unknown => mockLoadSignUpFormSection(),
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

class LazyErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  public override state: { error: Error | null } = { error: null };

  public static getDerivedStateFromError(error: Error): { error: Error } {
    return { error };
  }

  public override render(): ReactNode {
    return this.state.error ? <p>{this.state.error.message}</p> : this.props.children;
  }
}

describe('sign-up form-section lazy loading', () => {
  beforeEach(() => {
    mockLoadSignUpFormSection.mockReset();
  });

  it('loads the sign-up page without executing the form loader before render', async () => {
    const signUpRoute = authRoutes.routes.find((route) => route.path === ROUTE_PATHS.signUp);
    expect(signUpRoute).toBeDefined();
    if (!signUpRoute) {
      throw new Error('Sign-up route is missing');
    }

    const pageModule = await signUpRoute.load();

    expect(mockLoadSignUpFormSection).not.toHaveBeenCalled();
    expect(pageModule.default).toBeDefined();
  });

  it('does not execute the sign-up form loader when loading sign-in', async () => {
    const signInRoute = authRoutes.routes.find((route) => route.path === ROUTE_PATHS.signIn);
    expect(signInRoute).toBeDefined();
    if (!signInRoute) {
      throw new Error('Sign-in route is missing');
    }

    await signInRoute.load();

    expect(mockLoadSignUpFormSection).not.toHaveBeenCalled();
  });

  it('keeps a rejected form import visible to the lazy consumer', async () => {
    const error = new Error('sign-up form chunk failed');
    mockLoadSignUpFormSection.mockReturnValue(Promise.reject(error));
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    render(
      <LazyErrorBoundary>
        <Suspense fallback={<p>loading</p>}>
          <SignUp />
        </Suspense>
      </LazyErrorBoundary>
    );

    expect(await screen.findByText(error.message)).toBeInTheDocument();
    expect(mockLoadSignUpFormSection).toHaveBeenCalledTimes(1);
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
