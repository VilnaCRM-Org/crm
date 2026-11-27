import { renderHook } from '@testing-library/react';

import useDocumentEvent from '@/modules/user/features/notifications/hooks/use-document-event';
import type * as Bell from '@/modules/user/features/notifications/types/bell-disclosure';

type Options = Bell.DocumentEventOptions<'keydown' | 'keyup'>;

const press = (type: 'keydown' | 'keyup'): void => {
  document.dispatchEvent(new KeyboardEvent(type));
};

const options = (overrides: Partial<Options> = {}): Options => ({
  active: true,
  type: 'keydown',
  listener: jest.fn(),
  capture: false,
  ...overrides,
});

describe('useDocumentEvent', () => {
  afterEach(() => jest.restoreAllMocks());

  it('listens while active and stops when it is not, and on unmount', () => {
    const listener = jest.fn();
    const { rerender, unmount } = renderHook((props: Options) => useDocumentEvent(props), {
      initialProps: options({ listener, active: false }),
    });
    press('keydown');
    expect(listener).not.toHaveBeenCalled();

    rerender(options({ listener }));
    press('keydown');
    expect(listener).toHaveBeenCalledTimes(1);

    rerender(options({ listener, active: false }));
    press('keydown');
    rerender(options({ listener }));
    unmount();
    press('keydown');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('follows the type and the listener of the latest render', () => {
    const [first, second] = [jest.fn(), jest.fn()];
    const { rerender } = renderHook((props: Options) => useDocumentEvent(props), {
      initialProps: options({ listener: first }),
    });

    rerender(options({ listener: second, type: 'keyup' }));
    press('keydown');
    press('keyup');

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it.each([true, false])('adds and removes in the same phase, capture %s', (capture) => {
    const add = jest.spyOn(document, 'addEventListener');
    const remove = jest.spyOn(document, 'removeEventListener');
    const listener = jest.fn();
    const { rerender } = renderHook((props: Options) => useDocumentEvent(props), {
      initialProps: options({ listener, capture }),
    });

    rerender(options({ listener, capture: !capture }));

    expect(add.mock.calls.filter(([type]) => type === 'keydown')).toEqual([
      ['keydown', listener, capture],
      ['keydown', listener, !capture],
    ]);
    expect(remove).toHaveBeenCalledWith('keydown', listener, capture);
  });
});
