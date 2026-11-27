import { act, renderHook } from '@testing-library/react';

import NotificationOutletActions from '@/lib/notifications/notification-outlet-actions';
import useNotificationOutletStore from '@/lib/notifications/use-notification-outlet-store';
import useRecorder from '@/modules/user/features/notifications/hooks/use-notification-recorder';
import { buildNotificationDraft, buildNotificationDraftSet } from '@tests/builders';
import { resetClientStores } from '@tests/utils/reset-client-stores';

const mockRepository = {
  record: jest.fn(),
  list: jest.fn(),
  countUnread: jest.fn(),
  markAllRead: jest.fn(),
  claim: jest.fn(),
};

jest.mock('@/modules/user/features/notifications/hooks/use-notification-repository', () => ({
  __esModule: true,
  default: (): typeof mockRepository => mockRepository,
}));

const RAISED_AT = 1_790_000_000_000;
const actions = new NotificationOutletActions(useNotificationOutletStore, () => RAISED_AT);
const identity = (key: string): string => key;
const REPORT_SOURCE = 'app-shell:notifications-record';

const raise = (count: number): Promise<void> =>
  act(async () => {
    actions.raise(buildNotificationDraftSet(count), identity);
  });

describe('useNotificationRecorder', () => {
  const report = jest.fn();

  beforeEach(() => {
    resetClientStores();
    jest.clearAllMocks();
    mockRepository.record.mockResolvedValue({ items: [] });
  });

  it('records one raise once with record drafts stamped at the raise time', async () => {
    const drafts = buildNotificationDraftSet(3, { kind: 'error' });
    const { result } = renderHook(() => useRecorder(report));
    expect(result.current).toBe(0);

    await act(async () => {
      actions.raise(drafts, identity);
    });

    expect(mockRepository.record).toHaveBeenCalledTimes(1);
    expect(mockRepository.record).toHaveBeenCalledWith({
      items: drafts.items.map((draft) => ({
        kind: 'error',
        messageKey: draft.messageKey,
        createdAt: RAISED_AT,
      })),
    });
    expect(result.current).toBe(1);
    expect(report).not.toHaveBeenCalled();
  });

  it('grows the returned revision by one for every settled record', async () => {
    const { result } = renderHook(() => useRecorder(report));

    await raise(1);
    await raise(2);

    expect(result.current).toBe(2);
    expect(mockRepository.record).toHaveBeenCalledTimes(2);
  });

  it.each([
    ['a re-render', (): void => undefined],
    ['a dismiss', (): void => actions.dismiss(1)],
    ['a dismissAll', (): void => actions.dismissAll()],
    ['a published focus', (): void => actions.publishFocus({ primary: { current: null } })],
  ])('does not record again on %s', async (_label, change) => {
    const { rerender } = renderHook(() => useRecorder(report));
    await raise(1);
    expect(mockRepository.record).toHaveBeenCalledTimes(1);

    await act(async () => {
      change();
    });
    rerender();

    expect(mockRepository.record).toHaveBeenCalledTimes(1);
  });

  it('reports a rejected record once and leaves the outcome shown and announced', async () => {
    const failure = new Error('write failed');
    mockRepository.record.mockRejectedValue(failure);
    const { result } = renderHook(() => useRecorder(report));

    await act(async () => {
      actions.raise({ items: [buildNotificationDraft({ messageKey: 'saved' })] }, identity);
    });

    expect(report).toHaveBeenCalledTimes(1);
    expect(report).toHaveBeenCalledWith(REPORT_SOURCE, failure);
    expect(result.current).toBe(0);
    const state = useNotificationOutletStore.getState();
    expect(state.shown.items).toHaveLength(1);
    expect(state.announcement.polite).toContain('saved');
  });

  it('reports through the newest handler after it changes', async () => {
    const failure = new Error('write failed');
    mockRepository.record.mockRejectedValue(failure);
    const newest = jest.fn();
    const { rerender } = renderHook(({ handler }) => useRecorder(handler), {
      initialProps: { handler: report },
    });

    rerender({ handler: newest });
    await raise(1);

    expect(newest).toHaveBeenCalledWith(REPORT_SOURCE, failure);
    expect(report).not.toHaveBeenCalled();
  });

  it('does not record a rejected batch again on a second mount', async () => {
    mockRepository.record.mockRejectedValue(new Error('write failed'));
    const { unmount } = renderHook(() => useRecorder(report));
    await raise(1);
    unmount();

    renderHook(() => useRecorder(report));
    await act(async () => undefined);

    expect(mockRepository.record).toHaveBeenCalledTimes(1);
    expect(report).toHaveBeenCalledTimes(1);
  });

  it('records nothing once unmounted', async () => {
    const { unmount } = renderHook(() => useRecorder(report));
    unmount();

    await raise(1);

    expect(mockRepository.record).not.toHaveBeenCalled();
  });

  it('does not set state when the record settles after unmount', async () => {
    let resolveRecord: (value: { items: never[] }) => void = () => undefined;
    mockRepository.record.mockReturnValue(
      new Promise((resolve) => {
        resolveRecord = resolve;
      })
    );
    const { unmount } = renderHook(() => useRecorder(report));
    await raise(1);
    unmount();

    await act(async () => resolveRecord({ items: [] }));

    expect(mockRepository.record).toHaveBeenCalledTimes(1);
  });

  it('records a raise after the page outlet was cleared, once per raise', async () => {
    renderHook(() => useRecorder(report));

    await raise(1);
    await act(async () => {
      actions.clear();
    });
    await raise(1);

    expect(mockRepository.record).toHaveBeenCalledTimes(2);
  });

  it('records every batch raised before it mounted, once and in order', async () => {
    const first = buildNotificationDraft({ messageKey: 'first' });
    const second = buildNotificationDraft({ messageKey: 'second' });
    actions.raise({ items: [first] }, identity);
    actions.raise({ items: [second] }, identity);

    renderHook(() => useRecorder(report));
    await act(async () => undefined);

    expect(mockRepository.record).toHaveBeenCalledTimes(1);
    expect(mockRepository.record).toHaveBeenCalledWith({
      items: [
        expect.objectContaining({ messageKey: 'first' }),
        expect.objectContaining({ messageKey: 'second' }),
      ],
    });
  });

  it('records the batch raised before it mounted, once, and then later raises', async () => {
    actions.raise(buildNotificationDraftSet(2), identity);
    expect(useNotificationOutletStore.getState().revision).toBe(1);

    const { result } = renderHook(() => useRecorder(report));
    await act(async () => undefined);

    expect(mockRepository.record).toHaveBeenCalledTimes(1);
    expect(mockRepository.record.mock.calls[0]?.[0].items).toHaveLength(2);
    expect(result.current).toBe(1);

    await raise(1);

    expect(mockRepository.record).toHaveBeenCalledTimes(2);
    expect(mockRepository.record.mock.calls[1]?.[0].items).toHaveLength(1);
  });

  it('does not record a batch again when it mounts a second time', async () => {
    actions.raise(buildNotificationDraftSet(2), identity);
    const { unmount } = renderHook(() => useRecorder(report));
    await raise(1);
    unmount();

    renderHook(() => useRecorder(report));
    await act(async () => undefined);

    expect(mockRepository.record).toHaveBeenCalledTimes(2);
  });

  it('records a raise made between two mounts once', async () => {
    renderHook(() => useRecorder(report)).unmount();
    actions.raise(buildNotificationDraftSet(1), identity);

    renderHook(() => useRecorder(report)).unmount();
    renderHook(() => useRecorder(report));
    await act(async () => undefined);

    expect(mockRepository.record).toHaveBeenCalledTimes(1);
  });

  it('records nothing for a batch cleared before it mounted', async () => {
    actions.raise(buildNotificationDraftSet(2), identity);
    actions.clear();

    const { result } = renderHook(() => useRecorder(report));
    await act(async () => undefined);

    expect(mockRepository.record).not.toHaveBeenCalled();
    expect(result.current).toBe(0);
  });

  it('records nothing on a store that has never been raised', async () => {
    renderHook(() => useRecorder(report));
    await act(async () => undefined);

    expect(mockRepository.record).not.toHaveBeenCalled();
    expect(useNotificationOutletStore.getState().recorded).toBe(0);
  });

  it('stops listening after unmount', async () => {
    const listeners = jest.spyOn(useNotificationOutletStore, 'subscribe');
    const { unmount } = renderHook(() => useRecorder(report));
    expect(listeners).toHaveBeenCalledTimes(1);
    unmount();

    await raise(1);
    await raise(1);

    expect(mockRepository.record).not.toHaveBeenCalled();
    listeners.mockRestore();
  });

  it('carries the message values of a raise into its record drafts', async () => {
    renderHook(() => useRecorder(report));

    await act(async () => {
      actions.raise(
        {
          items: [
            buildNotificationDraft({
              messageKey: 'settings.social.unlinked',
              messageValues: { items: [{ name: 'provider', value: 'Twitter' }] },
            }),
          ],
        },
        identity
      );
    });

    expect(mockRepository.record.mock.calls[0]?.[0].items).toEqual([
      {
        kind: 'success',
        messageKey: 'settings.social.unlinked',
        messageValues: { items: [{ name: 'provider', value: 'Twitter' }] },
        createdAt: RAISED_AT,
      },
    ]);
  });
});
