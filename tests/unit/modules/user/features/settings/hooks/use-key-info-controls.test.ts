import { renderHook } from '@testing-library/react';

import useKeyInfoControls from '@/modules/user/features/settings/hooks/use-key-info-controls';

const mount = (): {
  update: jest.Mock;
  result: { current: ReturnType<typeof useKeyInfoControls> };
  rerender: () => void;
} => {
  const update = jest.fn();
  const { result, rerender } = renderHook(() => useKeyInfoControls(update));
  return { update, result, rerender };
};

describe('useKeyInfoControls', () => {
  it.each([
    ['onMouseEnter', { hovered: true }],
    ['onMouseLeave', { hovered: false }],
    ['onFocus', { engaged: true }],
    ['onBlur', { engaged: false }],
    ['onClick', { engaged: true, dismissed: false }],
  ] as const)('%s sends %o to the update', (name, change) => {
    const { update, result } = mount();

    result.current[name]();

    expect(update).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledWith(change);
  });

  it('keeps the same handlers across renders', () => {
    const { result, rerender } = mount();
    const first = result.current;

    rerender();

    expect(result.current).toBe(first);
  });

  it('sends nothing until a handler fires', () => {
    expect(mount().update).not.toHaveBeenCalled();
  });
});
