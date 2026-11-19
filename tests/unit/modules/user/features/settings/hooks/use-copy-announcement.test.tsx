import { act, renderHook } from '@testing-library/react';
import { createRef } from 'react';

import ALTERNATING_MARK from '@/lib/live-region/alternating-mark';
import useCopyAnnouncement from '@/modules/user/features/settings/hooks/use-copy-announcement';
import { buildTotpSecret } from '@tests/builders';

const mockCopy = jest.fn();
type MockStatus = 'idle' | 'copied' | 'failed';

let mockStatus: MockStatus = 'idle';

jest.mock('@/modules/user/features/settings/hooks/use-copy-to-clipboard', () => ({
  __esModule: true,
  default: (): { status: MockStatus; copy: jest.Mock } => ({
    status: mockStatus,
    copy: mockCopy,
  }),
}));

const COPIED = 'Key copied';
const FAILED = 'Copy failed';

const renderAnnouncement = (
  text = buildTotpSecret(),
  targetRef = createRef<HTMLElement>()
): ReturnType<typeof renderHook<ReturnType<typeof useCopyAnnouncement>, unknown>> =>
  renderHook(() =>
    useCopyAnnouncement({ text, targetRef, copiedText: COPIED, failedText: FAILED })
  );

describe('useCopyAnnouncement', () => {
  beforeEach(() => {
    mockCopy.mockReset();
    mockStatus = 'idle';
  });

  it('announces nothing while the clipboard is idle', () => {
    const { result } = renderAnnouncement();

    expect(result.current.status).toBe('idle');
    expect(result.current.message).toBe('');
  });

  it('announces the copied text, with the mark on the first announcement', () => {
    mockStatus = 'copied';

    const { result } = renderAnnouncement();

    expect(result.current.status).toBe('copied');
    expect(result.current.message).toBe(`${COPIED}${ALTERNATING_MARK}`);
  });

  it('announces the failed text, with the mark on the first announcement', () => {
    mockStatus = 'failed';

    const { result } = renderAnnouncement();

    expect(result.current.message).toBe(`${FAILED}${ALTERNATING_MARK}`);
  });

  it('drops the mark after one copy and restores it after the next', () => {
    mockStatus = 'copied';
    const { result } = renderAnnouncement();

    act(() => result.current.onCopy());
    expect(result.current.message).toBe(COPIED);

    act(() => result.current.onCopy());
    expect(result.current.message).toBe(`${COPIED}${ALTERNATING_MARK}`);

    act(() => result.current.onCopy());
    expect(result.current.message).toBe(COPIED);
  });

  it('copies the text with the current target element as the fallback', () => {
    const text = buildTotpSecret();
    const target = document.createElement('code');
    const targetRef = { current: target };
    const { result } = renderHook(() =>
      useCopyAnnouncement({ text, targetRef, copiedText: COPIED, failedText: FAILED })
    );

    act(() => result.current.onCopy());

    expect(mockCopy).toHaveBeenCalledTimes(1);
    expect(mockCopy).toHaveBeenCalledWith({ text, fallbackTarget: target });
  });

  it('passes a null fallback target through when nothing is mounted', () => {
    const text = buildTotpSecret();
    const { result } = renderAnnouncement(text);

    act(() => result.current.onCopy());

    expect(mockCopy).toHaveBeenCalledWith({ text, fallbackTarget: null });
  });
});
