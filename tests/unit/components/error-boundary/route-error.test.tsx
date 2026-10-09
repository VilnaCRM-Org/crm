import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import type { JSX } from 'react';
import { data } from 'react-router';

import RouteError from '@/components/error-boundary/route-error';
import type { FallbackLandmark, RouteErrorProps } from '@/components/types/error-boundary';
import type { ErrorPageProps } from '@/components/types/error-page';

let mockRouteError: unknown;

jest.mock('react-router', () => ({
  ...jest.requireActual<typeof import('react-router')>('react-router'),
  useRouteError: (): unknown => mockRouteError,
}));

jest.mock('@/components/error-boundary/route-error-page', () => ({
  __esModule: true,
  default: ({ variant, landmark }: ErrorPageProps): JSX.Element => (
    <h1>{`status page ${variant} in ${landmark}`}</h1>
  ),
}));

jest.mock('@/components/error-boundary/route-error-fallback', () => ({
  __esModule: true,
  default: ({ landmark }: RouteErrorProps): JSX.Element => <h1>{`recovery in ${landmark}`}</h1>,
}));

const routeResponse = (status: number): Record<string, unknown> => ({
  status,
  statusText: '',
  internal: false,
  data: null,
});

const heading = (): HTMLElement => screen.getByRole('heading', { level: 1 });

describe('RouteError', () => {
  beforeEach(() => {
    mockRouteError = undefined;
  });

  it.each<[unknown, string, FallbackLandmark]>([
    [routeResponse(404), 'notFound', 'region'],
    [routeResponse(503), 'serverError', 'main'],
    [new Response(null, { status: 403 }), 'forbidden', 'region'],
    [data(null, { status: 599 }), 'serverError', 'main'],
  ])('dispatches a known status (%#) to the status page', (error, variant, landmark) => {
    mockRouteError = error;

    render(<RouteError landmark={landmark} />);

    expect(heading()).toHaveTextContent(`status page ${variant} in ${landmark}`);
  });

  it('sends a 404 route response to the not-found page instead of navigate-home', () => {
    mockRouteError = routeResponse(404);

    render(<RouteError landmark="main" />);

    expect(heading()).toHaveTextContent('status page notFound in main');
    expect(screen.queryByText('recovery in main')).not.toBeInTheDocument();
  });

  it('sends a 503 route response to the server-error page instead of an in-place retry', () => {
    mockRouteError = routeResponse(503);

    render(<RouteError landmark="region" />);

    expect(heading()).toHaveTextContent('status page serverError in region');
    expect(screen.queryByText('recovery in region')).not.toBeInTheDocument();
  });

  it.each<[unknown, FallbackLandmark]>([
    [undefined, 'region'],
    [new Error('route failed'), 'main'],
    [routeResponse(401), 'region'],
    [new Response(null, { status: 400 }), 'main'],
    [data(null, 600), 'region'],
  ])('keeps every other route error (%#) on the recovery screen', (error, landmark) => {
    mockRouteError = error;

    render(<RouteError landmark={landmark} />);

    expect(heading()).toHaveTextContent(`recovery in ${landmark}`);
    expect(screen.queryByText(/status page/)).not.toBeInTheDocument();
  });
});
