import { act, render, renderHook } from '@testing-library/react';
import type { JSX, ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

import UIToastStack from '@/components/ui-toast';
import useNotifications from '@/hooks/use-notifications';
import type {
  NotificationDraft,
  NotificationDraftSet,
} from '@/lib/notifications/types/notification-draft';
import createToastLocaleI18n from '@tests/unit/utils/create-toast-locale-i18n';
import expectNoA11yViolations from '@tests/utils/a11y/expect-no-a11y-violations';
import { resetClientStores } from '@tests/utils/reset-client-stores';

const i18n = createToastLocaleI18n('uk');

const wrapper = ({ children }: { children: ReactNode }): JSX.Element => (
  <I18nextProvider i18n={i18n}>
    <main>{children}</main>
  </I18nextProvider>
);

const action = { labelKey: 'Повторити', onActivate: jest.fn() };

const toast = (overrides: Partial<NotificationDraft> = {}): NotificationDraft => ({
  kind: 'success',
  messageKey: 'Зміни збережено',
  ...overrides,
});

const stacks: Array<[string, NotificationDraftSet]> = [
  ['one success toast', { items: [toast()] }],
  ['one error toast', { items: [toast({ kind: 'error', messageKey: 'Не вдалося' })] }],
  ['a success toast with an action', { items: [toast({ action })] }],
  ['an error toast with an action', { items: [toast({ kind: 'error', action })] }],
  ['three toasts', { items: [toast(), toast({ messageKey: 'Друге' }), toast()] }],
  ['a mixed stack', { items: [toast(), toast({ kind: 'error', action }), toast()] }],
];

describe('UIToastStack accessibility', () => {
  beforeEach(() => resetClientStores());

  it.each(stacks)('has no axe violations for %s', async (_name, drafts) => {
    const port = renderHook(() => useNotifications(), { wrapper }).result.current;
    const view = render(<UIToastStack />, { wrapper });

    act(() => port.raise(drafts));

    await expectNoA11yViolations(view.container);
  });

  it('has no axe violations for an empty stack', async () => {
    const view = render(<UIToastStack />, { wrapper });

    await expectNoA11yViolations(view.container);
  });
});
