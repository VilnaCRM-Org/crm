import { act, renderHook, waitFor } from '@testing-library/react';

import useFontsReady from '@/hooks/use-fonts-ready';

type MockFontFaceSet = Pick<FontFaceSet, 'check' | 'load'>;

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
};

function createDeferred<T>(): Deferred<T> {
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>((innerResolve) => {
    resolve = innerResolve;
  });

  return { promise, resolve };
}

const originalFonts = document.fonts;

function setMockFonts(mockFonts: MockFontFaceSet): void {
  Object.defineProperty(document, 'fonts', {
    configurable: true,
    value: mockFonts,
  });
}

const TEST_FONTS = ['500 1rem TestFont', '700 1rem TestFont'] as const;

describe('useFontsReady', () => {
  afterEach(() => {
    jest.restoreAllMocks();

    if (originalFonts) {
      setMockFonts(originalFonts);
      return;
    }

    Reflect.deleteProperty(document, 'fonts');
  });

  it('returns true immediately when all fonts are already loaded', () => {
    setMockFonts({ check: jest.fn(() => true), load: jest.fn() });

    const { result } = renderHook(() => useFontsReady(TEST_FONTS));

    expect(result.current).toBe(true);
    expect(document.fonts.load).not.toHaveBeenCalled();
  });

  it('returns false initially and true after fonts load', async () => {
    const deferred = createDeferred<FontFace[]>();
    const check = jest.fn(() => false);
    const load = jest.fn(() => deferred.promise);

    setMockFonts({ check, load });

    const { result } = renderHook(() => useFontsReady(TEST_FONTS));

    expect(result.current).toBe(false);

    await act(async () => {
      deferred.resolve([]);
      await deferred.promise;
    });

    await waitFor(() => {
      expect(result.current).toBe(true);
    });

    expect(load).toHaveBeenCalledWith('500 1rem TestFont');
    expect(load).toHaveBeenCalledWith('700 1rem TestFont');
  });

  it('returns true when the font loading API is unavailable', () => {
    Reflect.deleteProperty(document, 'fonts');

    const { result } = renderHook(() => useFontsReady(TEST_FONTS));

    expect(result.current).toBe(true);
  });

  it('returns true after a font loading failure instead of staying false', async () => {
    const check = jest.fn(() => false);
    const load = jest.fn(() => Promise.reject(new Error('font failed')));

    setMockFonts({ check, load });

    const { result } = renderHook(() => useFontsReady(TEST_FONTS));

    expect(result.current).toBe(false);

    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });

  it('does not update state after the hook unmounts during font loading', async () => {
    const deferred = createDeferred<FontFace[]>();
    const check = jest.fn(() => false);
    const load = jest.fn(() => deferred.promise);

    setMockFonts({ check, load });

    const { unmount } = renderHook(() => useFontsReady(TEST_FONTS));

    unmount();

    await act(async () => {
      deferred.resolve([]);
      await deferred.promise;
    });

    expect(load).toHaveBeenCalled();
  });

  it('works with any font list, not only auth fonts', async () => {
    const customFonts = ['400 1rem CustomFont', '600 1rem CustomFont'] as const;
    const check = jest.fn(() => true);
    const load = jest.fn();

    setMockFonts({ check, load });

    const { result } = renderHook(() => useFontsReady(customFonts));

    expect(result.current).toBe(true);
    expect(check).toHaveBeenCalledWith('400 1rem CustomFont');
    expect(check).toHaveBeenCalledWith('600 1rem CustomFont');
    expect(load).not.toHaveBeenCalled();
  });
});
