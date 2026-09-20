// @jest-environment jsdom

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { Component, Suspense, type ReactElement, type ReactNode } from 'react';

import ROUTE_PATHS from '@/routes/route-paths';
import authRoutes from '@auth/routes';
import SignIn from '@auth/routes/sign-in';
import SignUp from '@auth/routes/sign-up';

const mockLoadSignInFormSection = jest.fn();
const mockLoadSignUpFormSection = jest.fn();

jest.mock('@auth/routes/sign-in/form-section-loader', () => ({
  __esModule: true,
  default: { load: (): unknown => mockLoadSignInFormSection() },
}));

jest.mock('@auth/routes/sign-up/form-section-loader', () => ({
  __esModule: true,
  default: { load: (): unknown => mockLoadSignUpFormSection() },
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

interface FormSectionRouteCase {
  readonly loader: jest.Mock;
  readonly name: 'sign-in' | 'sign-up';
  readonly otherPath: string;
  readonly page: () => ReactElement;
  readonly path: string;
}

const formSectionRouteCases: readonly FormSectionRouteCase[] = [
  {
    loader: mockLoadSignUpFormSection,
    name: 'sign-up',
    otherPath: ROUTE_PATHS.signIn,
    page: SignUp,
    path: ROUTE_PATHS.signUp,
  },
  {
    loader: mockLoadSignInFormSection,
    name: 'sign-in',
    otherPath: ROUTE_PATHS.signUp,
    page: SignIn,
    path: ROUTE_PATHS.signIn,
  },
];

describe('auth form-section lazy loading', () => {
  beforeEach(() => {
    mockLoadSignInFormSection.mockReset();
    mockLoadSignUpFormSection.mockReset();
  });

  it('loads each auth page without executing its form loader before render', async () => {
    for (const formSectionRoute of formSectionRouteCases) {
      const route = authRoutes.routes.find(({ path }) => path === formSectionRoute.path);
      expect(route).toBeDefined();
      if (!route) {
        throw new Error(`${formSectionRoute.name} route is missing`);
      }

      const pageModule = await route.load();

      expect(formSectionRoute.loader).not.toHaveBeenCalled();
      expect(pageModule.default).toBeDefined();
    }
  });

  it('does not execute a form loader when loading the other auth page', async () => {
    for (const formSectionRoute of formSectionRouteCases) {
      const otherRoute = authRoutes.routes.find(({ path }) => path === formSectionRoute.otherPath);
      expect(otherRoute).toBeDefined();
      if (!otherRoute) {
        throw new Error(`Route for ${formSectionRoute.otherPath} is missing`);
      }

      await otherRoute.load();

      expect(formSectionRoute.loader).not.toHaveBeenCalled();
    }
  });

  it('keeps rejected form imports visible to lazy consumers', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    try {
      for (const formSectionRoute of formSectionRouteCases) {
        const error = new Error(`${formSectionRoute.name} form chunk failed`);
        formSectionRoute.loader.mockReturnValueOnce(Promise.reject(error));
        const Page = formSectionRoute.page;

        render(
          <LazyErrorBoundary>
            <Suspense fallback={<p>loading</p>}>
              <Page />
            </Suspense>
          </LazyErrorBoundary>
        );

        expect(await screen.findByText(error.message)).toBeInTheDocument();
        expect(formSectionRoute.loader).toHaveBeenCalledTimes(1);
        expect(consoleError).toHaveBeenCalled();
      }
    } finally {
      consoleError.mockRestore();
    }
  });
});
