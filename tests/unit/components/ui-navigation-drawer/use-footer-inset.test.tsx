import '@testing-library/jest-dom';
import { act, renderHook } from '@testing-library/react';

import useFooterInset from '@/components/ui-navigation-drawer/use-footer-inset';

const VIEWPORT = 718;

const mountFooter = (top: number, parent: HTMLElement = document.body): HTMLElement => {
  const footer = document.createElement('footer');
  footer.getBoundingClientRect = (): DOMRect => ({ top }) as DOMRect;
  parent.append(footer);

  return footer;
};

const resize = (): void =>
  act(() => {
    window.dispatchEvent(new Event('resize'));
  });

const insetOf = (): string => {
  const scrim = document.createElement('div');
  renderHook(() => useFooterInset()).result.current(scrim);

  return scrim.style.bottom;
};

describe('useFooterInset', () => {
  const original = window.innerHeight;

  beforeEach(() => {
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: VIEWPORT });
  });

  afterEach(() => {
    document.body.replaceChildren();
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: original });
  });

  it('leaves the scrim on the whole viewport when the page has no footer', () => {
    expect(insetOf()).toBe('0px');
  });

  it('stops the scrim at the top of a footer in view', () => {
    mountFooter(678);

    expect(insetOf()).toBe('40px');
  });

  it('leaves the scrim on the whole viewport while the footer is below it', () => {
    mountFooter(900);

    expect(insetOf()).toBe('0px');
  });

  it('never insets the scrim by more than the viewport', () => {
    mountFooter(-20);

    expect(insetOf()).toBe(`${VIEWPORT}px`);
  });

  it('ignores a footer that belongs to the page content inside main', () => {
    mountFooter(600, document.body.appendChild(document.createElement('main')));

    expect(insetOf()).toBe('0px');
  });

  it('measures the page footer even when a footer inside main comes first', () => {
    mountFooter(600, document.body.appendChild(document.createElement('main')));
    mountFooter(678);

    expect(insetOf()).toBe('40px');
  });

  it('measures again on a viewport resize', () => {
    const footer = mountFooter(678);
    const scrim = document.createElement('div');
    renderHook(() => useFooterInset()).result.current(scrim);

    footer.getBoundingClientRect = (): DOMRect => ({ top: 618 }) as DOMRect;
    resize();

    expect(scrim).toHaveStyle({ bottom: '100px' });
  });

  it('hands every render the same ref, so the scrim subscribes once', () => {
    const { result, rerender } = renderHook(() => useFooterInset());
    const first = result.current;

    rerender();

    expect(result.current).toBe(first);
  });

  it('stops listening for resizes when its cleanup runs', () => {
    const add = jest.spyOn(window, 'addEventListener');
    const remove = jest.spyOn(window, 'removeEventListener');
    const cleanup = renderHook(() => useFooterInset()).result.current(
      document.createElement('div')
    );
    const added = add.mock.calls.find(([type]) => type === 'resize');

    act(() => cleanup?.());

    expect(added).toBeDefined();
    expect(remove).toHaveBeenCalledWith('resize', added?.[1]);
    add.mockRestore();
    remove.mockRestore();
  });

  it('subscribes nothing when React detaches the ref', () => {
    const add = jest.spyOn(window, 'addEventListener');

    const cleanup = renderHook(() => useFooterInset()).result.current(null);

    expect(cleanup).toBeUndefined();
    expect(add.mock.calls.filter(([type]) => type === 'resize')).toHaveLength(0);
    add.mockRestore();
  });
});
