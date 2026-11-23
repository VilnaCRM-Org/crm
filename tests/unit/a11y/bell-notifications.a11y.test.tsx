import '@testing-library/jest-dom';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';

import composeLayoutStories, {
  type LayoutStoriesModule,
} from '@tests/unit/utils/compose-layout-stories';
import createBellLocaleI18n from '@tests/unit/utils/create-bell-locale-i18n';
import expectNoA11yViolations from '@tests/utils/a11y/expect-no-a11y-violations';
import { resetClientStores } from '@tests/utils/reset-client-stores';

const storiesModule: LayoutStoriesModule = jest.requireActual(
  '@/modules/user/features/notifications/components/bell-notifications.stories'
);

const composed = composeLayoutStories(storiesModule);

const OPENED = new Set(['HistoryOpen', 'AfterMarkAllRead']);

const i18n = createBellLocaleI18n('uk', ['en']);

const bell = (): HTMLElement => screen.getByRole('button', { name: 'Сповіщення' });

const renderStory = (name: string): ReturnType<typeof render> => {
  const Story = composed[name];
  if (Story === undefined) throw new Error(`no story ${name}`);

  return render(
    <I18nextProvider i18n={i18n}>
      <Story />
    </I18nextProvider>
  );
};

describe('BellNotifications stories', () => {
  beforeEach(() => resetClientStores());

  it('ships the five stories the bell connector documents', () => {
    expect(Object.keys(composed)).toEqual([
      'Closed',
      'WithNotice',
      'HistoryOpen',
      'AfterMarkAllRead',
      'MobileShell',
    ]);
  });

  it.each(Object.keys(composed))('%s has no axe violations', async (name) => {
    const { container } = renderStory(name);
    await waitFor(() => expect(bell()).toBeEnabled());
    if (OPENED.has(name)) await userEvent.click(bell());
    await act(async () => undefined);

    await expectNoA11yViolations(container);
  });

  it('gives each story a fresh history, so marking all read never reaches the next', async () => {
    const view = renderStory('HistoryOpen');
    await userEvent.click(bell());
    await userEvent.click(await screen.findByRole('button', { name: 'Позначити всі прочитаними' }));
    await waitFor(() => expect(bell()).not.toHaveAccessibleDescription());
    view.unmount();

    renderStory('Closed');

    await waitFor(() => expect(bell()).toHaveAccessibleDescription('1 непрочитане сповіщення'));
    await userEvent.click(bell());
    const rows = await screen.findAllByRole('listitem');

    expect(rows.filter((row) => within(row).queryByText('Непрочитане') !== null)).toHaveLength(1);
  });
});
