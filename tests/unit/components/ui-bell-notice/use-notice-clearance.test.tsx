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
    removeResizeObserver();

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

  describe('a focused page control the card has just covered', () => {
    const focusAt = (top: number): HTMLElement => {
      const button = document.createElement('button');
      button.getBoundingClientRect = (): DOMRect => ({ top }) as DOMRect;
      document.body.appendChild(button);
      button.focus();
      return button;
    };

    it('is scrolled back when it takes focus after the card was shown', async () => {
      renderHook(() => useNoticeClearance(card(125), rows()));

      focusAt(73);
      expect(scrollBy).not.toHaveBeenCalled();
      await nextFrame();

      expect(scrollBy).toHaveBeenCalledTimes(1);
      expect(scrollBy).toHaveBeenCalledWith({ top: -52 });
    });

    it('is not followed any more once the card is gone', async () => {
      const { unmount } = renderHook(() => useNoticeClearance(card(125), rows()));
      unmount();

      focusAt(73);
      await nextFrame();

      expect(scrollBy).not.toHaveBeenCalled();
    });

    it.each([
      ['left of', { left: 0, right: 100 }, false],
      ['right of', { left: 300, right: 400 }, false],
      ['one pixel under the left edge of', { left: 0, right: 101 }, true],
      ['one pixel under the right edge of', { left: 299, right: 400 }, true],
    ])('takes a control %s the card into account only if covered', (_name, sides, covered) => {
      const button = document.createElement('button');
      button.getBoundingClientRect = (): DOMRect => ({ top: 100, ...sides }) as DOMRect;
      document.body.appendChild(button);
      button.focus();
      const ref = card(125);
      (ref.current as HTMLElement).getBoundingClientRect = (): DOMRect =>
        ({ bottom: 125, left: 100, right: 300 }) as DOMRect;

      renderHook(() => useNoticeClearance(ref, rows()));

      expect(scrollBy).toHaveBeenCalledTimes(covered ? 1 : 0);
    });

    it('is scrolled back by the part the card covers', () => {
      focusAt(100);

      renderHook(() => useNoticeClearance(card(125), rows()));

      expect(scrollBy).toHaveBeenCalledTimes(1);
      expect(scrollBy).toHaveBeenCalledWith({ top: -25 });
    });

    it('rounds a sub-pixel cover up to a whole pixel', () => {
      focusAt(99.5);

      renderHook(() => useNoticeClearance(card(125), rows()));

      expect(scrollBy).toHaveBeenCalledWith({ top: -26 });
    });

    it('is left alone when it sits at or below the card bottom', () => {
      focusAt(125);

      renderHook(() => useNoticeClearance(card(125), rows()));

      expect(scrollBy).not.toHaveBeenCalled();
    });

    it('is scrolled back when it starts exactly at the 64 px line', () => {
      focusAt(64);

      renderHook(() => useNoticeClearance(card(125), rows()));

      expect(scrollBy).toHaveBeenCalledWith({ top: -61 });
    });

    it('is left alone when it is outside the page and starts above the 64 px line', () => {
      focusAt(63);

      renderHook(() => useNoticeClearance(card(125), rows()));

      expect(scrollBy).not.toHaveBeenCalled();
    });

    describe('that starts above the 64 px line', () => {
      const CARD = { bottom: 125, left: 100, right: 300 } as DOMRect;

      interface Held {
        readonly host?: string;
        readonly keyboard?: boolean;
        readonly rect: Partial<DOMRect>;
      }

      const hold = ({ host = 'main', keyboard = true, rect }: Held): void => {
        const parent = document.createElement(host);
        const control = document.createElement('button');
        control.getBoundingClientRect = (): DOMRect =>
          ({ left: 100, right: 300, ...rect }) as DOMRect;
        const matches = control.matches.bind(control);
        jest
          .spyOn(control, 'matches')
          .mockImplementation((selector) =>
            selector === ':focus-visible' ? keyboard : matches(selector)
          );
        parent.appendChild(control);
        document.body.appendChild(parent);
        control.focus();
      };

      const measure = (): void => {
        const ref = card(125);
        (ref.current as HTMLElement).getBoundingClientRect = (): DOMRect => CARD;
        renderHook(() => useNoticeClearance(ref, rows()));
      };

      it.each([
        ['one pixel shows below the header', { top: 40, bottom: 65 }, -85],
        ['it ends exactly at the card bottom', { top: 40, bottom: 125 }, -85],
        ['it starts one pixel above the line', { top: 63, bottom: 100 }, -62],
      ])('is scrolled back when %s', (_name, rect, top) => {
        hold({ rect });

        measure();

        expect(scrollBy).toHaveBeenCalledTimes(1);
        expect(scrollBy).toHaveBeenCalledWith({ top });
      });

      it('is scrolled back in the footer too', () => {
        hold({ host: 'footer', rect: { top: 40, bottom: 100 } });

        measure();

        expect(scrollBy).toHaveBeenCalledWith({ top: -85 });
      });

      it.each<[string, Held]>([
        ['the header alone hides it', { rect: { top: 40, bottom: 64 } }],
        ['it shows below the card', { rect: { top: 40, bottom: 126 } }],
        ['it shows left of the card', { rect: { top: 40, bottom: 100, left: 99 } }],
        ['it shows right of the card', { rect: { top: 40, bottom: 100, right: 301 } }],
        ['it is a header control', { host: 'header', rect: { top: 40, bottom: 100 } }],
        ['it is in a portal', { host: 'div', rect: { top: 40, bottom: 100 } }],
        ['a pointer focused it', { keyboard: false, rect: { top: 40, bottom: 100 } }],
      ])('is left alone when %s', (_name, held) => {
        hold(held);

        measure();

        expect(scrollBy).not.toHaveBeenCalled();
      });

      it('is left alone when it is the main landmark itself', () => {
        const main = document.createElement('main');
        main.tabIndex = -1;
        main.getBoundingClientRect = (): DOMRect =>
          ({ top: 40, bottom: 100, left: 100, right: 300 }) as DOMRect;
        jest.spyOn(main, 'matches').mockImplementation((selector) => selector === ':focus-visible');
        document.body.appendChild(main);
        main.focus();

        measure();

        expect(scrollBy).not.toHaveBeenCalled();
      });
    });

    it('is left alone when it is the card itself that holds focus', () => {
      const ref = card(125);
      const inside = document.createElement('button');
      inside.getBoundingClientRect = (): DOMRect => ({ top: 100 }) as DOMRect;
      ref.current?.appendChild(inside);
      inside.focus();

      renderHook(() => useNoticeClearance(ref, rows()));

      expect(scrollBy).not.toHaveBeenCalled();
    });

    it('is not looked for when nothing holds focus', () => {
      renderHook(() => useNoticeClearance(card(125), rows()));

      expect(scrollBy).not.toHaveBeenCalled();
    });
  });
});
