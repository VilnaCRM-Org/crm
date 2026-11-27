import '@testing-library/jest-dom';
import { renderHook } from '@testing-library/react';
import type { RefObject } from 'react';

import useRetiringNotificationViews from '@/hooks/use-retiring-notification-views';
import type {
  NotificationView,
  NotificationViewSet,
} from '@/lib/notifications/types/notification-view';
import useNotificationOutletStore from '@/lib/notifications/use-notification-outlet-store';
import { resetClientStores } from '@tests/utils/reset-client-stores';

interface HookInput {
  readonly views: NotificationViewSet;
  readonly retire: (view: NotificationView) => void;
}

const bellRef: RefObject<HTMLElement | null> = { current: null };

const plain: NotificationView = { id: '1', kind: 'success', message: 'Changes saved' };

const actionable = (onActivate: () => void): NotificationView => ({
  id: '7',
  kind: 'error',
  message: 'Could not save',
  time: '10:00',
  action: { label: 'Try again', onActivate },
});

const renderViews = (
  input: HookInput
): ReturnType<typeof renderHook<NotificationViewSet, HookInput>> =>
  renderHook(
    (props: HookInput) => useRetiringNotificationViews(props.views, props.retire, bellRef),
    {
      initialProps: input,
    }
  );

describe('useRetiringNotificationViews', () => {
  beforeEach(() => resetClientStores());

  afterEach(() => {
    bellRef.current = null;
    document.body.replaceChildren();
  });

  it('passes a view without an action through as the same object', () => {
    const { result } = renderViews({ views: { items: [plain] }, retire: jest.fn() });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]).toBe(plain);
  });

  it('wraps an action to return focus, retire that view and then run the original', () => {
    const order: string[] = [];
    const target = document.createElement('button');
    document.body.appendChild(target);
    target.addEventListener('focus', () => order.push('focus'));
    useNotificationOutletStore.setState({ focus: { primary: { current: target } } });
    const view = actionable(() => order.push('run'));
    const retire = jest.fn((retired: NotificationView) => order.push(`retire:${retired.id}`));
    const { result } = renderViews({ views: { items: [view] }, retire });
    const wrapped = result.current.items[0];

    wrapped?.action?.onActivate();

    expect(wrapped).toEqual({
      ...view,
      action: { label: 'Try again', onActivate: expect.any(Function) },
    });
    expect(wrapped?.action?.onActivate).not.toBe(view.action?.onActivate);
    expect(order).toEqual(['focus', 'retire:7', 'run']);
    expect(retire).toHaveBeenCalledTimes(1);
    expect(retire).toHaveBeenCalledWith(view);
    expect(target).toHaveFocus();
  });

  it('returns focus to the last resort when the page published no target', () => {
    const bell = document.createElement('button');
    document.body.appendChild(bell);
    bellRef.current = bell;
    const views = { items: [actionable(jest.fn())] };
    const { result } = renderViews({ views, retire: jest.fn() });

    result.current.items[0]?.action?.onActivate();

    expect(bell).toHaveFocus();
  });

  it('keeps the same set while the views and the retire callback are unchanged', () => {
    const input = { views: { items: [plain] }, retire: jest.fn() };
    const { result, rerender } = renderViews(input);
    const first = result.current;

    rerender(input);

    expect(result.current).toBe(first);
  });

  it('builds a new set when the retire callback changes', () => {
    const first = jest.fn();
    const second = jest.fn();
    const view = actionable(jest.fn());
    const views = { items: [view] };
    const { result, rerender } = renderViews({ views, retire: first });
    const initial = result.current;

    rerender({ views, retire: second });
    result.current.items[0]?.action?.onActivate();

    expect(result.current).not.toBe(initial);
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith(view);
  });

  it('builds a new set when the views change', () => {
    const retire = jest.fn();
    const { result, rerender } = renderViews({ views: { items: [plain] }, retire });
    const initial = result.current;

    rerender({ views: { items: [] }, retire });

    expect(result.current).not.toBe(initial);
    expect(result.current.items).toEqual([]);
  });
});
