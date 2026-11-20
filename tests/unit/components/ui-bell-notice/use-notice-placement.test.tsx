import { renderHook } from '@testing-library/react';

import useNoticePlacement from '@/components/ui-bell-notice/use-notice-placement';

const root = document.documentElement;

const stub = (rect: Partial<DOMRect>): { current: HTMLElement } => {
  const element = document.createElement('div');
  element.getBoundingClientRect = (): DOMRect => ({ ...rect }) as DOMRect;
  return { current: element };
};

describe('useNoticePlacement', () => {
  afterEach(() => root.removeAttribute('style'));

  it('anchors to the bell and clears the header below the card while mounted', () => {
    const bell = stub({ left: 1000, width: 48, bottom: 56 });
    const card = stub({ bottom: 125 });
    const { unmount } = renderHook(() => useNoticePlacement(bell, card, { items: [] }));

    expect(root.style.getPropertyValue('--bell-centre-x')).toBe('1024px');
    expect(root.style.getPropertyValue('--app-top-overhang')).toBe('61px');

    unmount();

    expect(root.style.getPropertyValue('--bell-centre-x')).toBe('');
    expect(root.style.getPropertyValue('--app-top-overhang')).toBe('');
  });
});
