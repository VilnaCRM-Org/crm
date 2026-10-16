import { render } from '@testing-library/react';
import type { ComponentProps, JSX, ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

import UserProfileSettings from '@/modules/user/features/settings/components/user-profile-settings';
import { buildUserEntity } from '@tests/builders';
import createSettingsLocaleI18n from '@tests/unit/utils/create-settings-locale-i18n';
import expectNoA11yViolations from '@tests/utils/a11y/expect-no-a11y-violations';

const wrapper = ({ children }: { children: ReactNode }): JSX.Element => (
  <I18nextProvider i18n={createSettingsLocaleI18n('uk')}>
    <main>{children}</main>
  </I18nextProvider>
);

type Props = ComponentProps<typeof UserProfileSettings>;

const base: Props = {
  status: 'loading',
  user: null,
  version: 0,
  refocus: false,
  retry: () => undefined,
  adoption: { adopt: () => undefined, confirm: () => undefined },
};

describe('profile load states accessibility', () => {
  it.each([
    ['loading', base],
    ['failed', { ...base, status: 'failed' as const }],
    ['ready', { ...base, status: 'ready' as const, user: buildUserEntity() }],
  ])('has no axe violations while %s', async (_state, state) => {
    const view = render(
      <UserProfileSettings
        status={state.status}
        user={state.user}
        version={state.version}
        refocus={state.refocus}
        retry={state.retry}
        adoption={state.adoption}
      />,
      { wrapper }
    );

    await expectNoA11yViolations(view.container);
  });
});
