import { renderHook } from '@testing-library/react';

import useHeaderClearance from '@/components/layouts/use-header-clearance';

const padding = (property: string): string =>
  document.documentElement.style.getPropertyValue(property);

describe('useHeaderClearance', () => {
  afterEach(() => {
    document.documentElement.style.removeProperty('scroll-padding-top');
    document.documentElement.style.removeProperty('scroll-padding-bottom');
  });

  it('reserves the header height as top scroll padding while mounted', () => {
    renderHook(() => useHeaderClearance('64px'));

    expect(padding('scroll-padding-top')).toBe('64px');
  });

  it('removes the top scroll padding on unmount', () => {
    const { unmount } = renderHook(() => useHeaderClearance('64px'));

    unmount();

    expect(padding('scroll-padding-top')).toBe('');
  });

  it('follows a changed header height', () => {
    const { rerender } = renderHook(({ height }) => useHeaderClearance(height), {
      initialProps: { height: '64px' },
    });

    rerender({ height: '72px' });

    expect(padding('scroll-padding-top')).toBe('72px');
  });

  it('leaves the bottom scroll padding the toast stack reserves untouched', () => {
    document.documentElement.style.setProperty('scroll-padding-bottom', '96px');

    const { unmount } = renderHook(() => useHeaderClearance('64px'));
    unmount();

    expect(padding('scroll-padding-bottom')).toBe('96px');
  });
});
