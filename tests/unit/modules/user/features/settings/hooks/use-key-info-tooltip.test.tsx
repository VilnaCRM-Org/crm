import { act, renderHook } from '@testing-library/react';

import useKeyInfoTooltip from '@/modules/user/features/settings/hooks/use-key-info-tooltip';

const setup = (): {
  result: { current: ReturnType<typeof useKeyInfoTooltip> };
  anchor: HTMLElement;
  unmount: () => void;
} => {
  const anchor = document.createElement('div');
  document.body.appendChild(anchor);
  const { result, unmount } = renderHook(() => useKeyInfoTooltip());
  result.current.anchorRef.current = anchor;
  return { result, anchor, unmount };
};

const press = (key: string): void => {
  act(() => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key }));
  });
};

const pointerDownOn = (target: EventTarget): void => {
  act(() => {
    target.dispatchEvent(new Event('pointerdown', { bubbles: true }));
  });
};

describe('useKeyInfoTooltip', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    jest.restoreAllMocks();
  });

  it('starts closed', () => {
    expect(setup().result.current.open).toBe(false);
  });

  it.each([
    ['hover', 'onMouseEnter', 'onMouseLeave'],
    ['focus', 'onFocus', 'onBlur'],
  ] as const)('opens on %s and closes when it ends', (_name, begin, end) => {
    const { result } = setup();

    act(() => result.current.handlers[begin]());
    expect(result.current.open).toBe(true);

    act(() => result.current.handlers[end]());
    expect(result.current.open).toBe(false);
  });

  it('stays open while focus remains after the pointer leaves', () => {
    const { result } = setup();
    act(() => result.current.handlers.onMouseEnter());
    act(() => result.current.handlers.onFocus());

    act(() => result.current.handlers.onMouseLeave());

    expect(result.current.open).toBe(true);
  });

  it('closes on Escape and ignores every other key', () => {
    const { result } = setup();
    act(() => result.current.handlers.onFocus());

    press('Enter');
    expect(result.current.open).toBe(true);

    press('Escape');
    expect(result.current.open).toBe(false);
  });

  it('reopens on a click after Escape, without needing to leave first', () => {
    const { result } = setup();
    act(() => result.current.handlers.onFocus());
    press('Escape');

    act(() => result.current.handlers.onClick());

    expect(result.current.open).toBe(true);
  });

  it('stays dismissed through more hover until both triggers end', () => {
    const { result } = setup();
    act(() => result.current.handlers.onMouseEnter());
    press('Escape');

    act(() => result.current.handlers.onFocus());
    expect(result.current.open).toBe(false);

    act(() => result.current.handlers.onBlur());
    act(() => result.current.handlers.onMouseLeave());
    act(() => result.current.handlers.onMouseEnter());
    expect(result.current.open).toBe(true);
  });

  it('opens on a tap and stays open when tapped again', () => {
    const { result } = setup();
    expect(result.current.open).toBe(false);

    act(() => result.current.handlers.onClick());
    expect(result.current.open).toBe(true);

    act(() => result.current.handlers.onClick());
    expect(result.current.open).toBe(true);
  });

  it('closes on a pointer press outside the anchor, clearing every trigger', () => {
    const { result } = setup();
    act(() => result.current.handlers.onMouseEnter());
    act(() => result.current.handlers.onClick());

    pointerDownOn(document.body);

    expect(result.current.open).toBe(false);
    act(() => result.current.handlers.onMouseEnter());
    expect(result.current.open).toBe(true);
  });

  it('stays open on a pointer press inside the anchor', () => {
    const { result, anchor } = setup();
    act(() => result.current.handlers.onClick());

    pointerDownOn(anchor);

    expect(result.current.open).toBe(true);
  });

  it('listens only while open and removes both listeners', () => {
    const added = jest.spyOn(document, 'addEventListener');
    const removed = jest.spyOn(document, 'removeEventListener');
    const { result, unmount } = setup();
    expect(added.mock.calls.filter(([type]) => type === 'keydown')).toHaveLength(0);

    act(() => result.current.handlers.onFocus());
    const keydown = added.mock.calls.find(([type]) => type === 'keydown')?.[1];
    const pointerdown = added.mock.calls.find(([type]) => type === 'pointerdown')?.[1];

    unmount();

    expect(keydown).toBeInstanceOf(Function);
    expect(removed).toHaveBeenCalledWith('keydown', keydown);
    expect(removed).toHaveBeenCalledWith('pointerdown', pointerdown);
  });
});
