import 'reflect-metadata';

import server from './mocks/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Mock window.matchMedia (for Material-UI)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
global.IntersectionObserver = class IntersectionObserver {
  public disconnect(): void {}

  public observe(): void {}

  public takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  public unobserve(): void {}
} as unknown as typeof IntersectionObserver;
