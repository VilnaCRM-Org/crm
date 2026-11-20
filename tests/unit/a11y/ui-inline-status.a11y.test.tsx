import { render } from '@testing-library/react';

import UIInlineStatus from '@/components/ui-inline-status';
import type {
  NotificationView,
  NotificationViewSet,
} from '@/lib/notifications/types/notification-view';
import expectNoA11yViolations from '@tests/utils/a11y/expect-no-a11y-violations';

const retry = { label: 'Повторити', onActivate: jest.fn() };

const view = (id: string, overrides: Partial<NotificationView> = {}): NotificationView => ({
  id,
  kind: 'success',
  message: `Повідомлення ${id}`,
  ...overrides,
});

const states: Array<[string, NotificationViewSet]> = [
  ['one success line', { items: [view('1')] }],
  ['one error line', { items: [view('1', { kind: 'error' })] }],
  ['three lines', { items: [view('1'), view('2'), view('3')] }],
  ['a transient error with retry', { items: [view('1', { kind: 'error', action: retry })] }],
  ['a mixed batch', { items: [view('1'), view('2', { kind: 'error', action: retry }), view('3')] }],
];

describe('UIInlineStatus accessibility', () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = jest.fn();
  });

  it.each(states)('has no axe violations for %s', async (_name, views) => {
    const { container } = render(
      <main>
        <UIInlineStatus views={views} />
      </main>
    );

    await expectNoA11yViolations(container);
  });

  it('has no axe violations for the e-mail placement', async () => {
    const { container } = render(
      <main>
        <UIInlineStatus views={{ items: [view('1')] }} placement="email" />
      </main>
    );

    await expectNoA11yViolations(container);
  });
});
