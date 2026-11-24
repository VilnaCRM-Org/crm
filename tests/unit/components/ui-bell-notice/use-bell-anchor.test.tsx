import { renderHook } from '@testing-library/react';
import type { RefObject } from 'react';

import useBellAnchor from '@/components/ui-bell-notice/use-bell-anchor';
import loadIsolated from '@tests/unit/utils/isolated-module';

const root = document.documentElement;

const nextFrame = (): Promise<void> =>
  new Promise((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });

const bell = (rect: Partial<DOMRect>): RefObject<HTMLElement | null> => {
  const element = document.createElement('button');
  element.getBoundingClientRect = (): DOMRect => ({ ...rect }) as DOMRect;
  return { current: element };
};

describe('useBellAnchor', () => {
  afterEach(() => {
    root.style.removeProperty('--bell-centre-x');
    root.style.removeProperty('--bell-bottom');
  });

  it('sets the horizontal centre and the bottom of the bell on mount', () => {
    renderHook(() => useBellAnchor(bell({ left: 1000, width: 48, bottom: 56 })));

    expect(root.style.getPropertyValue('--bell-centre-x')).toBe('1024px');
    expect(root.style.getPropertyValue('--bell-bottom')).toBe('56px');
  });

  it('follows the bell when the window is resized', async () => {
    const ref = bell({ left: 300, width: 24, bottom: 44 });
    renderHook(() => useBellAnchor(ref));
    const element = ref.current as HTMLElement;
    element.getBoundingClientRect = (): DOMRect =>
      ({ left: 250, width: 24, bottom: 40 }) as DOMRect;

    window.dispatchEvent(new Event('resize'));
    await nextFrame();

    expect(root.style.getPropertyValue('--bell-centre-x')).toBe('262px');
    expect(root.style.getPropertyValue('--bell-bottom')).toBe('40px');
  });

  it('places the notice by the bell of the latest render', () => {
    const { rerender } = renderHook(({ ref }) => useBellAnchor(ref), {
      initialProps: { ref: bell({ left: 300, width: 24, bottom: 44 }) },
    });

    rerender({ ref: bell({ left: 100, width: 20, bottom: 30 }) });

    expect(root.style.getPropertyValue('--bell-centre-x')).toBe('110px');
    expect(root.style.getPropertyValue('--bell-bottom')).toBe('30px');
  });

  it('writes and removes the two properties the notice styles read', async () => {
    const { library, hook } = await loadIsolated(async () => ({
      library: await import('@testing-library/react/pure'),
      hook: (await import('@/components/ui-bell-notice/use-bell-anchor')).default,
    }));

    const { unmount } = library.renderHook(() => hook(bell({ left: 8, width: 4, bottom: 6 })));
    expect(root.style.getPropertyValue('--bell-centre-x')).toBe('10px');
    expect(root.style.getPropertyValue('--bell-bottom')).toBe('6px');

    unmount();
    expect(root.style.getPropertyValue('--bell-centre-x')).toBe('');
    expect(root.style.getPropertyValue('--bell-bottom')).toBe('');
  });

  it('removes both properties and stops listening on unmount', async () => {
    const ref = bell({ left: 300, width: 24, bottom: 44 });
    const { unmount } = renderHook(() => useBellAnchor(ref));

    unmount();

    expect(root.style.getPropertyValue('--bell-centre-x')).toBe('');
    expect(root.style.getPropertyValue('--bell-bottom')).toBe('');
    window.dispatchEvent(new Event('resize'));
    await nextFrame();
    expect(root.style.getPropertyValue('--bell-centre-x')).toBe('');
  });

  it('leaves the properties alone while the ref holds no element', () => {
    renderHook(() => useBellAnchor({ current: null }));

    expect(root.style.getPropertyValue('--bell-centre-x')).toBe('');
  });
});
