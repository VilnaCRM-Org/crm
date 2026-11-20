import { act, renderHook, type RenderHookResult } from '@testing-library/react';
import type { JSX, ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, type NavigateFunction, useNavigate } from 'react-router';

import type { ShellLayout } from '@/components/types/ui-app-shell';
import type { NotificationsPort } from '@/hooks/types/notifications-port';
import useNotifications from '@/hooks/use-notifications';
import type { NotificationOutletState } from '@/lib/notifications/types/notification-outlet-state';
import useNotificationOutletStore from '@/lib/notifications/use-notification-outlet-store';
import useDisclosure from '@/modules/user/features/notifications/hooks/use-bell-disclosure';
import { inMemoryNotificationRepository } from '@/modules/user/features/notifications/repositories';
import type { BellDisclosure } from '@/modules/user/features/notifications/types/bell-disclosure';
import { buildNotificationDraft, buildNotificationDraftSet } from '@tests/builders';
import testI18n from '@tests/i18n/test-i18n';
import { clearConfigBlock, writeConfigBlock } from '@tests/utils/config-block';
import { resetClientStores } from '@tests/utils/reset-client-stores';

interface HookProps {
  readonly layout: ShellLayout;
}

function RouterWrapper({ children }: { children: ReactNode }): JSX.Element {
  return (
    <I18nextProvider i18n={testI18n}>
      <MemoryRouter>{children}</MemoryRouter>
    </I18nextProvider>
  );
}

interface HookResult {
  readonly disclosure: BellDisclosure;
  readonly port: NotificationsPort;
  readonly navigate: NavigateFunction;
}

const setup = (layout: ShellLayout = 'desktop'): RenderHookResult<HookResult, HookProps> =>
  renderHook(
    (props: HookProps) => ({
      disclosure: useDisclosure(props.layout),
      port: useNotifications(),
      navigate: useNavigate(),
    }),
    { wrapper: RouterWrapper, initialProps: { layout } }
  );

const state = (): NotificationOutletState => useNotificationOutletStore.getState();

describe('useBellDisclosure', () => {
  beforeEach(() => {
    resetClientStores();
    clearConfigBlock();
  });

  afterAll(() => clearConfigBlock());

  it('starts closed and unvisited', () => {
    const { result } = setup();

    expect(result.current.disclosure.expanded).toBe(false);
    expect(result.current.disclosure.visited).toBe(false);
  });

  it('under bell, show opens, marks visited and hides the merged card, reading nothing', () => {
    writeConfigBlock(JSON.stringify({ notificationStyle: 'bell' }));
    const markAllRead = jest.spyOn(inMemoryNotificationRepository, 'markAllRead');
    const { result } = setup();
    act(() => result.current.port.raise(buildNotificationDraftSet(3)));
    expect(state().shown.items).toHaveLength(3);

    act(() => result.current.disclosure.show());

    expect(result.current.disclosure.expanded).toBe(true);
    expect(result.current.disclosure.visited).toBe(true);
    expect(state().shown.items).toEqual([]);
    expect(markAllRead).not.toHaveBeenCalled();
  });

  it.each(['toast', 'inline'])(
    'under %s, show opens and marks visited but hides nothing',
    (style) => {
      writeConfigBlock(JSON.stringify({ notificationStyle: style }));
      const markAllRead = jest.spyOn(inMemoryNotificationRepository, 'markAllRead');
      const { result } = setup();
      act(() =>
        result.current.port.raise({
          items: [buildNotificationDraft({ anchor: 'primary' }), buildNotificationDraft()],
        })
      );
      const { shown, inline } = state();

      act(() => result.current.disclosure.show());

      expect(result.current.disclosure.expanded).toBe(true);
      expect(result.current.disclosure.visited).toBe(true);
      expect(state().shown).toBe(shown);
      expect(state().inline).toBe(inline);
      expect(markAllRead).not.toHaveBeenCalled();
    }
  );

  it('keeps visited after the panel was opened once and closed', () => {
    const { result } = setup();

    act(() => result.current.disclosure.show());
    act(() => result.current.disclosure.close());

    expect(result.current.disclosure.expanded).toBe(false);
    expect(result.current.disclosure.visited).toBe(true);
  });

  it('toggles between open and closed', () => {
    const { result } = setup();

    act(() => result.current.disclosure.toggle());
    expect(result.current.disclosure.expanded).toBe(true);

    act(() => result.current.disclosure.toggle());
    expect(result.current.disclosure.expanded).toBe(false);
    expect(result.current.disclosure.visited).toBe(true);
  });

  it('never opens because an outcome was raised', () => {
    const { result } = setup();

    act(() => result.current.port.raise(buildNotificationDraftSet(1)));

    expect(result.current.disclosure.expanded).toBe(false);
    expect(result.current.disclosure.visited).toBe(false);
  });

  it('closes when the route changes and when the layout changes', () => {
    const { result, rerender } = setup();
    act(() => result.current.disclosure.show());

    act(() => result.current.navigate('/elsewhere'));
    expect(result.current.disclosure.expanded).toBe(false);

    act(() => result.current.disclosure.show());
    rerender({ layout: 'mobile' });
    expect(result.current.disclosure.expanded).toBe(false);
    expect(result.current.disclosure.visited).toBe(true);
  });

  it('hands out the refs and dismissal handlers the wrapper needs', () => {
    const { result } = setup();

    expect(result.current.disclosure.bell.current).toBeNull();
    expect(result.current.disclosure.wrapper.current).toBeNull();
    expect(result.current.disclosure.keyDown).toEqual(expect.any(Function));
    expect(result.current.disclosure.focusOut).toEqual(expect.any(Function));
  });

  it('keeps show, close and toggle stable between unrelated renders', () => {
    const { result, rerender } = setup();
    const first = result.current.disclosure;

    rerender({ layout: 'desktop' });

    expect(result.current.disclosure.show).toBe(first.show);
    expect(result.current.disclosure.close).toBe(first.close);
    expect(result.current.disclosure.toggle).toBe(first.toggle);
  });
});
