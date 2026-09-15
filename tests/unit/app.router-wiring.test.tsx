import './utils/setup-bun-dom';
import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';

const mockRouter = { id: 'router-under-test' };
const mockOnRouteError = (): void => undefined;
const mockRouterProviderProps: Record<string, unknown>[] = [];

jest.mock('../../src/index.css', () => ({}));

jest.mock('@/routes/routes', () => ({
  __esModule: true,
  default: mockRouter,
  onRouteError: mockOnRouteError,
}));

jest.mock('react-router', () => ({
  __esModule: true,
  RouterProvider: (props: Record<string, unknown>): ReactElement => {
    mockRouterProviderProps.push(props);
    return <span>router-provider</span>;
  },
}));

const App = jest.requireActual<typeof import('@/app')>('@/app').default;

describe('App router wiring', () => {
  beforeEach(() => {
    mockRouterProviderProps.length = 0;
  });

  it('hands the app router to RouterProvider', () => {
    render(<App />);

    expect(mockRouterProviderProps).toHaveLength(1);
    expect(mockRouterProviderProps[0]?.router).toBe(mockRouter);
  });

  it('hands the route error handler to RouterProvider as onError (issue #116)', () => {
    render(<App />);

    expect(mockRouterProviderProps[0]?.onError).toBe(mockOnRouteError);
  });

  it('passes no legacy future opt-in alongside the router and the error handler', () => {
    render(<App />);

    expect(mockRouterProviderProps[0]).toEqual({ router: mockRouter, onError: mockOnRouteError });
  });
});
