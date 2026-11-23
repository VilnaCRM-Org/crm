import { renderHook } from '@testing-library/react';
import type { JSX, ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

import useSocialLinkSettle from '@/modules/user/features/settings/hooks/use-social-link-settle';
import type {
  SocialLinkFailureKind,
  SocialLinkSettle,
} from '@/modules/user/features/settings/types/social-link';
import createSettingsLocaleI18n from '@tests/unit/utils/create-settings-locale-i18n';

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

const setup = (): { settle: SocialLinkSettle; adopt: jest.Mock; show: jest.Mock } => {
  const adopt = jest.fn();
  const show = jest.fn();
  const toasts = { toasts: { items: [] }, announcement: '', alert: '', show, dismiss: jest.fn() };
  const i18n = createSettingsLocaleI18n('en', []);
  const wrapper = ({ children }: { children: ReactNode }): JSX.Element => (
    <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
  );
  const { result } = renderHook(() => useSocialLinkSettle(adopt, toasts), { wrapper });
  return { settle: result.current, adopt, show };
};

describe('useSocialLinkSettle', () => {
  it.each([
    ['linked', 'You have linked Google'],
    ['unlinked', 'You have unlinked Google'],
  ] as const)('adopts a %s account and shows one success toast', (intent, message) => {
    const { settle, adopt, show } = setup();

    settle({ target: google, intent, outcome: { kind: 'changed' } });

    expect(adopt.mock.calls).toEqual([['google', intent]]);
    expect(show.mock.calls).toEqual([
      [{ items: [{ tone: 'success', message, returnFocusRef: google.controlRef }] }],
    ]);
  });

  it.each(FAILURES)('shows one error toast for %s and adopts nothing', (reason, message) => {
    const { settle, adopt, show } = setup();

    settle({ target: google, intent: 'linked', outcome: { kind: 'failed', reason } });

    expect(adopt).not.toHaveBeenCalled();
    expect(show.mock.calls).toEqual([
      [{ items: [{ tone: 'error', message, returnFocusRef: google.controlRef }] }],
    ]);
  });

  it('shows an account that turns out to be linked already as linked', () => {
    const { settle, adopt, show } = setup();

    settle({
      target: google,
      intent: 'linked',
      outcome: { kind: 'failed', reason: 'provider_linked' },
    });

    expect(adopt.mock.calls).toEqual([['google', 'linked']]);
    expect(show.mock.calls).toEqual([
      [
        {
          items: [
            {
              tone: 'error',
              message: 'Your Google account is already linked.',
              returnFocusRef: google.controlRef,
            },
          ],
        },
      ],
    ]);
  });

  it('shows nothing for an aborted attempt', () => {
    const { settle, adopt, show } = setup();

    settle({ target: google, intent: 'linked', outcome: { kind: 'aborted' } });

    expect(adopt).not.toHaveBeenCalled();
    expect(show).not.toHaveBeenCalled();
  });
});
