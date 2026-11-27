import { act, renderHook } from '@testing-library/react';
import type { JSX, ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

import type { NotificationDraft } from '@/lib/notifications/types/notification-draft';
import useNotificationOutletStore from '@/lib/notifications/use-notification-outlet-store';
import useSocialLinkSettle from '@/modules/user/features/settings/hooks/use-social-link-settle';
import type {
  SocialLinkFailureKind,
  SocialLinkTarget,
} from '@/modules/user/features/settings/types/social-link';
import type {
  SocialLinkFocusReturn,
  SocialLinkSettlement,
} from '@/modules/user/features/settings/types/social-link/social-links';
import createSettingsLocaleI18n from '@tests/unit/utils/create-settings-locale-i18n';
import { resetClientStores } from '@tests/utils/reset-client-stores';

import { google } from './social-link-test-deps';

const FAILURES: readonly (readonly [SocialLinkFailureKind, string])[] = [
  ['cancelled', 'Linking Google was cancelled.'],
  ['blocked', 'The browser blocked the Google window. Allow pop-ups for this site and try again.'],
  ['already_linked', 'This Google account is already linked to another user.'],
  [
    'last_method',
    'Google is your only way to sign in. Set a password or link another account first.',
  ],
  ['expired', 'The attempt to link Google expired. Try again.'],
  [
    'unavailable',
    'The service is not responding, so it is not known whether Google changed. ' +
      'Try again in a minute.',
  ],
  ['generic', 'The Google link could not be changed. Try again.'],
];

const raised = (): NotificationDraft[] =>
  useNotificationOutletStore
    .getState()
    .raised.items.map(({ kind, messageKey, messageValues, action }) => ({
      kind,
      messageKey,
      messageValues,
      action,
    }));

const announced = (): { polite: string; assertive: string } => {
  const { polite, assertive } = useNotificationOutletStore.getState().announcement;
  return { polite: polite.replace(/\u200b/gu, ''), assertive: assertive.replace(/\u200b/gu, '') };
};

interface SettleSetup {
  readonly settle: (settlement: SocialLinkSettlement) => void;
  readonly adopt: jest.Mock;
  readonly rerender: () => void;
}

const setup = (returnFocusRef: SocialLinkFocusReturn = { current: null }): SettleSetup => {
  const adopt = jest.fn();
  const i18n = createSettingsLocaleI18n('en', []);
  const wrapper = ({ children }: { children: ReactNode }): JSX.Element => (
    <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
  );
  const { result, rerender } = renderHook(() => useSocialLinkSettle({ adopt, returnFocusRef }), {
    wrapper,
  });
  const settle = (settlement: SocialLinkSettlement): void => {
    act(() => {
      result.current(settlement);
    });
  };
  return { settle, adopt, rerender: () => rerender() };
};

const tileWith = (control: HTMLElement): SocialLinkTarget => ({
  ...google,
  controlRef: { current: control },
});

const providerValues = { items: [{ name: 'provider', value: 'Google' }] };

describe('useSocialLinkSettle', () => {
  beforeEach(() => {
    resetClientStores();
  });

  it.each([
    ['linked', 'You have linked Google'],
    ['unlinked', 'You have unlinked Google'],
  ] as const)('adopts a %s account and raises one success notification', (intent, message) => {
    const { settle, adopt } = setup();

    settle({ target: google, intent, outcome: { kind: 'changed' } });

    expect(adopt.mock.calls).toEqual([['google', intent]]);
    expect(raised()).toEqual([
      {
        kind: 'success',
        messageKey: `settings.social.${intent}`,
        messageValues: providerValues,
        action: undefined,
      },
    ]);
    expect(announced()).toEqual({ polite: message, assertive: '' });
  });

  it.each(FAILURES)(
    'raises one error notification for %s and adopts nothing',
    (reason, message) => {
      const { settle, adopt } = setup();

      settle({ target: google, intent: 'linked', outcome: { kind: 'failed', reason } });

      expect(adopt).not.toHaveBeenCalled();
      expect(raised()).toEqual([
        {
          kind: 'error',
          messageKey: `settings.social.failures.${reason}`,
          messageValues: providerValues,
          action: undefined,
        },
      ]);
      expect(announced()).toEqual({ polite: '', assertive: message });
    }
  );

  it('shows an account that turns out to be linked already as linked', () => {
    const { settle, adopt } = setup();

    settle({
      target: google,
      intent: 'linked',
      outcome: { kind: 'failed', reason: 'provider_linked' },
    });

    expect(adopt.mock.calls).toEqual([['google', 'linked']]);
    expect(raised()).toEqual([
      {
        kind: 'error',
        messageKey: 'settings.social.failures.provider_linked',
        messageValues: providerValues,
        action: undefined,
      },
    ]);
    expect(announced().assertive).toBe('Your Google account is already linked.');
  });

  it('shows nothing for an aborted attempt and leaves the return target alone', () => {
    const save = document.createElement('button');
    const returnFocusRef: SocialLinkFocusReturn = { current: save };
    const { settle, adopt } = setup(returnFocusRef);

    settle({
      target: tileWith(document.createElement('button')),
      intent: 'linked',
      outcome: { kind: 'aborted' },
    });

    expect(adopt).not.toHaveBeenCalled();
    expect(useNotificationOutletStore.getState().revision).toBe(0);
    expect(returnFocusRef.current).toBe(save);
  });

  it.each([
    ['a change', { kind: 'changed' }],
    ['an already-linked refusal', { kind: 'failed', reason: 'provider_linked' }],
    ['a failure', { kind: 'failed', reason: 'unavailable' }],
  ] as const)('points the page return target at the tile control after %s', (_name, outcome) => {
    const control = document.createElement('button');
    const returnFocusRef: SocialLinkFocusReturn = { current: document.createElement('button') };
    const { settle } = setup(returnFocusRef);

    settle({ target: tileWith(control), intent: 'linked', outcome });

    expect(returnFocusRef.current).toBe(control);
  });

  it('keeps a return target another section took until the tile settles again', () => {
    const control = document.createElement('button');
    const save = document.createElement('button');
    const target = tileWith(control);
    const returnFocusRef: SocialLinkFocusReturn = { current: null };
    const { settle, rerender } = setup(returnFocusRef);

    settle({ target, intent: 'linked', outcome: { kind: 'changed' } });
    returnFocusRef.current = save;
    rerender();
    expect(returnFocusRef.current).toBe(save);

    settle({ target, intent: 'unlinked', outcome: { kind: 'changed' } });
    expect(returnFocusRef.current).toBe(control);
  });
});
