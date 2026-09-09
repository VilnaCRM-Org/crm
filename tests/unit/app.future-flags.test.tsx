import './utils/setup-bun-dom';
import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';

const mockRouter = { id: 'router-under-test' };
const mockRouterProviderProps: Record<string, unknown>[] = [];

jest.mock('../../src/index.css', () => ({}));

jest.mock('@/routes/routes', () => ({
  __esModule: true,
  default: mockRouter,
}));

jest.mock('react-router-dom', () => ({
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

  it('opts the router into the v7 startTransition future flag', () => {
    render(<App />);

    expect(mockRouterProviderProps[0]?.future).toEqual({ v7_startTransition: true });
  });
});
