import { renderHook } from '@testing-library/react';
import type { RefObject } from 'react';

import useNoticeClearance from '@/components/ui-bell-notice/use-notice-clearance';
import type { NotificationViewSet } from '@/lib/notifications/types/notification-view';
import stubResizeObserver, { removeResizeObserver } from '@tests/unit/utils/stub-resize-observer';

const root = document.documentElement;

const rows = (): NotificationViewSet => ({
  items: [{ id: '1', kind: 'success', message: 'Зміни збережено' }],
});

const card = (bottom: number): RefObject<HTMLElement | null> => {
  const element = document.createElement('div');
  element.getBoundingClientRect = (): DOMRect => ({ bottom }) as DOMRect;
  document.body.appendChild(element);
  return { current: element };
};

const nextFrame = (): Promise<void> =>
  new Promise((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });

const overhang = (): string => root.style.getPropertyValue('--app-top-overhang');

describe('useNoticeClearance', () => {
  let scrollBy: jest.Mock;

  beforeEach(() => {
    scrollBy = jest.fn();
    Object.defineProperty(window, 'scrollBy', { configurable: true, value: scrollBy });
  });

  afterEach(() => {
    root.style.removeProperty('--app-top-overhang');
    Reflect.deleteProperty(window, 'scrollBy');
    removeResizeObserver();
    document.body.replaceChildren();
  });

  it('sets the overhang to the card bottom minus the 64 px header', () => {
    renderHook(() => useNoticeClearance(card(125), rows()));

    expect(overhang()).toBe('61px');
  });

  it('never sets a negative overhang', () => {
    renderHook(() => useNoticeClearance(card(40), rows()));

    expect(overhang()).toBe('0px');
  });

  it('measures again when the content above the focused control changes height', () => {
    const { fire } = stubResizeObserver();
    const ref = card(125);
    renderHook(() => useNoticeClearance(ref, rows()));
    (ref.current as HTMLElement).getBoundingClientRect = (): DOMRect =>
      ({ bottom: 150 }) as DOMRect;

    fire();

    expect(overhang()).toBe('86px');
  });

  it('removes the overhang when the card unmounts', () => {
    const { unmount } = renderHook(() => useNoticeClearance(card(125), rows()));

    unmount();

    expect(overhang()).toBe('');
  });

  it('removes the overhang when the card is gone', () => {
    root.style.setProperty('--app-top-overhang', '61px');

    renderHook(() => useNoticeClearance({ current: null }, rows()));

    expect(overhang()).toBe('');
  });

  it('measures again when the rows change and when the window is resized', async () => {
    const ref = card(125);
    const { rerender } = renderHook(({ views }) => useNoticeClearance(ref, views), {
      initialProps: { views: rows() },
    });
    const element = ref.current as HTMLElement;
    element.getBoundingClientRect = (): DOMRect => ({ bottom: 200 }) as DOMRect;

    rerender({ views: rows() });
    expect(overhang()).toBe('136px');

    element.getBoundingClientRect = (): DOMRect => ({ bottom: 150 }) as DOMRect;
    window.dispatchEvent(new Event('resize'));
    await nextFrame();
    expect(overhang()).toBe('86px');
  });

  it('measures the card of the latest render', () => {
    const views = rows();
    const { rerender } = renderHook(({ ref }) => useNoticeClearance(ref, views), {
      initialProps: { ref: card(125) },
    });

    rerender({ ref: card(200) });

    expect(overhang()).toBe('136px');
  });

  it('hands back a measurement for the caller to run once the card has settled', () => {
    const ref = card(117);
    const { result } = renderHook(() => useNoticeClearance(ref, rows()));
    expect(overhang()).toBe('53px');
    const element = ref.current as HTMLElement;
    element.getBoundingClientRect = (): DOMRect => ({ bottom: 125 }) as DOMRect;

    result.current();

    expect(overhang()).toBe('61px');
  });

  it('stops listening to resize after unmount', async () => {
    const ref = card(125);
    const { unmount } = renderHook(() => useNoticeClearance(ref, rows()));
    unmount();

    window.dispatchEvent(new Event('resize'));
    await nextFrame();

    expect(overhang()).toBe('');
  });

  describe('a focused control the header and the card hide', () => {
    const CARD = { bottom: 125, left: 100, right: 300 } as DOMRect;

    const HIDDEN = { top: 73, bottom: 113, left: 120, right: 280 };

    interface Held {
      readonly host?: string;
      readonly keyboard?: boolean;
      readonly rect?: Partial<DOMRect>;
    }

    const withKeyboard = (element: HTMLElement, keyboard: boolean): void => {
      const matches = element.matches.bind(element);
      jest
        .spyOn(element, 'matches')
        .mockImplementation((selector) =>
          selector === ':focus-visible' ? keyboard : matches(selector)
        );
    };

    const hold = ({ host = 'main', keyboard = true, rect = {} }: Held = {}): void => {
      const parent = document.createElement(host);
      const control = document.createElement('button');
      control.getBoundingClientRect = (): DOMRect => ({ ...HIDDEN, ...rect }) as DOMRect;
      withKeyboard(control, keyboard);
      parent.appendChild(control);
      document.body.appendChild(parent);
      control.focus();
    };

    const shown = (): RefObject<HTMLElement | null> => {
      const ref = card(125);
      (ref.current as HTMLElement).getBoundingClientRect = (): DOMRect => CARD;

      return ref;
    };

    const measure = (): void => {
      renderHook(() => useNoticeClearance(shown(), rows()));
    };

    it('is scrolled back when it takes focus after the card was shown', async () => {
      const ref = shown();
      renderHook(() => useNoticeClearance(ref, rows()));

      hold();
      expect(scrollBy).not.toHaveBeenCalled();
      await nextFrame();

      expect(scrollBy).toHaveBeenCalledTimes(1);
      expect(scrollBy).toHaveBeenCalledWith({ top: -52 });
    });

    it('is not followed any more once the card is gone', async () => {
      const ref = shown();
      const { unmount } = renderHook(() => useNoticeClearance(ref, rows()));
      unmount();

      hold();
      await nextFrame();

      expect(scrollBy).not.toHaveBeenCalled();
    });

    it.each([
      ['one pixel shows below the header', { top: 40, bottom: 65 }, -85],
      ['it ends exactly at the card bottom', { top: 100, bottom: 125 }, -25],
      ['its sides are the sides of the card', { left: 100, right: 300 }, -52],
      ['it starts on a half pixel', { top: 99.5, bottom: 120 }, -26],
    ])('is scrolled back when %s', (_name, rect, top) => {
      hold({ rect });

      measure();

      expect(scrollBy).toHaveBeenCalledTimes(1);
      expect(scrollBy).toHaveBeenCalledWith({ top });
    });

    it('is scrolled back in the footer too', () => {
      hold({ host: 'footer' });

      measure();

      expect(scrollBy).toHaveBeenCalledWith({ top: -52 });
    });

    it.each<[string, Held]>([
      ['the header alone hides it', { rect: { top: 40, bottom: 64 } }],
      ['it shows below the card', { rect: { bottom: 126 } }],
      ['it shows left of the card', { rect: { left: 99 } }],
      ['it shows right of the card', { rect: { right: 301 } }],
      ['it is a header control', { host: 'header' }],
      ['it is in a menu or a drawer outside the page', { host: 'div' }],
      ['a pointer focused it', { keyboard: false }],
    ])('is left alone when %s', (_name, held) => {
      hold(held);

      measure();

      expect(scrollBy).not.toHaveBeenCalled();
    });

    it('is left alone when it is the main landmark itself', () => {
      const main = document.createElement('main');
      main.tabIndex = -1;
      main.getBoundingClientRect = (): DOMRect => HIDDEN as DOMRect;
      withKeyboard(main, true);
      document.body.appendChild(main);
      main.focus();

      measure();

      expect(scrollBy).not.toHaveBeenCalled();
    });

    it('is left alone when it is the card itself that holds focus', () => {
      const ref = shown();
      const inside = document.createElement('button');
      inside.getBoundingClientRect = (): DOMRect => HIDDEN as DOMRect;
      withKeyboard(inside, true);
      ref.current?.appendChild(inside);
      inside.focus();

      renderHook(() => useNoticeClearance(ref, rows()));

      expect(scrollBy).not.toHaveBeenCalled();
    });

    it('is not looked for when nothing holds focus', () => {
      measure();

      expect(scrollBy).not.toHaveBeenCalled();
    });

    it('is not looked for when a drawing holds focus', () => {
      const main = document.body.appendChild(document.createElement('main'));
      const drawing = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      drawing.setAttribute('tabindex', '0');
      drawing.getBoundingClientRect = (): DOMRect => HIDDEN as DOMRect;
      jest.spyOn(drawing, 'matches').mockReturnValue(true);
      main.appendChild(drawing);
      drawing.focus();

      measure();

      expect(scrollBy).not.toHaveBeenCalled();
    });
  });
});
