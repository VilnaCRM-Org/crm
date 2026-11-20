import '@testing-library/jest-dom';
import { act, renderHook } from '@testing-library/react';
import * as React from 'react';
import type { JSX, ReactNode } from 'react';
import * as ReactI18next from 'react-i18next';
import { I18nextProvider } from 'react-i18next';

import useNotifications from '@/hooks/use-notifications';
import type { NotificationDraft } from '@/lib/notifications/types/notification-draft';
import type { NotificationOutletState } from '@/lib/notifications/types/notification-outlet-state';
import useNotificationOutletStore from '@/lib/notifications/use-notification-outlet-store';
import useEmailResend from '@/modules/user/features/settings/hooks/use-email-resend';
import type { ProfileResendOutcome } from '@/modules/user/features/settings/types/user-profile';
import { buildUserEntity } from '@tests/builders';
import createSettingsLocaleI18n from '@tests/unit/utils/create-settings-locale-i18n';
import loadIsolated from '@tests/unit/utils/isolated-module';
import { resetClientStores } from '@tests/utils/reset-client-stores';

const mockResend = jest.fn();
const mockProvider = { resend: mockResend };
const mockSubmitRuns: unknown[] = [];

jest.mock('@/providers/di', () => ({
  __esModule: true,
  useService: (): object => mockProvider,
}));

jest.mock('@/hooks/use-abortable-submit', () => {
  const actual = jest.requireActual('@/hooks/use-abortable-submit');
  return {
    __esModule: true,
    default: (run: unknown): unknown => {
      mockSubmitRuns.push(run);
      return actual.default(run);
    },
  };
});

const wrapper = ({ children }: { children: ReactNode }): JSX.Element => (
  <I18nextProvider i18n={createSettingsLocaleI18n('uk', ['en'])}>{children}</I18nextProvider>
);

const user = buildUserEntity({ confirmed: false });

const draftsOf = (state: NotificationOutletState): NotificationDraft[] =>
  state.raised.items.map(({ kind, messageKey, action, anchor }) => ({
    kind,
    messageKey,
    action,
    anchor,
  }));

const raised = (): NotificationDraft[] => draftsOf(useNotificationOutletStore.getState());

const raiseCount = (): number => useNotificationOutletStore.getState().revision;

const inlineAnchors = (): string[] =>
  useNotificationOutletStore.getState().inline.items.map((batch) => batch.anchor);

const setup = (): {
  adopt: jest.Mock;
  confirm: jest.Mock;
  isCurrent: jest.Mock;
  revision: jest.Mock;
  result: { current: ReturnType<typeof useEmailResend> };
  rerender: () => void;
  unmount: () => void;
} => {
  const adopt = jest.fn();
  const confirm = jest.fn();
  const isCurrent = jest.fn(() => true);
  const revision = jest.fn(() => 0);
  const view = renderHook(() => useEmailResend(user, { adopt, confirm, isCurrent, revision }), {
    wrapper,
  });
  return { adopt, confirm, isCurrent, revision, ...view };
};

describe('useEmailResend', () => {
  beforeEach(() => {
    resetClientStores();
    mockResend.mockReset();
    mockSubmitRuns.length = 0;
  });

  it('sends one resend with the entity id for two calls before the first settles', async () => {
    let settle: (outcome: ProfileResendOutcome) => void = () => undefined;
    mockResend.mockReturnValue(new Promise((resolve) => (settle = resolve)));
    const { result } = setup();

    act(() => {
      result.current.resend();
      result.current.resend();
    });

    expect(mockResend).toHaveBeenCalledTimes(1);
    expect(mockResend.mock.calls[0]?.[0]).toBe(user.id);
    expect(result.current.isSubmitting).toBe(true);
    await act(async () => settle({ kind: 'sent', confirmed: false }));
    expect(result.current.isSubmitting).toBe(false);
  });

  it('withdraws the e-mail notifications when a resend starts, before it settles', () => {
    mockResend.mockReturnValue(new Promise(() => undefined));
    const port = renderHook(() => useNotifications(), { wrapper }).result.current;
    act(() =>
      port.raise({
        items: [
          { kind: 'success', messageKey: 'settings.toasts.saved' },
          { kind: 'error', messageKey: 'settings.toasts.resend_failed', anchor: 'email' },
        ],
      })
    );
    const { result } = setup();

    expect(inlineAnchors()).toEqual(['primary', 'email']);

    act(() => {
      result.current.resend();
    });

    expect(inlineAnchors()).toEqual(['primary']);
    expect(raiseCount()).toBe(1);
  });

  it('keeps the run handed to useAbortableSubmit stable across renders', () => {
    const { rerender } = setup();

    rerender();
    rerender();

    expect(new Set(mockSubmitRuns).size).toBe(1);
  });

  it.each([true, false])(
    'confirms with %s and raises the resent draft at the e-mail anchor once, never adopting',
    async (confirmed) => {
      mockResend.mockResolvedValue({ kind: 'sent', confirmed });
      const { result, adopt, confirm } = setup();

      await act(async () => {
        result.current.resend();
      });

      expect(confirm).toHaveBeenCalledWith(user.email, confirmed);
      expect(adopt).not.toHaveBeenCalled();
      expect(raised()).toEqual([
        { kind: 'success', messageKey: 'settings.toasts.resent', anchor: 'email' },
      ]);
      expect(raiseCount()).toBe(1);
    }
  );

  it('keeps the notice but drops the flag when a Save settled while the resend ran', async () => {
    mockResend.mockResolvedValue({ kind: 'sent', confirmed: true });
    const { result, confirm, revision } = setup();
    revision.mockReturnValueOnce(0).mockReturnValue(1);
    const email = document.createElement('input');
    email.id = 'email';
    document.body.append(email);

    await act(async () => {
      result.current.resend();
    });

    expect(confirm).not.toHaveBeenCalled();
    expect(email).not.toHaveFocus();
    expect(raiseCount()).toBe(1);
    expect(raised()).toEqual([
      { kind: 'success', messageKey: 'settings.toasts.resent', anchor: 'email' },
    ]);
    email.remove();
  });

  it('moves focus to the e-mail field when the payload says the address is confirmed', async () => {
    mockResend.mockResolvedValue({ kind: 'sent', confirmed: true });
    const email = document.createElement('input');
    email.id = 'email';
    document.body.appendChild(email);
    const { result } = setup();

    await act(async () => {
      result.current.resend();
    });

    expect(email).toHaveFocus();
    email.remove();
  });

  it('leaves focus alone when the address is still unconfirmed', async () => {
    mockResend.mockResolvedValue({ kind: 'sent', confirmed: false });
    const email = document.createElement('input');
    email.id = 'email';
    document.body.appendChild(email);
    const { result } = setup();

    await act(async () => {
      result.current.resend();
    });

    expect(email).not.toHaveFocus();
    email.remove();
  });

  it.each([
    ['rate_limited', 'settings.toasts.rate_limited'],
    ['transient', 'settings.toasts.resend_failed'],
    ['rejected', 'settings.toasts.resend_failed'],
  ] as const)(
    'raises the %s failure once as an error at the e-mail anchor',
    async (reason, messageKey) => {
      mockResend.mockResolvedValue({ kind: 'failed', reason });
      const { result, confirm } = setup();

      await act(async () => {
        result.current.resend();
      });

      expect(raised()).toEqual([{ kind: 'error', messageKey, anchor: 'email' }]);
      expect(raiseCount()).toBe(1);
      expect(confirm).not.toHaveBeenCalled();
    }
  );

  it.each([
    ['rate_limited', 'settings.toasts.rate_limited'],
    ['transient', 'settings.toasts.resend_failed'],
    ['rejected', 'settings.toasts.resend_failed'],
  ] as const)(
    'maps the %s failure to its draft in a hook loaded in the test',
    async (reason, messageKey) => {
      const fresh = await loadIsolated(async () => {
        jest.doMock('react', () => React);
        jest.doMock('react-i18next', () => ReactI18next);
        return {
          hook: (await import('@/modules/user/features/settings/hooks/use-email-resend')).default,
          store: (await import('@/lib/notifications/use-notification-outlet-store')).default,
        };
      });
      mockResend.mockResolvedValue({ kind: 'failed', reason });
      const adoption = {
        adopt: jest.fn(),
        confirm: jest.fn(),
        isCurrent: jest.fn(() => true),
        revision: jest.fn(() => 0),
      };
      const { result } = renderHook(() => fresh.hook(user, adoption), { wrapper });

      await act(async () => {
        result.current.resend();
      });

      expect(draftsOf(fresh.store.getState())).toEqual([
        { kind: 'error', messageKey, anchor: 'email' },
      ]);
    }
  );

  it('raises nothing when the session ended', async () => {
    mockResend.mockResolvedValue({ kind: 'failed', reason: 'session_ended' });
    const { result, confirm } = setup();

    await act(async () => {
      result.current.resend();
    });

    expect(raiseCount()).toBe(0);
    expect(confirm).not.toHaveBeenCalled();
  });

  it.each<ProfileResendOutcome>([
    { kind: 'sent', confirmed: true },
    { kind: 'failed', reason: 'transient' },
  ])(
    'publishes nothing for a $kind resend once its e-mail is no longer current',
    async (outcome) => {
      let settle: (value: ProfileResendOutcome) => void = () => undefined;
      mockResend.mockReturnValue(new Promise((resolve) => (settle = resolve)));
      const field = document.createElement('input');
      field.id = 'email';
      document.body.appendChild(field);
      const { result, confirm, isCurrent } = setup();
      act(() => {
        result.current.resend();
      });

      isCurrent.mockReturnValue(false);
      await act(async () => settle(outcome));

      expect(isCurrent).toHaveBeenCalledWith(user.email);
      expect(confirm).not.toHaveBeenCalled();
      expect(raiseCount()).toBe(0);
      expect(field).not.toHaveFocus();
      expect(result.current.isSubmitting).toBe(false);
      field.remove();
    }
  );

  it('publishes nothing when the component unmounts while the request is in flight', async () => {
    let settle: (outcome: ProfileResendOutcome) => void = () => undefined;
    mockResend.mockReturnValue(new Promise((resolve) => (settle = resolve)));
    const { result, confirm, unmount } = setup();
    act(() => {
      result.current.resend();
    });
    const signal = mockResend.mock.calls[0]?.[1] as AbortSignal;

    unmount();
    await act(async () => settle({ kind: 'sent', confirmed: true }));

    expect(signal.aborted).toBe(true);
    expect(raiseCount()).toBe(0);
    expect(confirm).not.toHaveBeenCalled();
  });
});
