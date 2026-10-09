import '@testing-library/jest-dom';
import { faker } from '@faker-js/faker';
import { render, screen } from '@testing-library/react';
import * as React from 'react';
import type { JSX, ReactNode } from 'react';
import * as ReactI18next from 'react-i18next';
import type { Location } from 'react-router';

import type { FallbackLandmark } from '@/components/types/error-boundary';
import type { ErrorPageProps, ErrorPageVariantId } from '@/components/types/error-page';
import loadIsolated from '@tests/unit/utils/isolated-module';

import createLocaleI18n from '../../utils/create-locale-i18n';

let mockRouteError: unknown;
let mockLocation: Location;

jest.mock('react-router', () => ({
  ...jest.requireActual<typeof import('react-router')>('react-router'),
  useRouteError: (): unknown => mockRouteError,
  useNavigate: (): jest.Mock => jest.fn(),
  useLocation: (): Location => mockLocation,
}));

jest.mock('@/components/error-page', () => ({
  __esModule: true,
  default: ({ variant, landmark }: ErrorPageProps): JSX.Element => (
    <h1>{`${variant} in ${landmark}`}</h1>
  ),
}));

type RouteErrorPageComponent = (props: ErrorPageProps) => JSX.Element;

interface FreshModules {
  RouteErrorPage: RouteErrorPageComponent;
  errorPageLoader: { load: () => Promise<unknown> };
}

const HEADING = 'Something went wrong';
const ROUTE = 'This page is not available. Go to the homepage.';
const GO_HOME = 'Go to homepage';

const englishI18n = createLocaleI18n('en');

function Providers({ children }: { children: ReactNode }): JSX.Element {
  return <ReactI18next.I18nextProvider i18n={englishI18n}>{children}</ReactI18next.I18nextProvider>;
}

const loadFresh = (): Promise<FreshModules> =>
  loadIsolated(async () => {
    jest.doMock('react', () => React);
    jest.doMock('react-i18next', () => ReactI18next);
    const [page, loader] = await Promise.all([
      import('@/components/error-boundary/route-error-page'),
      import('@/components/error-boundary/error-page-loader'),
    ]);
    return { RouteErrorPage: page.default, errorPageLoader: loader.default };
  });

const nextLocation = (): Location => ({
  pathname: `/${faker.string.alpha(6)}`,
  search: '',
  hash: '',
  state: null,
  key: faker.string.alphanumeric(8),
});

describe('RouteErrorPage', () => {
  beforeEach(() => {
    mockRouteError = { status: 404, statusText: 'Not Found', internal: false, data: null };
    mockLocation = nextLocation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows the route fallback while the page chunk is pending, then the page', async () => {
    const { RouteErrorPage } = await loadFresh();

    render(<RouteErrorPage variant="notFound" landmark="main" />, { wrapper: Providers });

    expect(screen.getByRole('status')).toBeEmptyDOMElement();
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { level: 1, name: 'notFound in main' })
    ).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it.each<[ErrorPageVariantId, FallbackLandmark]>([
    ['forbidden', 'region'],
    ['serverError', 'main'],
  ])('forwards the %s variant and the %s landmark to the page', async (variant, landmark) => {
    const { RouteErrorPage } = await loadFresh();

    render(<RouteErrorPage variant={variant} landmark={landmark} />, { wrapper: Providers });

    expect(
      await screen.findByRole('heading', { level: 1, name: `${variant} in ${landmark}` })
    ).toBeInTheDocument();
  });

  it('renders the recovery screen for the original route error when the chunk fails', async () => {
    const { RouteErrorPage, errorPageLoader } = await loadFresh();
    const load = jest
      .spyOn(errorPageLoader, 'load')
      .mockRejectedValue(new Error('Loading chunk error-page failed.'));

    render(<RouteErrorPage variant="notFound" landmark="region" />, { wrapper: Providers });

    expect(await screen.findByRole('region', { name: HEADING })).toBeInTheDocument();
    expect(load).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('alert')).toHaveTextContent(ROUTE);
    expect(screen.getByRole('link', { name: GO_HOME })).toHaveAttribute('href', '/');
    expect(screen.getByText('404 Not Found')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'notFound in region' })).not.toBeInTheDocument();
  });

  it('renders from the same loader the post-load warm-up already settled', async () => {
    const { RouteErrorPage, errorPageLoader } = await loadFresh();
    await errorPageLoader.load();
    const load = jest.spyOn(errorPageLoader, 'load');

    render(<RouteErrorPage variant="serverError" landmark="main" />, { wrapper: Providers });

    expect(
      await screen.findByRole('heading', { level: 1, name: 'serverError in main' })
    ).toBeInTheDocument();
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('mounts a new page instance when the location key changes', async () => {
    const { RouteErrorPage } = await loadFresh();
    const view = render(<RouteErrorPage variant="notFound" landmark="main" />, {
      wrapper: Providers,
    });
    const first = await screen.findByRole('heading', { level: 1, name: 'notFound in main' });

    mockLocation = { ...mockLocation, key: `${mockLocation.key}-next` };
    view.rerender(<RouteErrorPage variant="notFound" landmark="main" />);

    const second = screen.getByRole('heading', { level: 1, name: 'notFound in main' });
    expect(second).not.toBe(first);
  });

  it('keeps the same page mounted while the location key is unchanged', async () => {
    const { RouteErrorPage } = await loadFresh();
    const view = render(<RouteErrorPage variant="notFound" landmark="main" />, {
      wrapper: Providers,
    });
    const first = await screen.findByRole('heading', { level: 1, name: 'notFound in main' });

    view.rerender(<RouteErrorPage variant="notFound" landmark="main" />);

    expect(screen.getByRole('heading', { level: 1, name: 'notFound in main' })).toBe(first);
  });
});
