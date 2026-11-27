import { renderHook } from '@testing-library/react';
import type { RefObject } from 'react';

import useOutsideClose from '@/modules/user/features/notifications/hooks/use-bell-outside-close';

interface Mounted {
  readonly node: HTMLDivElement;
  readonly inner: HTMLButtonElement;
}

const mount = (): Mounted => {
  const node = document.createElement('div');
  const inner = document.createElement('button');
  node.appendChild(inner);
  document.body.appendChild(node);

  return { node, inner };
};

const pointerDown = (target: Element): void => {
  target.dispatchEvent(new Event('pointerdown', { bubbles: true, composed: true }));
};

describe('useBellOutsideClose', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    jest.restoreAllMocks();
  });

  it('closes on a pointerdown outside the wrapper and ignores one inside it', () => {
    const { node, inner } = mount();
    const wrapper: RefObject<HTMLDivElement | null> = { current: node };
    const { node: outside } = mount();
    const close = jest.fn();
    renderHook(() => useOutsideClose({ expanded: true, close, wrapper }));

    pointerDown(inner);
    pointerDown(node);
    expect(close).not.toHaveBeenCalled();

    pointerDown(outside);
    expect(close).toHaveBeenCalledTimes(1);

    pointerDown(document.body);
    expect(close).toHaveBeenCalledTimes(2);
  });

  it('treats a wrapper that is not mounted as outside', () => {
    const wrapper: RefObject<HTMLDivElement | null> = { current: null };
    const close = jest.fn();
    renderHook(() => useOutsideClose({ expanded: true, close, wrapper }));

    pointerDown(document.body);

    expect(close).toHaveBeenCalledTimes(1);
  });

  it('listens in the capture phase only while expanded and removes the same handler', () => {
    const add = jest.spyOn(document, 'addEventListener');
    const remove = jest.spyOn(document, 'removeEventListener');
    const wrapper: RefObject<HTMLDivElement | null> = { current: mount().node };
    const close = jest.fn();
    const { rerender, unmount } = renderHook(
      ({ expanded }) => useOutsideClose({ expanded, close, wrapper }),
      { initialProps: { expanded: false } }
    );
    expect(add).not.toHaveBeenCalledWith('pointerdown', expect.anything(), true);

    rerender({ expanded: true });
    const handler = add.mock.calls.find(([type]) => type === 'pointerdown')?.[1];
    expect(add).toHaveBeenCalledWith('pointerdown', handler, true);

    rerender({ expanded: false });
    expect(remove).toHaveBeenCalledWith('pointerdown', handler, true);
    pointerDown(document.body);
    expect(close).not.toHaveBeenCalled();

    rerender({ expanded: true });
    unmount();
    pointerDown(document.body);
    expect(close).not.toHaveBeenCalled();
  });
});
