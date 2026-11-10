import { renderHook } from '@testing-library/react';
import { createRef, type RefObject } from 'react';

import useKeyInfoDismissal from '@/modules/user/features/settings/hooks/use-key-info-dismissal';

interface Mounted {
  onEscape: jest.Mock;
  onOutside: jest.Mock;
  anchor: HTMLElement;
  child: HTMLElement;
  rerender: (props: { open: boolean }) => void;
  unmount: () => void;
}

const mount = (open: boolean): Mounted => {
  const anchor = document.createElement('div');
  const child = document.createElement('span');
  anchor.appendChild(child);
  document.body.appendChild(anchor);
  const anchorRef: RefObject<HTMLElement | null> = createRef<HTMLElement>();
  anchorRef.current = anchor;
  const dismissal = { onEscape: jest.fn(), onOutside: jest.fn() };
  const { rerender, unmount } = renderHook(
    ({ open: current }) => useKeyInfoDismissal(current, anchorRef, dismissal),
    { initialProps: { open } }
  );
  return { ...dismissal, anchor, child, rerender, unmount };
};

const press = (key: string): void => {
  document.dispatchEvent(new KeyboardEvent('keydown', { key }));
};

const pointerDownOn = (target: EventTarget): void => {
  target.dispatchEvent(new Event('pointerdown', { bubbles: true }));
};

afterEach(() => {
  document.body.innerHTML = '';
});

describe('useKeyInfoDismissal', () => {
  it('calls onEscape on Escape while open', () => {
    const { onEscape, onOutside } = mount(true);

    press('Escape');

    expect(onEscape).toHaveBeenCalledTimes(1);
    expect(onOutside).not.toHaveBeenCalled();
  });

  it('ignores any other key', () => {
    const { onEscape } = mount(true);

    press('Enter');

    expect(onEscape).not.toHaveBeenCalled();
  });

  it('calls onOutside on a pointer down outside the anchor', () => {
    const { onOutside, onEscape } = mount(true);

    pointerDownOn(document.body);

    expect(onOutside).toHaveBeenCalledTimes(1);
    expect(onEscape).not.toHaveBeenCalled();
  });

  it.each(['anchor', 'child'] as const)('ignores a pointer down on the %s', (target) => {
    const mounted = mount(true);

    pointerDownOn(mounted[target]);

    expect(mounted.onOutside).not.toHaveBeenCalled();
  });

  it('treats a pointer down as outside once the anchor is gone', () => {
    const anchorRef: RefObject<HTMLElement | null> = createRef<HTMLElement>();
    const onOutside = jest.fn();
    renderHook(() => useKeyInfoDismissal(true, anchorRef, { onEscape: jest.fn(), onOutside }));

    pointerDownOn(document.body);

    expect(onOutside).toHaveBeenCalledTimes(1);
  });

  it('listens to nothing while closed', () => {
    const { onEscape, onOutside } = mount(false);

    press('Escape');
    pointerDownOn(document.body);

    expect(onEscape).not.toHaveBeenCalled();
    expect(onOutside).not.toHaveBeenCalled();
  });

  it('removes both listeners when it closes', () => {
    const { onEscape, onOutside, rerender } = mount(true);

    rerender({ open: false });
    press('Escape');
    pointerDownOn(document.body);

    expect(onEscape).not.toHaveBeenCalled();
    expect(onOutside).not.toHaveBeenCalled();
  });

  it('removes both listeners on unmount', () => {
    const { onEscape, onOutside, unmount } = mount(true);
    const remove = jest.spyOn(document, 'removeEventListener');

    unmount();
    press('Escape');
    pointerDownOn(document.body);

    expect(remove).toHaveBeenCalledWith('keydown', expect.any(Function));
    expect(remove).toHaveBeenCalledWith('pointerdown', expect.any(Function));
    expect(onEscape).not.toHaveBeenCalled();
    expect(onOutside).not.toHaveBeenCalled();
    remove.mockRestore();
  });

  it('starts listening when it opens', () => {
    const { onEscape, rerender } = mount(false);

    rerender({ open: true });
    press('Escape');

    expect(onEscape).toHaveBeenCalledTimes(1);
  });
});
