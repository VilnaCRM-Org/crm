import { act, render, renderHook } from '@testing-library/react';
import { type JSX, type ReactNode, useRef } from 'react';
import { I18nextProvider } from 'react-i18next';

import UINotificationOutlet from '@/components/ui-notification-outlet';
import useNotifications from '@/hooks/use-notifications';
import createSettingsLocaleI18n from '@tests/unit/utils/create-settings-locale-i18n';
import expectNoA11yViolations from '@tests/utils/a11y/expect-no-a11y-violations';
import { resetClientStores } from '@tests/utils/reset-client-stores';

const success = { kind: 'success', messageKey: 'settings.toasts.saved' } as const;
const failure = { kind: 'error', messageKey: 'settings.toasts.save_failed' } as const;

function Stage(): JSX.Element {
  const save = useRef<HTMLButtonElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);

  return (
    <I18nextProvider i18n={createSettingsLocaleI18n('uk')}>
      <main>
        <h1 ref={heading} tabIndex={-1}>
          Налаштування
        </h1>
        <button type="button" ref={save}>
          Зберегти
        </button>
        <UINotificationOutlet returnFocusRef={save} fallbackFocusRef={heading} />
      </main>
    </I18nextProvider>
  );
}

const wrapper = ({ children }: { children: ReactNode }): JSX.Element => (
  <I18nextProvider i18n={createSettingsLocaleI18n('uk')}>{children}</I18nextProvider>
);

describe('UINotificationOutlet accessibility', () => {
  beforeEach(() => resetClientStores());

  it('has no axe violations before any raise', async () => {
    const { container } = render(<Stage />);

    await expectNoA11yViolations(container);
  });

  it.each([
    ['a success', [success]],
    ['an error', [failure]],
    ['a success and an error', [success, failure]],
  ] as const)('has no axe violations after %s is raised', async (_name, items) => {
    const port = renderHook(() => useNotifications(), { wrapper }).result.current;
    const { container } = render(<Stage />);

    act(() => port.raise({ items }));

    await expectNoA11yViolations(container);
  });
});
