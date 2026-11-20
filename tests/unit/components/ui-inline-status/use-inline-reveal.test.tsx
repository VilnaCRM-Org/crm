import '@testing-library/jest-dom';
import { renderHook } from '@testing-library/react';
import type { RefObject } from 'react';

import useInlineReveal from '@/components/ui-inline-status/use-inline-reveal';
import type { NotificationViewSet } from '@/lib/notifications/types/notification-view';
import stubMotionPreference from '@tests/unit/utils/stub-motion-preference';

const VIEWPORT = 800;

const batch = (): NotificationViewSet => ({
  items: [{ id: '1', kind: 'success', message: 'Зміни збережено' }],
});

const block = (top: number, bottom: number): RefObject<HTMLElement | null> => {
  const element = document.createElement('div');
  element.getBoundingClientRect = (): DOMRect => ({ top, bottom }) as DOMRect;
  element.scrollIntoView = jest.fn();
  document.body.appendChild(element);
  return { current: element };
};

const scroll = (ref: RefObject<HTMLElement | null>): jest.Mock =>
  ref.current?.scrollIntoView as jest.Mock;

describe('useInlineReveal', () => {
  beforeEach(() => {
    stubMotionPreference(false);
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: VIEWPORT });
  });

  afterEach(() => {
    Reflect.deleteProperty(window, 'matchMedia');
    document.body.replaceChildren();
  });

  it('leaves a block that is wholly inside the viewport where it is', () => {
    const ref = block(100, 200);

    renderHook(() => useInlineReveal(ref, batch()));

    expect(scroll(ref)).not.toHaveBeenCalled();
  });

  it('treats a block touching both viewport edges as wholly visible', () => {
    const ref = block(0, VIEWPORT);

    renderHook(() => useInlineReveal(ref, batch()));

    expect(scroll(ref)).not.toHaveBeenCalled();
  });

  it('scrolls once with block nearest when the block extends below the viewport', () => {
    const ref = block(700, VIEWPORT + 1);

    renderHook(() => useInlineReveal(ref, batch()));

    expect(scroll(ref)).toHaveBeenCalledTimes(1);
    expect(scroll(ref)).toHaveBeenCalledWith({ block: 'nearest', behavior: 'smooth' });
  });

  it('scrolls when the block starts above the viewport', () => {
    const ref = block(-1, 100);

    renderHook(() => useInlineReveal(ref, batch()));

    expect(scroll(ref)).toHaveBeenCalledTimes(1);
  });

  it('uses behavior auto under reduced motion', () => {
    stubMotionPreference(true);
    const ref = block(700, 900);

    renderHook(() => useInlineReveal(ref, batch()));

    expect(scroll(ref)).toHaveBeenCalledWith({ block: 'nearest', behavior: 'auto' });
  });

  it('never moves focus', () => {
    const ref = block(700, 900);
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    renderHook(() => useInlineReveal(ref, batch()));

    expect(input).toHaveFocus();
  });

  it('does nothing while the ref holds no element', () => {
    const empty: RefObject<HTMLElement | null> = { current: null };

    expect(() => renderHook(() => useInlineReveal(empty, batch()))).not.toThrow();
  });

  it('reveals again when a new batch arrives', () => {
    const ref = block(700, 900);
    const first = batch();
    const { rerender } = renderHook(({ views }) => useInlineReveal(ref, views), {
      initialProps: { views: first },
    });

    rerender({ views: first });
    expect(scroll(ref)).toHaveBeenCalledTimes(1);

    rerender({ views: batch() });
    expect(scroll(ref)).toHaveBeenCalledTimes(2);
  });
});
