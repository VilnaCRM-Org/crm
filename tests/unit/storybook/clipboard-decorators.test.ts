import { renderHook } from '@testing-library/react';

import { useAcceptingClipboard, useRefusingClipboard } from '@stories/clipboard-decorators';

const mountDecorated = (): ReturnType<typeof renderHook> =>
  renderHook(() => useRefusingClipboard());

describe('useRefusingClipboard', () => {
  afterEach(() => {
    Reflect.deleteProperty(navigator, 'clipboard');
  });

  it('refuses every clipboard write while the story is mounted', async () => {
    mountDecorated();

    await expect(navigator.clipboard.writeText('secret')).rejects.toMatchObject({
      name: 'NotAllowedError',
    });
  });

  it('restores an existing own clipboard override when the story unmounts', () => {
    const existing = { writeText: jest.fn() };
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: existing });
    const { unmount } = mountDecorated();

    unmount();

    expect(navigator.clipboard).toBe(existing);
  });

  it('removes its own override when no clipboard property existed before', () => {
    const { unmount } = mountDecorated();

    unmount();

    expect(Object.getOwnPropertyDescriptor(navigator, 'clipboard')).toBeUndefined();
  });
});

describe('useAcceptingClipboard', () => {
  afterEach(() => {
    Reflect.deleteProperty(navigator, 'clipboard');
  });

  it('accepts every clipboard write while the story is mounted', async () => {
    renderHook(() => useAcceptingClipboard());

    await expect(navigator.clipboard.writeText('codes')).resolves.toBeUndefined();
  });

  it('removes its own override when the story unmounts', () => {
    const { unmount } = renderHook(() => useAcceptingClipboard());

    unmount();

    expect(Object.getOwnPropertyDescriptor(navigator, 'clipboard')).toBeUndefined();
  });
});
