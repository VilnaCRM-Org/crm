import '@testing-library/jest-dom';
import { act, render, renderHook, screen } from '@testing-library/react';
import { useCallback, useRef } from 'react';
import type { JSX } from 'react';

import useCopyToClipboard from '@/modules/user/features/settings/hooks/use-copy-to-clipboard';
import { buildRecoveryCode, buildTotpSecret } from '@tests/builders';

const installClipboard = (writeText: jest.Mock | undefined): void => {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: writeText === undefined ? undefined : { writeText },
  });
};

const selectedText = (): string => window.getSelection()?.toString() ?? '';

const mountTarget = (text: string): HTMLElement => {
  render(<code>{text}</code>);
  return screen.getByText(text);
};

describe('useCopyToClipboard', () => {
  afterEach(() => {
    window.getSelection()?.removeAllRanges();
    Reflect.deleteProperty(navigator, 'clipboard');
  });

  it('starts idle', () => {
    const { result } = renderHook(() => useCopyToClipboard());

    expect(result.current.status).toBe('idle');
  });

  it('writes exactly the text it is given and reports copied', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    installClipboard(writeText);
    const text = buildTotpSecret();
    const target = mountTarget(text);
    const { result } = renderHook(() => useCopyToClipboard());

    await act(() => result.current.copy({ text, fallbackTarget: target }));

    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText).toHaveBeenCalledWith(text);
    expect(result.current.status).toBe('copied');
    expect(selectedText()).toBe('');
  });

  it('selects the target and reports failed when the write is rejected', async () => {
    const writeText = jest.fn().mockRejectedValue(new Error('denied'));
    installClipboard(writeText);
    const text = buildTotpSecret();
    const target = mountTarget(text);
    const { result } = renderHook(() => useCopyToClipboard());

    await act(() => result.current.copy({ text, fallbackTarget: target }));

    expect(result.current.status).toBe('failed');
    expect(selectedText()).toBe(text);
  });

  it('selects the target and reports failed when the clipboard API is missing', async () => {
    installClipboard(undefined);
    const text = buildRecoveryCode();
    const target = mountTarget(text);
    const { result } = renderHook(() => useCopyToClipboard());

    await act(() => result.current.copy({ text, fallbackTarget: target }));

    expect(result.current.status).toBe('failed');
    expect(selectedText()).toBe(text);
  });

  it('replaces an earlier selection with the target text', async () => {
    installClipboard(undefined);
    const first = mountTarget(buildTotpSecret());
    const text = buildRecoveryCode();
    const second = mountTarget(text);
    window.getSelection()?.selectAllChildren(first);
    const { result } = renderHook(() => useCopyToClipboard());

    await act(() => result.current.copy({ text, fallbackTarget: second }));

    expect(selectedText()).toBe(text);
    expect(window.getSelection()?.rangeCount).toBe(1);
  });

  it('reports failed without throwing when there is no target to select', async () => {
    installClipboard(undefined);
    const { result } = renderHook(() => useCopyToClipboard());

    await act(() => result.current.copy({ text: buildTotpSecret(), fallbackTarget: null }));

    expect(result.current.status).toBe('failed');
    expect(selectedText()).toBe('');
  });

  it('reports failed without throwing when the document offers no selection', async () => {
    installClipboard(undefined);
    const target = mountTarget(buildTotpSecret());
    const getSelection = jest.spyOn(window, 'getSelection').mockReturnValue(null);
    const { result } = renderHook(() => useCopyToClipboard());

    await act(() => result.current.copy({ text: 'x', fallbackTarget: target }));

    expect(result.current.status).toBe('failed');
    getSelection.mockRestore();
  });

  it('reports copied again after a failure once the write succeeds', async () => {
    const writeText = jest
      .fn()
      .mockRejectedValueOnce(new Error('denied'))
      .mockResolvedValue(undefined);
    installClipboard(writeText);
    const target = mountTarget('k');
    const { result } = renderHook(() => useCopyToClipboard());

    await act(() => result.current.copy({ text: 'k', fallbackTarget: target }));
    expect(result.current.status).toBe('failed');
    await act(() => result.current.copy({ text: 'k', fallbackTarget: target }));

    expect(result.current.status).toBe('copied');
  });

  it('keeps the same copy function across renders', () => {
    const { result, rerender } = renderHook(() => useCopyToClipboard());
    const first = result.current.copy;

    rerender();

    expect(result.current.copy).toBe(first);
  });

  it('never moves focus', async () => {
    installClipboard(undefined);
    const text = buildTotpSecret();

    function Probe(): JSX.Element {
      const { copy } = useCopyToClipboard();
      const target = useRef<HTMLElement>(null);
      const onClick = useCallback(() => copy({ text, fallbackTarget: target.current }), [copy]);
      return (
        <>
          <code ref={target}>{text}</code>
          <button type="button" onClick={onClick}>
            Copy
          </button>
        </>
      );
    }
    render(<Probe />);
    const button = screen.getByRole('button', { name: 'Copy' });
    button.focus();

    await act(async () => button.click());

    expect(button).toHaveFocus();
    expect(selectedText()).toBe(text);
  });
});
