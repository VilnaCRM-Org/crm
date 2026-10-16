import { render } from '@testing-library/react';
import type { JSX, ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

import type { ToastItem, ToastItemSet } from '@/components/types/ui-toast';
import UIToastStack from '@/components/ui-toast';
import createLocaleI18n from '@tests/unit/utils/create-locale-i18n';
import expectNoA11yViolations from '@tests/utils/a11y/expect-no-a11y-violations';

const wrapper = ({ children }: { children: ReactNode }): JSX.Element => (
  <I18nextProvider i18n={createLocaleI18n('uk')}>
    <main>{children}</main>
  </I18nextProvider>
);

const action = { label: 'Повторити', onActivate: jest.fn() };

const toast = (overrides: Partial<ToastItem> & Pick<ToastItem, 'id'>): ToastItem => ({
  tone: 'success',
  message: 'Зміни збережено',
  ...overrides,
});

const stacks: Array<[string, ToastItemSet]> = [
  ['one success toast', { items: [toast({ id: 1 })] }],
  ['one error toast', { items: [toast({ id: 1, tone: 'error', message: 'Не вдалося' })] }],
  ['a success toast with an action', { items: [toast({ id: 1, action })] }],
  ['an error toast with an action', { items: [toast({ id: 1, tone: 'error', action })] }],
  [
    'three toasts',
    { items: [toast({ id: 1 }), toast({ id: 2, message: 'Друге' }), toast({ id: 3 })] },
  ],
  [
    'a mixed stack',
    { items: [toast({ id: 1 }), toast({ id: 2, tone: 'error', action }), toast({ id: 3 })] },
  ],
];

describe('UIToastStack accessibility', () => {
  it.each(stacks)('has no axe violations for %s', async (_name, toasts) => {
    const view = render(
      <UIToastStack
        toasts={toasts}
        announcement="Зміни збережено"
        onDismiss={jest.fn()}
        returnFocusRef={{ current: null }}
      />,
      { wrapper }
    );

    await expectNoA11yViolations(view.container);
  });

  it('has no axe violations for an empty stack', async () => {
    const view = render(
      <UIToastStack
        toasts={{ items: [] }}
        announcement=""
        onDismiss={jest.fn()}
        returnFocusRef={{ current: null }}
      />,
      { wrapper }
    );

    await expectNoA11yViolations(view.container);
  });
});
