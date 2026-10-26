import { act, renderHook } from '@testing-library/react';

import useRailTooltip from '@/components/ui-navigation-list/use-rail-tooltip';

const enter = (handler: ((event: never) => void) | undefined): void =>
  act(() => handler?.({} as never));

const press = (value: string): void =>
  act(() => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: value }));
  });

describe('useRailTooltip', () => {
  it('starts hidden', () => {
    expect(renderHook(() => useRailTooltip()).result.current.visible).toBe(false);
  });

  it('shows on hover and hides when the pointer leaves', () => {
    const { result } = renderHook(() => useRailTooltip());

    enter(result.current.handlers.onMouseEnter);
    expect(result.current.visible).toBe(true);

    enter(result.current.handlers.onMouseLeave);
    expect(result.current.visible).toBe(false);
  });

  it('shows on focus and hides on blur', () => {
    const { result } = renderHook(() => useRailTooltip());

    enter(result.current.handlers.onFocus);
    expect(result.current.visible).toBe(true);

    enter(result.current.handlers.onBlur);
    expect(result.current.visible).toBe(false);
  });

  it('hides a hovered tooltip on an Escape pressed anywhere in the document', () => {
    const { result } = renderHook(() => useRailTooltip());

    enter(result.current.handlers.onMouseEnter);
    press('Escape');

    expect(result.current.visible).toBe(false);
  });

  it('stays hidden after Escape while the pointer or focus remains', () => {
    const { result } = renderHook(() => useRailTooltip());

    enter(result.current.handlers.onFocus);
    press('Escape');
    enter(result.current.handlers.onMouseEnter);

    expect(result.current.visible).toBe(false);
  });

  it('shows again after a dismissed tooltip is left and entered anew', () => {
    const { result } = renderHook(() => useRailTooltip());

    enter(result.current.handlers.onFocus);
    press('Escape');
    enter(result.current.handlers.onBlur);
    enter(result.current.handlers.onFocus);

    expect(result.current.visible).toBe(true);
  });

  it('ignores every other key', () => {
    const { result } = renderHook(() => useRailTooltip());

    enter(result.current.handlers.onFocus);
    press('Enter');

    expect(result.current.visible).toBe(true);
  });

  it('stops listening for Escape once the tooltip is hidden', () => {
    const { result } = renderHook(() => useRailTooltip());

    enter(result.current.handlers.onMouseEnter);
    enter(result.current.handlers.onMouseLeave);
    press('Escape');
    enter(result.current.handlers.onMouseEnter);

    expect(result.current.visible).toBe(true);
  });

  it('does not listen for Escape before the tooltip is first shown', () => {
    const { result } = renderHook(() => useRailTooltip());

    press('Escape');
    enter(result.current.handlers.onMouseEnter);

    expect(result.current.visible).toBe(true);
  });

  it('removes the document listener it added when it unmounts', () => {
    const add = jest.spyOn(document, 'addEventListener');
    const remove = jest.spyOn(document, 'removeEventListener');
    const { result, unmount } = renderHook(() => useRailTooltip());

    enter(result.current.handlers.onMouseEnter);
    const added = add.mock.calls.find(([type]) => type === 'keydown');
    unmount();

    expect(added).toBeDefined();
    expect(remove).toHaveBeenCalledWith('keydown', added?.[1]);
    add.mockRestore();
    remove.mockRestore();
  });

  it('exposes no keydown handler on the wrapper', () => {
    const { result } = renderHook(() => useRailTooltip());

    expect(Object.keys(result.current.handlers).sort()).toEqual([
      'onBlur',
      'onFocus',
      'onMouseEnter',
      'onMouseLeave',
    ]);
  });
});
