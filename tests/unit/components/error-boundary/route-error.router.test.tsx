import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { JSX, ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import {
  createMemoryRouter,
  data,
  type InitialEntry,
  Outlet,
  type RouteObject,
  RouterProvider,
} from 'react-router';

import RouteError from '@/components/error-boundary/route-error';
import AppLayout from '@/components/layouts/app-layout';
import type { FallbackLandmark } from '@/components/types/error-boundary';
import routeComposer from '@/routes/route-composer';
import boundaryErrorReporter from '@/services/error-reporting/boundary-error-reporter';

import createLocaleI18n from '../../utils/create-locale-i18n';

jest.mock('@/assets/illustrations/error-page/curve.svg', () => ({ ReactComponent: 'svg' }));
jest.mock('@/assets/illustrations/error-page/diamond.svg', () => ({ ReactComponent: 'svg' }));
jest.mock('@/assets/illustrations/error-page/dot-columns.svg', () => ({ ReactComponent: 'svg' }));
jest.mock('@/assets/illustrations/error-page/dot-rows.svg', () => ({ ReactComponent: 'svg' }));
jest.mock('@/assets/icons/logo/vilna-logo.svg', () => ({ ReactComponent: 'svg' }));

type ThrownShape = 'data' | 'response';
type RouteErrorHandler = ReturnType<typeof routeComposer.routeErrorHandler>;

interface RenderedRouter {
  router: ReturnType<typeof createMemoryRouter>;
  onRouteError: jest.Mock;
  onCaughtError: jest.Mock;
  unmount: () => void;
}

const TRY_AGAIN = 'Try again';
const RELOAD = 'Reload the page';
const GO_HOME = 'Go to homepage';
const UNEXPECTED = 'An unexpected error occurred. You can try again or go to the homepage.';
const ROUTE = 'This page is not available. Go to the homepage.';
const RETRYABLE = 'The last action did not complete. Try again.';
const CHUNK_LOAD = 'Part of the page failed to load. Reload the page to get the latest version.';

const STATUS_PAGES: [number, string][] = [
  [403, 'Access denied'],
  [404, 'Error 404'],
  [500, 'Server error'],
  [599, 'Server error'],
];
const SHAPES: ThrownShape[] = ['data', 'response'];
const STATUS_PAGE_CASES = SHAPES.flatMap((shape) =>
  STATUS_PAGES.map(([status, title]): [ThrownShape, number, string] => [shape, status, title])
);
const OTHER_STATUS_CASES = SHAPES.flatMap((shape) =>
  [400, 401, 405, 499].map((status): [ThrownShape, number] => [shape, status])
);

const englishI18n = createLocaleI18n('en');

function Providers({ children }: { children: ReactNode }): JSX.Element {
  return <I18nextProvider i18n={englishI18n}>{children}</I18nextProvider>;
}

const statusError = (shape: ThrownShape, status: number): unknown =>
  shape === 'data' ? data(null, { status }) : new Response(null, { status });

function ThrowingPage({ thrown }: { thrown: unknown }): JSX.Element {
  throw thrown;
}

const throwingElements = (
  thrown: unknown,
  landmark: FallbackLandmark
): Pick<RouteObject, 'element' | 'errorElement'> => ({
  element: <ThrowingPage thrown={thrown} />,
  errorElement: <RouteError landmark={landmark} />,
});

const throwingPage = (thrown: unknown, landmark: FallbackLandmark = 'main'): RouteObject => ({
  path: '/',
  ...throwingElements(thrown, landmark),
});

const throwingLoader = (thrown: unknown): RouteObject => ({
  path: '/',
  loader: (): never => {
    throw thrown;
  },
  hydrateFallbackElement: <p>loading</p>,
  element: <p>never rendered</p>,
  errorElement: <RouteError landmark="main" />,
});

function renderRoutes(
  routes: RouteObject[],
  initialEntries: InitialEntry[] = ['/'],
  onError: RouteErrorHandler = jest.fn()
): RenderedRouter {
  const router = createMemoryRouter(routes, { initialEntries });
  const onRouteError = jest.fn(onError);
  const onCaughtError = jest.fn();

  const { unmount } = render(<RouterProvider router={router} onError={onRouteError} />, {
    wrapper: Providers,
    onCaughtError,
  });

  return { router, onRouteError, onCaughtError, unmount };
}

const findPageHeading = (name: string): Promise<HTMLElement> =>
  screen.findByRole('heading', { level: 1, name });

function StandInAppLayout(): JSX.Element {
  return (
    <>
      <main tabIndex={-1}>
        <Outlet />
      </main>
      <footer>shell footer</footer>
    </>
  );
}

describe('RouteError inside a data router', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('retries the index route in place without rewriting the URL to /?index', async () => {
    let throwing = true;
    function Page(): JSX.Element {
      if (throwing) throw new Error('page failed');
      return (
        <main tabIndex={-1}>
          <p>page content</p>
        </main>
      );
    }
    const errorElement = <RouteError landmark="main" />;
    const { router, onRouteError, onCaughtError } = renderRoutes(
      [
        {
          path: '/',
          element: <Outlet />,
          children: [{ index: true, element: <Page />, errorElement }],
        },
      ],
      ['/?tab=2#top']
    );

    expect(await screen.findByRole('button', { name: TRY_AGAIN })).toBeInTheDocument();
    expect(onRouteError).toHaveBeenCalledTimes(1);
    expect(onCaughtError).toHaveBeenCalledTimes(1);

    throwing = false;
    fireEvent.click(screen.getByRole('button', { name: TRY_AGAIN }));

    expect(await screen.findByText('page content')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/');
    expect(router.state.location.search).toBe('?tab=2');
    expect(router.state.location.hash).toBe('#top');
    await waitFor(() => expect(screen.getByRole('main')).toHaveFocus());
  });

  it.each(STATUS_PAGE_CASES)(
    'renders the designed page for a %s %i thrown while rendering',
    async (shape, status, title) => {
      const thrown = statusError(shape, status);
      const { onRouteError, onCaughtError } = renderRoutes([throwingPage(thrown)]);

      const heading = await findPageHeading(title);

      await waitFor(() => expect(heading).toHaveFocus());
      expect(screen.getAllByRole('main')).toHaveLength(1);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(onRouteError).toHaveBeenCalledTimes(1);
      expect(onCaughtError).toHaveBeenCalledTimes(1);
      expect(onCaughtError).toHaveBeenCalledWith(thrown, expect.anything());
    }
  );

  it.each(STATUS_PAGE_CASES)(
    'renders the designed page for a %s %i thrown from a loader',
    async (shape, status, title) => {
      const { onRouteError, onCaughtError } = renderRoutes([
        throwingLoader(statusError(shape, status)),
      ]);

      const heading = await findPageHeading(title);

      await waitFor(() => expect(heading).toHaveFocus());
      expect(onRouteError).toHaveBeenCalledTimes(1);
      expect(onCaughtError).not.toHaveBeenCalled();
    }
  );

  it('keeps the reset recovery for a 401 Response thrown while rendering', async () => {
    const thrown = new Response(null, { status: 401 });
    const { onCaughtError } = renderRoutes([throwingPage(thrown)]);

    expect(await screen.findByRole('button', { name: TRY_AGAIN })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(UNEXPECTED);
    expect(screen.queryByRole('heading', { name: 'Error 404' })).not.toBeInTheDocument();
    expect(onCaughtError).toHaveBeenCalledWith(thrown, expect.anything());
  });

  it.each([
    ...OTHER_STATUS_CASES.map(([shape, status]) => [
      `${shape} ${status}`,
      statusError(shape, status),
    ]),
    ['data 600', data(null, 600)],
    ['plain Error', new Error('page failed')],
  ])('keeps the reset recovery for a %s thrown while rendering', async (_label, thrown) => {
    const { onCaughtError } = renderRoutes([throwingPage(thrown)]);

    expect(await screen.findByRole('button', { name: TRY_AGAIN })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(UNEXPECTED);
    expect(onCaughtError).toHaveBeenCalledWith(thrown, expect.anything());
  });

  it('keeps the reload recovery for a chunk-load error thrown while rendering', async () => {
    const thrown = new Error('Loading chunk 7 failed.');
    const { onCaughtError } = renderRoutes([throwingPage(thrown)]);

    expect(await screen.findByRole('button', { name: RELOAD })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(CHUNK_LOAD);
    expect(onCaughtError).toHaveBeenCalledWith(thrown, expect.anything());
  });

  it('keeps the retry recovery for a retryable error thrown while rendering', async () => {
    const thrown = Object.assign(new Error('save failed'), { retryable: true });
    const { onCaughtError } = renderRoutes([throwingPage(thrown)]);

    expect(await screen.findByRole('button', { name: TRY_AGAIN })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(RETRYABLE);
    expect(onCaughtError).toHaveBeenCalledWith(thrown, expect.anything());
  });

  it.each(OTHER_STATUS_CASES)(
    'keeps navigate-home for a %s %i thrown from a loader',
    async (shape, status) => {
      const { onCaughtError } = renderRoutes([throwingLoader(statusError(shape, status))]);

      expect(await screen.findByRole('link', { name: GO_HOME })).toHaveAttribute('href', '/');
      expect(screen.getByRole('alert')).toHaveTextContent(ROUTE);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
      expect(onCaughtError).not.toHaveBeenCalled();
    }
  );

  it('keeps the retry recovery for a 600 thrown from a loader', async () => {
    const { onCaughtError } = renderRoutes([throwingLoader(data(null, 600))]);

    expect(await screen.findByRole('button', { name: TRY_AGAIN })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(RETRYABLE);
    expect(onCaughtError).not.toHaveBeenCalled();
  });

  it('renders a protected status page as a region inside the layout main', async () => {
    const thrown = data(null, { status: 404 });
    const { onCaughtError } = renderRoutes([
      {
        path: '/',
        element: <StandInAppLayout />,
        children: [{ index: true, ...throwingElements(thrown, 'region') }],
      },
    ]);

    const region = await screen.findByRole('region', { name: 'Error 404' });

    expect(region.tagName).toBe('SECTION');
    expect(screen.getAllByRole('main')).toHaveLength(1);
    expect(screen.getByRole('main')).toContainElement(region);
    expect(screen.getAllByRole('contentinfo')).toHaveLength(1);
    expect(screen.getByRole('contentinfo')).toHaveTextContent('shell footer');
    expect(onCaughtError).toHaveBeenCalledWith(thrown, expect.anything());
  });

  it('still reports the error once on the route surface while the 404 page renders', async () => {
    const report = jest.spyOn(boundaryErrorReporter, 'report').mockImplementation(() => undefined);
    const thrown = new Response(null, { status: 404 });
    const { onCaughtError } = renderRoutes(
      [throwingPage(thrown)],
      ['/'],
      routeComposer.routeErrorHandler()
    );

    expect(await findPageHeading('Error 404')).toBeInTheDocument();
    expect(report).toHaveBeenCalledTimes(1);
    expect(report).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ surface: 'route', pattern: '/' })
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByRole('group')).not.toBeInTheDocument();
    expect(screen.queryByText(/object Response|Not Found/)).not.toBeInTheDocument();
    expect(onCaughtError).toHaveBeenCalledWith(thrown, expect.anything());
  });

  it('focuses the page heading after a post-login arrival with a cached chunk', async () => {
    const view = renderRoutes([throwingPage(data(null, { status: 404 }))]);
    await findPageHeading('Error 404');
    expect(view.onCaughtError).toHaveBeenCalledTimes(1);
    view.unmount();

    const thrown = data(null, { status: 404 });
    const { router, onCaughtError } = renderRoutes(
      [
        {
          element: <Outlet context={{ signOut: jest.fn() }} />,
          children: [{ element: <AppLayout />, children: [throwingPage(thrown, 'region')] }],
        },
      ],
      [{ pathname: '/', state: { focusMain: true } }]
    );

    const region = await screen.findByRole('region', { name: 'Error 404' });
    await screen.findByRole('contentinfo');
    await waitFor(() => expect(router.state.location.state).toEqual({ focusMain: false }));

    expect(screen.getByRole('heading', { level: 1, name: 'Error 404' })).toHaveFocus();
    expect(screen.getByRole('main')).toContainElement(region);
    expect(onCaughtError).toHaveBeenCalledWith(thrown, expect.anything());
  });
});
