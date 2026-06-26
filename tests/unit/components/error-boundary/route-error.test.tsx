// @jest-environment jsdom

import '@tests/unit/utils/setup-bun-dom';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import type { ReactElement } from 'react';

let mockRouteError: unknown = undefined;
const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  useRouteError: (): unknown => mockRouteError,
  useNavigate: (): jest.Mock => mockNavigate,
  isRouteErrorResponse: (error: unknown): boolean =>
    error != null && typeof error === 'object' && 'status' in error && 'statusText' in error,
}));

jest.mock('@/components/error-boundary/error-fallback', () => ({
  __esModule: true,
  default: ({ error, reset }: { error?: Error; reset: () => void }): ReactElement => (
    <div>
      <span>{error?.message ?? 'no-error'}</span>
      <button type="button" onClick={reset}>
        reset
      </button>
    </div>
  ),
}));

const RouteError = jest.requireActual<typeof import('@/components/error-boundary/route-error')>(
  '@/components/error-boundary/route-error'
).default;

describe('RouteError', () => {
  beforeEach(() => {
    mockRouteError = undefined;
    mockNavigate.mockReset();
  });

  it('maps an unknown route error to a generic Error (AC1)', () => {
    mockRouteError = undefined;

    render(<RouteError />);

    expect(screen.getByText('Unknown route error')).toBeInTheDocument();
  });

  it('passes the error through when routeError is an Error instance (AC1)', () => {
    mockRouteError = new Error('route failed');

    render(<RouteError />);

    expect(screen.getByText('route failed')).toBeInTheDocument();
  });

  it('maps a RouteErrorResponse to a status message (AC1)', () => {
    mockRouteError = { status: 404, statusText: 'Not Found' };

    render(<RouteError />);

    expect(screen.getByText('404 Not Found')).toBeInTheDocument();
  });

  it('reset navigates to home (AC1)', async () => {
    render(<RouteError />);

    await userEvent.click(screen.getByRole('button', { name: 'reset' }));

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});
