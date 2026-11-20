import type { Decorator, Meta, StoryObj } from '@storybook/react-webpack5';
import '@testing-library/jest-dom';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentType, JSX } from 'react';
import { I18nextProvider } from 'react-i18next';

import type { ShellLayout } from '@/components/types/ui-app-shell';
import createBellLocaleI18n from '@tests/unit/utils/create-bell-locale-i18n';
import expectNoA11yViolations from '@tests/utils/a11y/expect-no-a11y-violations';
import { clearConfigBlock } from '@tests/utils/config-block';
import { resetClientStores } from '@tests/utils/reset-client-stores';

interface StageArgs {
  readonly layout: ShellLayout;
}

type StageMeta = Meta<ComponentType<StageArgs>>;

type StageStory = StoryObj<ComponentType<StageArgs>>;

interface StoriesModule {
  readonly [name: string]: StageStory | StageMeta;
  readonly default: StageMeta;
}

const storiesModule: StoriesModule = jest.requireActual(
  '@/modules/user/features/notifications/components/bell-notifications.stories'
);

const { default: meta, ...stories } = storiesModule;

const storyContext = {} as Parameters<Decorator<StageArgs>>[1];

type StoryRender = () => JSX.Element;

const decorate = (story: StageStory): StoryRender => {
  const Stage = meta.component;
  if (Stage === undefined) throw new Error('the stories declare no component');
  const args: StageArgs = { layout: 'desktop', ...meta.args, ...story.args };
  const decorators = [story.decorators ?? [], meta.decorators ?? []].flat();

  return decorators.reduce<StoryRender>(
    (Inner, decorator) =>
      function Decorated(): JSX.Element {
        return decorator(Inner, storyContext) as JSX.Element;
      },
    function Undecorated(): JSX.Element {
      return <Stage layout={args.layout} />;
    }
  );
};

const composed: Record<string, StoryRender> = Object.fromEntries(
  Object.entries(stories).map(([name, story]) => [name, decorate(story as StageStory)])
);

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

  afterEach(() => clearConfigBlock());

  it('ships the eight stories the bell connector documents', () => {
    expect(Object.keys(composed)).toEqual([
      'ToastClosed',
      'InlineClosed',
      'BellClosed',
      'BellWithNotice',
      'HistoryOpen',
      'AfterMarkAllRead',
      'DesktopShell',
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

    renderStory('ToastClosed');

    await waitFor(() => expect(bell()).toHaveAccessibleDescription('1 непрочитане сповіщення'));
    await userEvent.click(bell());
    const rows = await screen.findAllByRole('listitem');

    expect(rows.filter((row) => within(row).queryByText('Непрочитане') !== null)).toHaveLength(1);
  });
});
