import '@testing-library/jest-dom';
import { render, screen, waitFor, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';

import composeLayoutStories, {
  type LayoutStoriesModule,
} from '@tests/unit/utils/compose-layout-stories';
import createBellLocaleI18n from '@tests/unit/utils/create-bell-locale-i18n';
import expectNoA11yViolations from '@tests/utils/a11y/expect-no-a11y-violations';
import { clearConfigBlock } from '@tests/utils/config-block';
import { resetClientStores } from '@tests/utils/reset-client-stores';

const storiesModule: LayoutStoriesModule = jest.requireActual(
  '@/modules/user/features/notifications/components/notifications-shell-slot.stories'
);

const composed = composeLayoutStories(storiesModule);

const i18n = createBellLocaleI18n('uk', ['en']);

describe('NotificationsShellSlot stories', () => {
  beforeEach(() => resetClientStores());

  afterEach(() => clearConfigBlock());

  it('ships one story per style', () => {
    expect(Object.keys(composed)).toEqual(['Toast', 'Inline', 'Bell']);
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

      await waitFor(() => expect(within(bell).getByText('1')).toBeInTheDocument());
      expect(bell).toBeEnabled();
      await expectNoA11yViolations(container);
    }
  );
});
