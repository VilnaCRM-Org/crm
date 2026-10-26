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
    expect(renderHook(() => useFooterInset()).result.current).toBe(0);
  });

  it('stops the scrim at the top of a footer in view', () => {
    mountFooter(678);

    expect(renderHook(() => useFooterInset()).result.current).toBe(40);
  });

  it('leaves the scrim on the whole viewport while the footer is below it', () => {
    mountFooter(900);

    expect(renderHook(() => useFooterInset()).result.current).toBe(0);
  });

  it('never insets the scrim by more than the viewport', () => {
    mountFooter(-20);

    expect(renderHook(() => useFooterInset()).result.current).toBe(VIEWPORT);
  });

  it('ignores a footer that belongs to the page content inside main', () => {
    mountFooter(600, document.body.appendChild(document.createElement('main')));

    expect(renderHook(() => useFooterInset()).result.current).toBe(0);
  });

  it('measures the page footer even when a footer inside main comes first', () => {
    mountFooter(600, document.body.appendChild(document.createElement('main')));
    mountFooter(678);

    expect(renderHook(() => useFooterInset()).result.current).toBe(40);
  });

  it('measures again on a viewport resize', () => {
    const footer = mountFooter(678);
    const { result } = renderHook(() => useFooterInset());

    footer.getBoundingClientRect = (): DOMRect => ({ top: 618 }) as DOMRect;
    resize();

    expect(result.current).toBe(100);
  });

  it('stops listening for resizes once it unmounts', () => {
    const add = jest.spyOn(window, 'addEventListener');
    const remove = jest.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useFooterInset());
    const added = add.mock.calls.find(([type]) => type === 'resize');

    unmount();

    expect(added).toBeDefined();
    expect(remove).toHaveBeenCalledWith('resize', added?.[1]);
    add.mockRestore();
    remove.mockRestore();
  });
});
