import { renderHook } from '@testing-library/react';

import useBellEscape from '@/modules/user/features/notifications/hooks/use-bell-escape';

const escape = (target: Element): void => {
  target.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
};

describe('useBellEscape', () => {
  afterEach(() => document.body.replaceChildren());

  it('takes no key of a control while its wrapper and its bell are not mounted', () => {
    const close = jest.fn();
    const control = document.body.appendChild(document.createElement('button'));
    const gone = { bell: { current: null }, wrapper: { current: null } };
    renderHook(() => useBellEscape({ expanded: true, close, ...gone }));

    escape(control);
    expect(close).not.toHaveBeenCalled();

    escape(document.body);
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('goes through the refs and the close of the latest render', () => {
    const [first, second] = [jest.fn(), jest.fn()];
    const bell = document.body.appendChild(document.createElement('button'));
    const { rerender } = renderHook(
      ({ close, current }: { close: () => void; current: HTMLButtonElement | null }) =>
        useBellEscape({
          expanded: true,
          close,
          bell: { current },
          wrapper: { current: null },
        }),
      { initialProps: { close: first, current: null as HTMLButtonElement | null } }
    );

    rerender({ close: second, current: bell });
    escape(document.body);

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
    expect(bell).toHaveFocus();
  });
});
