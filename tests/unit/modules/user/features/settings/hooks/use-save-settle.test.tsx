import { renderHook } from '@testing-library/react';
import type { JSX, ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

import type { NotificationDraft } from '@/lib/notifications/types/notification-draft';
import useNotificationOutletStore from '@/lib/notifications/use-notification-outlet-store';
import useSaveSettle from '@/modules/user/features/settings/hooks/use-save-settle';
import type { ProfileChange } from '@/modules/user/features/settings/types/user-profile';
import { buildEmail, buildFullName, buildPassword, buildUserEntity } from '@tests/builders';
import createSettingsLocaleI18n from '@tests/unit/utils/create-settings-locale-i18n';
import { resetClientStores } from '@tests/utils/reset-client-stores';

type SaveSettleOptions = Parameters<typeof useSaveSettle>[0];

interface Parts {
  readonly options: SaveSettleOptions;
  readonly adopt: jest.Mock;
  readonly dispatch: jest.Mock;
  readonly button: HTMLButtonElement;
  readonly shared: HTMLButtonElement;
}

const wrapper = ({ children }: { children: ReactNode }): JSX.Element => (
  <I18nextProvider i18n={createSettingsLocaleI18n('uk', ['en'])}>{children}</I18nextProvider>
);

const NAME_CHANGE: ProfileChange = {
  id: buildUserEntity().id,
  currentPassword: buildPassword(),
  fullName: buildFullName(),
};

const raised = (): readonly NotificationDraft[] =>
  useNotificationOutletStore
    .getState()
    .raised.items.map(({ kind, messageKey, action, anchor }) => ({
      kind,
      messageKey,
      action,
      anchor,
    }));

const raiseCount = (): number => useNotificationOutletStore.getState().revision;

const partsOf = (): Parts => {
  const adopt = jest.fn();
  const dispatch = jest.fn();
  const button = document.createElement('button');
  const shared = document.createElement('button');
  const target = document.createElement('input');
  const options: SaveSettleOptions = {
    props: {
      user: buildUserEntity(),
      adoption: {
        adopt,
        confirm: jest.fn(),
        isCurrent: (): boolean => true,
        revision: (): number => 0,
      },
      saveRef: { current: shared },
      headingRef: { current: null },
    },
    targets: { buttonRef: { current: button }, focusRef: { current: target } },
    dispatch,
  };
  return { options, adopt, dispatch, button, shared };
};

describe('useSaveSettle', () => {
  beforeEach(() => resetClientStores());

  it('adopts a saved user and raises its saved draft once', () => {
    const { options, adopt, dispatch } = partsOf();
    const user = buildUserEntity();
    const { result } = renderHook(() => useSaveSettle(options), { wrapper });

    result.current({ kind: 'ok', user }, NAME_CHANGE);

    expect(adopt).toHaveBeenCalledWith(user);
    expect(raised()).toEqual([{ kind: 'success', messageKey: 'settings.toasts.saved' }]);
    expect(raiseCount()).toBe(1);
    expect(dispatch).toHaveBeenCalledWith({ type: 'settled', saved: true });
  });

  it('raises one set for a combined save, in name, e-mail and password order', () => {
    const { options } = partsOf();
    const { result } = renderHook(() => useSaveSettle(options), { wrapper });

    result.current(
      { kind: 'ok', user: buildUserEntity() },
      { ...NAME_CHANGE, newPassword: buildPassword(), email: buildEmail() }
    );

    expect(raised()).toEqual([
      { kind: 'success', messageKey: 'settings.toasts.saved' },
      { kind: 'success', messageKey: 'settings.toasts.email_sent' },
      { kind: 'success', messageKey: 'settings.toasts.password_changed' },
    ]);
    expect(raiseCount()).toBe(1);
  });

  it('raises the transient failure with a Try again action that clicks the section Save', () => {
    const { options, button, shared } = partsOf();
    const click = jest.spyOn(button, 'click');
    const sharedClick = jest.spyOn(shared, 'click');
    const { result } = renderHook(() => useSaveSettle(options), { wrapper });

    result.current({ kind: 'failed', reason: 'transient' }, NAME_CHANGE);
    const [draft] = raised();

    expect(draft?.kind).toBe('error');
    expect(draft?.messageKey).toBe('settings.toasts.save_failed_transient');
    expect(draft?.action?.labelKey).toBe('auth.error.tryAgain');

    draft?.action?.onActivate();

    expect(click).toHaveBeenCalledTimes(1);
    expect(sharedClick).not.toHaveBeenCalled();
  });

  it('lets the retry do nothing once the section button is gone', () => {
    const { options, shared } = partsOf();
    const sharedClick = jest.spyOn(shared, 'click');
    const gone = { ...options, targets: { ...options.targets, buttonRef: { current: null } } };
    const { result } = renderHook(() => useSaveSettle(gone), { wrapper });

    result.current({ kind: 'failed', reason: 'transient' }, NAME_CHANGE);
    const [draft] = raised();

    expect(() => draft?.action?.onActivate()).not.toThrow();
    expect(sharedClick).not.toHaveBeenCalled();
  });

  it.each([
    ['rejected', 'settings.toasts.save_failed'],
    ['rate_limited', 'settings.toasts.rate_limited'],
  ] as const)('raises a %s failure with no retry action', (reason, messageKey) => {
    const { options, dispatch } = partsOf();
    const { result } = renderHook(() => useSaveSettle(options), { wrapper });

    result.current({ kind: 'failed', reason }, NAME_CHANGE);

    expect(raised()).toEqual([{ kind: 'error', messageKey }]);
    expect(raised()[0]?.action).toBeUndefined();
    expect(raiseCount()).toBe(1);
    expect(dispatch).toHaveBeenCalledWith({ type: 'settled', saved: false });
  });

  it('dispatches field errors without raising', () => {
    const { options, dispatch } = partsOf();
    const errors = { items: [{ field: 'fullName', reason: 'name_rejected' }] } as const;
    const { result } = renderHook(() => useSaveSettle(options), { wrapper });

    result.current({ kind: 'invalid', errors }, NAME_CHANGE);

    expect(dispatch).toHaveBeenCalledWith({ type: 'invalid', errors });
    expect(raiseCount()).toBe(0);
  });

  it('raises and dispatches nothing when the session ended', () => {
    const { options, dispatch } = partsOf();
    const { result } = renderHook(() => useSaveSettle(options), { wrapper });

    result.current({ kind: 'failed', reason: 'session_ended' }, NAME_CHANGE);

    expect(raiseCount()).toBe(0);
    expect(dispatch).not.toHaveBeenCalled();
  });
});
