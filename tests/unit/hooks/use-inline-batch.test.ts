import { act, renderHook } from '@testing-library/react';

import useInlineBatch from '@/hooks/use-inline-batch';
import NotificationOutletActions from '@/lib/notifications/notification-outlet-actions';
import useNotificationOutletStore from '@/lib/notifications/use-notification-outlet-store';
import { buildNotificationDraft } from '@tests/builders/notification-draft';
import { resetClientStores } from '@tests/utils/reset-client-stores';

const actions = new NotificationOutletActions(useNotificationOutletStore, () => 7);
const identity = (key: string): string => key;

describe('useInlineBatch', () => {
  beforeEach(() => resetClientStores());

  it('returns an empty set when the anchor has no batch', () => {
    const { result } = renderHook(() => useInlineBatch('primary'));

    expect(result.current).toEqual({ items: [] });
  });

  it('returns only the latest batch of its own anchor', () => {
    const first = buildNotificationDraft();
    const second = buildNotificationDraft();
    const email = buildNotificationDraft({ anchor: 'email' });
    act(() => actions.raise({ items: [first, email] }, identity));
    act(() => actions.raise({ items: [second] }, identity));
    const { result: primary } = renderHook(() => useInlineBatch('primary'));
    const { result: mail } = renderHook(() => useInlineBatch('email'));

    expect(primary.current.items).toHaveLength(1);
    expect(primary.current.items[0]).toMatchObject({ ...second, batch: 2, id: 3 });
    expect(mail.current.items).toHaveLength(1);
    expect(mail.current.items[0]).toMatchObject({ ...email, batch: 1, id: 2 });
  });

  it('keeps the items sharing one anchor and skips other anchors of the same raise', () => {
    const a = buildNotificationDraft();
    const b = buildNotificationDraft({ anchor: 'primary' });
    const c = buildNotificationDraft({ anchor: 'email' });
    act(() => actions.raise({ items: [a, c, b] }, identity));

    const { result } = renderHook(() => useInlineBatch('primary'));

    expect(result.current.items.map((item) => item.messageKey)).toEqual([
      a.messageKey,
      b.messageKey,
    ]);
  });

  it('is empty once the batch items were dismissed or the anchor withdrawn', () => {
    act(() => actions.raise({ items: [buildNotificationDraft()] }, identity));
    const { result } = renderHook(() => useInlineBatch('primary'));
    expect(result.current.items).toHaveLength(1);

    act(() => actions.dismiss(1));
    expect(result.current).toEqual({ items: [] });

    act(() => actions.raise({ items: [buildNotificationDraft()] }, identity));
    expect(result.current.items).toHaveLength(1);

    act(() => actions.withdraw('primary'));
    expect(result.current).toEqual({ items: [] });
  });

  it('is memoised on the shown and inline sets', () => {
    act(() => actions.raise({ items: [buildNotificationDraft()] }, identity));
    const { result } = renderHook(() => useInlineBatch('primary'));
    const initial = result.current;

    act(() => useNotificationOutletStore.setState({ revision: 12 }));
    expect(result.current).toBe(initial);

    act(() => actions.raise({ items: [buildNotificationDraft()] }, identity));
    expect(result.current).not.toBe(initial);
  });

  it('returns one stable empty set while nothing matches', () => {
    const { result, rerender } = renderHook(() => useInlineBatch('email'));
    const initial = result.current;

    rerender();
    act(() => useNotificationOutletStore.setState({ revision: 3 }));

    expect(result.current).toBe(initial);
  });
});
