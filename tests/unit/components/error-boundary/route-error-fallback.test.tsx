import '@testing-library/jest-dom';
import { faker } from '@faker-js/faker';
import { fireEvent, render, screen } from '@testing-library/react';
import type { JSX, ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import type { Location } from 'react-router';

import RouteErrorFallback from '@/components/error-boundary/route-error-fallback';
import type { FallbackLandmark } from '@/components/types/error-boundary';
import pageReloadNavigator from '@/lib/reliability/page-reload-navigator';

import createLocaleI18n from '../../utils/create-locale-i18n';

let mockRouteError: unknown;
let mockLocation: Location;
const mockNavigate = jest.fn();

jest.mock('react-router', () => ({
  ...jest.requireActual<typeof import('react-router')>('react-router'),
  useRouteError: (): unknown => mockRouteError,
  useNavigate: (): jest.Mock => mockNavigate,
  useLocation: (): Location => mockLocation,
}));

const HEADING = 'Something went wrong';
const TRY_AGAIN = 'Try again';
const RELOAD = 'Reload the page';
const GO_HOME = 'Go to homepage';
const UNEXPECTED = 'An unexpected error occurred. You can try again or go to the homepage.';
const ROUTE = 'This page is not available. Go to the homepage.';
const RETRYABLE = 'The last action did not complete. Try again.';
const CHUNK_LOAD = 'Part of the page failed to load. Reload the page to get the latest version.';

const englishI18n = createLocaleI18n('en');

function Providers({ children }: { children: ReactNode }): JSX.Element {
  return <I18nextProvider i18n={englishI18n}>{children}</I18nextProvider>;
}

function renderFallback(landmark: FallbackLandmark = 'region'): ReturnType<typeof render> {
  return render(
    <main tabIndex={-1}>
      <RouteErrorFallback landmark={landmark} />
    </main>,
    { wrapper: Providers }
  );
}

const RECOVERED = 'Orders page';

function RetryOutlet({ retried }: { retried: boolean }): JSX.Element {
  return (
    <main tabIndex={-1}>
      {retried ? <p>{RECOVERED}</p> : <RouteErrorFallback landmark="region" />}
    </main>
  );
}

function fakeAnimationFrame(): jest.SpyInstance {
  return jest.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
    callback(0);
    return 0;
  });
}

describe('RouteErrorFallback', () => {
  beforeEach(() => {
    mockRouteError = undefined;
    mockLocation = {
      pathname: '/orders',
      search: '',
      hash: '',
      state: { from: faker.internet.url() },
      key: faker.string.alphanumeric(8),
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('maps an unknown route error to a resettable generic fallback', () => {
    renderFallback();

    expect(screen.getByRole('alert')).toHaveTextContent(UNEXPECTED);
    expect(screen.getByRole('button', { name: TRY_AGAIN })).toBeInTheDocument();
    expect(screen.getByText('Unknown route error')).toBeInTheDocument();
  });

  it('passes an Error instance through to the diagnostics', () => {
    const message = faker.lorem.sentence();
    mockRouteError = new Error(message);

    renderFallback();

    expect(screen.getByRole('alert')).toHaveTextContent(UNEXPECTED);
    expect(screen.getByText(message)).toBeInTheDocument();
  });

  it('maps a 401 route error response to the navigate-home strategy', () => {
    mockRouteError = { status: 401, statusText: 'Unauthorized', internal: false, data: null };

    renderFallback();

    expect(screen.getByRole('alert')).toHaveTextContent(ROUTE);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: GO_HOME })).toHaveAttribute('href', '/');
    expect(screen.getByText('401 Unauthorized')).toBeInTheDocument();
  });

  it('offers an in-place retry for a retryable route error', () => {
    const message = faker.lorem.sentence();
    mockRouteError = Object.assign(new Error(message), { retryable: true });

    renderFallback();

    expect(screen.getByRole('alert')).toHaveTextContent(RETRYABLE);
    fireEvent.click(screen.getByRole('button', { name: TRY_AGAIN }));

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(screen.getByText(message)).toBeInTheDocument();
  });

  it('re-renders the current location in place, keeping its search and hash', () => {
    mockRouteError = new Error('route failed');
    mockLocation = { ...mockLocation, search: '?next=%2Fx', hash: '#frag' };

    renderFallback();
    expect(screen.getByRole('heading', { level: 1, name: HEADING })).toHaveFocus();

    fireEvent.click(screen.getByRole('button', { name: TRY_AGAIN }));

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith(
      { pathname: '/orders', search: '?next=%2Fx', hash: '#frag' },
      { replace: true, state: mockLocation.state }
    );
  });

  it('defers the focus check until a successful retry replaces the fallback', () => {
    const animationFrame = fakeAnimationFrame();
    mockRouteError = new Error('route failed');

    const view = render(<RetryOutlet retried={false} />, { wrapper: Providers });
    const tryAgain = screen.getByRole('button', { name: TRY_AGAIN });
    tryAgain.focus();
    fireEvent.click(tryAgain);

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(animationFrame).not.toHaveBeenCalled();
    expect(tryAgain).toHaveFocus();

    view.rerender(<RetryOutlet retried />);

    expect(screen.getByText(RECOVERED)).toBeInTheDocument();
    expect(animationFrame).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('main')).toHaveFocus();
  });

  it('leaves focus on the remounted heading after a retry that failed again', () => {
    const animationFrame = fakeAnimationFrame();
    mockRouteError = new Error('route failed');

    const view = render(<RetryOutlet retried={false} />, { wrapper: Providers });
    const firstHeading = screen.getByRole('heading', { level: 1, name: HEADING });
    fireEvent.click(screen.getByRole('button', { name: TRY_AGAIN }));

    mockLocation = { ...mockLocation, key: `${mockLocation.key}-retried` };
    view.rerender(<RetryOutlet retried={false} />);

    const secondHeading = screen.getByRole('heading', { level: 1, name: HEADING });
    expect(secondHeading).not.toBe(firstHeading);
    expect(animationFrame).toHaveBeenCalledTimes(1);
    expect(secondHeading).toHaveFocus();
    expect(screen.getByRole('main')).not.toHaveFocus();
  });

  it('tolerates an unmount when no focusable main landmark exists', () => {
    const animationFrame = fakeAnimationFrame();
    mockRouteError = new Error('route failed');

    const view = render(<RouteErrorFallback landmark="region" />, { wrapper: Providers });
    view.unmount();

    expect(animationFrame).toHaveBeenCalledTimes(1);
    expect(document.body).toHaveFocus();
  });

  it('offers a full reload through the page navigator for a chunk-load failure', () => {
    const reload = jest.spyOn(pageReloadNavigator, 'reload').mockImplementation(() => undefined);
    mockRouteError = new Error('Loading CSS chunk 7 failed.');

    renderFallback();

    expect(screen.getByRole('alert')).toHaveTextContent(CHUNK_LOAD);
    fireEvent.click(screen.getByRole('button', { name: RELOAD }));

    expect(reload).toHaveBeenCalledTimes(1);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('renders the fallback as a labelled region so it never nests a second main', () => {
    renderFallback('region');

    expect(screen.getByRole('region', { name: HEADING })).toBeInTheDocument();
    expect(screen.getAllByRole('main')).toHaveLength(1);
  });

  it('renders the fallback as the main landmark for an open route', () => {
    mockRouteError = new Error('route failed');

    render(<RouteErrorFallback landmark="main" />, { wrapper: Providers });

    expect(screen.getByRole('main')).toHaveAttribute('lang', 'en');
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });

  it('remounts the fallback when the location changes, so focus and the alert repeat', () => {
    mockRouteError = new Error('route failed');

    const view = render(<RouteErrorFallback landmark="region" />, { wrapper: Providers });
    const firstHeading = screen.getByRole('heading', { level: 1, name: HEADING });
    screen.getByRole('link', { name: GO_HOME }).focus();
    expect(firstHeading).not.toHaveFocus();

    mockLocation = { ...mockLocation, key: `${mockLocation.key}-next` };
    view.rerender(<RouteErrorFallback landmark="region" />);

    const secondHeading = screen.getByRole('heading', { level: 1, name: HEADING });
    expect(secondHeading).not.toBe(firstHeading);
    expect(secondHeading).toHaveFocus();
  });

  it('retries with the location of the latest render, not the first', () => {
    fakeAnimationFrame();
    mockRouteError = new Error('route failed');

    const view = render(<RouteErrorFallback landmark="region" />, { wrapper: Providers });
    const latest = {
      pathname: '/orders/latest',
      search: '?page=2',
      hash: '#top',
      state: { from: faker.internet.url() },
    };
    mockLocation = { ...mockLocation, ...latest };
    view.rerender(<RouteErrorFallback landmark="region" />);

    fireEvent.click(screen.getByRole('button', { name: TRY_AGAIN }));

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith(
      { pathname: latest.pathname, search: latest.search, hash: latest.hash },
      { replace: true, state: latest.state }
    );
  });

  it('keeps the same fallback mounted while the location key is unchanged', () => {
    mockRouteError = new Error('route failed');

    const view = render(<RouteErrorFallback landmark="region" />, { wrapper: Providers });
    const firstHeading = screen.getByRole('heading', { level: 1, name: HEADING });
    screen.getByRole('link', { name: GO_HOME }).focus();

    view.rerender(<RouteErrorFallback landmark="region" />);

    expect(screen.getByRole('heading', { level: 1, name: HEADING })).toBe(firstHeading);
    expect(screen.getByRole('link', { name: GO_HOME })).toHaveFocus();
  });
});
