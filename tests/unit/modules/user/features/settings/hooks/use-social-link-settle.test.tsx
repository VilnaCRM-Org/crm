import { renderHook } from '@testing-library/react';
import type { JSX, ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

import type { NotificationDraft } from '@/lib/notifications/types/notification-draft';
import useNotificationOutletStore from '@/lib/notifications/use-notification-outlet-store';
import useSocialLinkSettle from '@/modules/user/features/settings/hooks/use-social-link-settle';
import type {
  SocialLinkFailureKind,
  SocialLinkSettle,
} from '@/modules/user/features/settings/types/social-link';
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

const setup = (): { settle: SocialLinkSettle; adopt: jest.Mock } => {
  const adopt = jest.fn();
  const i18n = createSettingsLocaleI18n('en', []);
  const wrapper = ({ children }: { children: ReactNode }): JSX.Element => (
    <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
  );
  const { result } = renderHook(() => useSocialLinkSettle(adopt), { wrapper });
  return { settle: result.current, adopt };
};

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

  it('shows nothing for an aborted attempt', () => {
    const { settle, adopt } = setup();

    settle({ target: google, intent: 'linked', outcome: { kind: 'aborted' } });

    expect(adopt).not.toHaveBeenCalled();
    expect(useNotificationOutletStore.getState().revision).toBe(0);
  });
});
