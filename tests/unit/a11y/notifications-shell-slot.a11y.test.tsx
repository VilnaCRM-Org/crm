import '@testing-library/jest-dom';
import { render, screen, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';

import composeLayoutStories, {
  type LayoutStoriesModule,
} from '@tests/unit/utils/compose-layout-stories';
import createBellLocaleI18n from '@tests/unit/utils/create-bell-locale-i18n';
import findBellWrapper from '@tests/unit/utils/find-bell-wrapper';
import expectNoA11yViolations from '@tests/utils/a11y/expect-no-a11y-violations';
import { resetClientStores } from '@tests/utils/reset-client-stores';

const storiesModule: LayoutStoriesModule = jest.requireActual(
  '@/modules/user/features/notifications/components/notifications-shell-slot.stories'
);

const composed = composeLayoutStories(storiesModule);

const i18n = createBellLocaleI18n('uk', ['en']);

describe('NotificationsShellSlot stories', () => {
  beforeEach(() => resetClientStores());

  it('ships one story', () => {
    expect(Object.keys(composed)).toEqual(['Default']);
  });

  it.each(Object.keys(composed))(
    '%s shows the seeded badge with no axe violations',
    async (name) => {
      const Story = composed[name];
      if (Story === undefined) throw new Error(`no story ${name}`);
      const { container } = render(
        <I18nextProvider i18n={i18n}>
          <Story />
        </I18nextProvider>
      );
      const bell = screen.getByRole('button', { name: 'Сповіщення' });

      const badge = await within(findBellWrapper(bell)).findByText('1');
      expect(badge).toHaveAttribute('aria-hidden', 'true');
      expect(bell).not.toContainElement(badge);
      expect(bell).toBeEnabled();
      await expectNoA11yViolations(container);
    }
  );
});
