import { JSDOM } from 'jsdom';

if (typeof document === 'undefined') {
  const { window } = new JSDOM('<!doctype html><html><body></body></html>', {
    url: 'http://localhost/',
  });

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: window,
  });
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: window.document,
  });
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: window.navigator,
  });
  Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', {
    configurable: true,
    value: true,
    writable: true,
  });

  for (const key of Object.getOwnPropertyNames(window)) {
    if (!(key in globalThis)) {
      Object.defineProperty(globalThis, key, {
        configurable: true,
        value: (window as unknown as Record<string, unknown>)[key],
        writable: true,
      });
    }
  }

  globalThis.requestAnimationFrame ??= ((callback: FrameRequestCallback): number =>
    setTimeout(() => callback(Date.now()), 0) as unknown as number);
  globalThis.cancelAnimationFrame ??= ((handle: number): void => {
    clearTimeout(handle);
  });
}
