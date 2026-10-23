import { renderHook } from '@testing-library/react';

import useShellLayout from '@/components/ui-app-shell/use-shell-layout';

const stubWidth = (width: number): jest.Mock => {
  const matchMedia = jest.fn((query: string) => {
    const minWidth = Number(/min-width:\s*(\d+)px/u.exec(query)?.[1]);
    return {
      matches: width >= minWidth,
      media: query,
      onchange: null,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      dispatchEvent: jest.fn(),
    };
  });
  window.matchMedia = matchMedia as unknown as typeof window.matchMedia;
  return matchMedia;
};

describe('useShellLayout', () => {
  afterEach(() => {
    Reflect.deleteProperty(window, 'matchMedia');
  });

  it.each([
    [320, 'mobile'],
    [1023, 'mobile'],
    [1024, 'tablet'],
    [1025, 'tablet'],
    [1439, 'tablet'],
    [1440, 'desktop'],
    [1920, 'desktop'],
  ])('returns the %i px layout on the very first render', (width, expected) => {
    stubWidth(width);
    const renders: string[] = [];

    renderHook(() => {
      const layout = useShellLayout();
      renders.push(layout);
      return layout;
    });

    expect(renders).toEqual([expected]);
  });

  it('reads the sidebar breakpoint 1024 and the desktop breakpoint 1440 from the crm scale', () => {
    const matchMedia = stubWidth(1200);

    renderHook(() => useShellLayout());

    const queries = matchMedia.mock.calls.map(([query]) => query);
    expect(queries).toEqual(expect.arrayContaining(['(min-width:1440px)', '(min-width:1024px)']));
  });
});
