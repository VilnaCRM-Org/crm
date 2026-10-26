import { act, renderHook } from '@testing-library/react';

import useChipNameGrowth from '@/modules/user/features/settings/hooks/use-chip-name-growth';
import stubResizeObserver, { removeResizeObserver } from '@tests/unit/utils/stub-resize-observer';

const sizerOf = (width: number): HTMLSpanElement => {
  const sizer = document.createElement('span');
  sizer.getBoundingClientRect = (): DOMRect => ({ width }) as DOMRect;

  return sizer;
};

const copiesOf = (...widths: number[]): readonly [HTMLDivElement, HTMLSpanElement[]] => {
  const copies = widths.map(sizerOf);
  const node = document.createElement('div');
  node.append(...copies);

  return [node, copies];
};

const sizersOf = (...widths: number[]): HTMLDivElement => copiesOf(...widths)[0];

describe('useChipNameGrowth', () => {
  afterEach(removeResizeObserver);

  it('grows by nothing until the sizers are measured', () => {
    stubResizeObserver();
    const { result } = renderHook(() => useChipNameGrowth());

    expect(result.current.grow).toBe(0);
  });

  it('grows by the spaced width less the rest width, rounded up to a whole pixel', () => {
    const observer = stubResizeObserver();
    const { result } = renderHook(() => useChipNameGrowth());

    act(() => {
      result.current.sizers(sizersOf(125.3, 100));
    });
    act(observer.fire);

    expect(result.current.grow).toBe(26);
  });

  it('grows by the width the enlarged name needs beyond its Figma width', () => {
    const observer = stubResizeObserver();
    const { result } = renderHook(() => useChipNameGrowth());
    const node = sizersOf(250, 200);
    node.style.setProperty('font-size', '28px');
    node.style.setProperty('--chip-name-base', '14px');

    act(() => {
      result.current.sizers(node);
    });
    act(observer.fire);

    expect(result.current.grow).toBe(150);
  });

  it('grows by the spacing alone when the text keeps its Figma size', () => {
    const observer = stubResizeObserver();
    const { result } = renderHook(() => useChipNameGrowth());
    const node = sizersOf(125.3, 100);
    node.style.setProperty('font-size', '16px');
    node.style.setProperty('--chip-name-base', '16px');

    act(() => {
      result.current.sizers(node);
    });
    act(observer.fire);

    expect(result.current.grow).toBe(26);
  });

  it('never shrinks the box when the spaced copy is the narrower one', () => {
    const observer = stubResizeObserver();
    const { result } = renderHook(() => useChipNameGrowth());

    act(() => {
      result.current.sizers(sizersOf(90, 100));
    });
    act(observer.fire);

    expect(result.current.grow).toBe(0);
  });

  it('grows by nothing when the sizers are missing', () => {
    const observer = stubResizeObserver();
    const { result } = renderHook(() => useChipNameGrowth());

    act(() => {
      result.current.sizers(sizersOf());
    });
    act(observer.fire);

    expect(result.current.grow).toBe(0);
  });

  it('observes both sizers with one observer and disconnects it on cleanup', () => {
    const observer = stubResizeObserver();
    const { result } = renderHook(() => useChipNameGrowth());
    const [node, copies] = copiesOf(120, 100);

    const cleanup = result.current.sizers(node);

    expect(observer.instances()).toBe(1);
    expect(observer.observed).toEqual(copies);
    expect(observer.disconnect).not.toHaveBeenCalled();
    expect(cleanup).toBeInstanceOf(Function);
    (cleanup as () => void)();
    expect(observer.disconnect).toHaveBeenCalledTimes(1);
  });

  it('does nothing for a detached node', () => {
    const observer = stubResizeObserver();
    const { result } = renderHook(() => useChipNameGrowth());

    expect(result.current.sizers(null)).toBeUndefined();
    expect(observer.instances()).toBe(0);
  });

  it('keeps the Figma box where ResizeObserver does not exist', () => {
    const { result } = renderHook(() => useChipNameGrowth());

    expect(result.current.sizers(sizersOf(130, 100))).toBeUndefined();
    expect(result.current.grow).toBe(0);
  });

  it('hands the same ref callback to every render', () => {
    stubResizeObserver();
    const { result, rerender } = renderHook(() => useChipNameGrowth());
    const first = result.current.sizers;

    rerender();

    expect(result.current.sizers).toBe(first);
  });
});
