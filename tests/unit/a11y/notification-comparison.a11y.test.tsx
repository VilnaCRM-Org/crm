import '@testing-library/jest-dom';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';

import notificationContentEn from '@/components/ui-notification-content/i18n/en.json';
import notificationContentUk from '@/components/ui-notification-content/i18n/uk.json';
import appI18n from '@/i18n';
import lazyCatalogLoader from '@/lib/locale-catalog/lazy-catalog-loader';
import settingsEn from '@/modules/user/features/settings/i18n/en.json';
import settingsUk from '@/modules/user/features/settings/i18n/uk.json';
import composeLayoutStories, {
  type LayoutStoriesModule,
} from '@tests/unit/utils/compose-layout-stories';
import createBellLocaleI18n from '@tests/unit/utils/create-bell-locale-i18n';
import expectNoA11yViolations from '@tests/utils/a11y/expect-no-a11y-violations';
import { clearConfigBlock } from '@tests/utils/config-block';
import { resetClientStores } from '@tests/utils/reset-client-stores';

const storiesModule: LayoutStoriesModule = jest.requireActual(
  '@/modules/user/features/notifications/components/comparison/notification-comparison.stories'
);

const composed = composeLayoutStories(storiesModule);

const STYLES = ['Toast', 'Inline', 'Bell'];
const OUTCOMES = ['OneSuccess', 'ThreeSuccesses', 'TransientError', 'PermanentError'];
const VIEWPORTS = ['Xl', 'Lg1366', 'Mobile375'];

const MATRIX = STYLES.flatMap((style) =>
  OUTCOMES.flatMap((outcome) => VIEWPORTS.map((viewport) => `${style}${outcome}${viewport}`))
);

const EXPECTED_NAMES = [
  ...MATRIX,
  'ToastReducedMotion',
  'InlineReducedMotion',
  'BellReducedMotion',
  'ToastHistoryOpen',
  'InlineHistoryOpen',
  'BellHistoryOpen',
  'BellAfterMarkAllRead',
];

const THREE_KEYS = [
  'settings.toasts.saved',
  'settings.toasts.email_sent',
  'settings.toasts.password_changed',
];

const i18n = createBellLocaleI18n('uk', ['en']);
lazyCatalogLoader.register(i18n, { en: notificationContentEn, uk: notificationContentUk });
lazyCatalogLoader.register(appI18n, { en: settingsEn, uk: settingsUk });

const CLOSE = i18n.t('ui_notification.close');
const MARK_ALL_READ = i18n.t('notification_center.history.mark_all_read');
const UNREAD = i18n.t('notification_center.history.unread');
const SAVED = i18n.t('settings.toasts.saved');
const THREE_TEXTS = THREE_KEYS.map((key) => i18n.t(key));

const unreadFor = (name: string): number =>
  name.includes('OneSuccess') || name.includes('Error') ? 2 : 4;

const bell = (): HTMLElement => screen.getByRole('button', { name: 'Сповіщення' });
const banner = (): HTMLElement => screen.getByRole('banner');
const main = (): HTMLElement => screen.getByRole('main');
const bannerCloseButtons = (): HTMLElement[] =>
  within(banner()).queryAllByRole('button', { name: CLOSE });

const renderStory = (name: string): ReturnType<typeof render> => {
  const Story = composed[name];
  if (Story === undefined) throw new Error(`no story ${name}`);

  return render(
    <I18nextProvider i18n={i18n}>
      <Story />
    </I18nextProvider>
  );
};

const settleUnread = async (count: number): Promise<void> => {
  await waitFor(() =>
    expect(bell()).toHaveAccessibleDescription(
      i18n.t('notification_center.bell.unread_count', {
        count,
      })
    )
  );
};

const openHistory = async (): Promise<HTMLElement[]> => {
  await userEvent.click(bell());
  await screen.findByRole('button', { name: MARK_ALL_READ });

  return within(banner()).getAllByRole('listitem');
};

describe('Notifications/Comparison stories', () => {
  beforeEach(() => {
    resetClientStores();
    Element.prototype.scrollIntoView = jest.fn();
  });

  afterEach(() => clearConfigBlock());

  it('ships the 36 matrix stories plus the seven review states', () => {
    expect(Object.keys(composed)).toEqual(EXPECTED_NAMES);
  });

  it.each(EXPECTED_NAMES)('%s has no axe violations', async (name) => {
    const { container } = renderStory(name);
    await settleUnread(unreadFor(name));
    if (name.endsWith('HistoryOpen')) await openHistory();
    await act(async () => undefined);

    await expectNoA11yViolations(container);
  });

  it.each(['Xl', 'Lg1366'])(
    'shows badge 4 and no merged card after three toast successes at %s',
    async (viewport) => {
      renderStory(`ToastThreeSuccesses${viewport}`);
      await settleUnread(4);

      expect(within(bell()).getByText('4')).toBeInTheDocument();
      expect(within(main()).getAllByRole('button', { name: CLOSE })).toHaveLength(3);
      expect(bannerCloseButtons()).toHaveLength(0);
    }
  );

  it.each(['Xl', 'Lg1366'])(
    'shows badge 4 and no merged card after three inline successes at %s',
    async (viewport) => {
      renderStory(`InlineThreeSuccesses${viewport}`);
      await settleUnread(4);

      expect(within(bell()).getByText('4')).toBeInTheDocument();
      expect(within(main()).getAllByRole('listitem')).toHaveLength(3);
      expect(screen.queryAllByRole('button', { name: CLOSE })).toHaveLength(0);
    }
  );

  it.each(['ToastOneSuccessXl', 'ToastOneSuccessLg1366', 'InlineOneSuccessXl'])(
    '%s shows badge 2 beside its one shown outcome',
    async (name) => {
      renderStory(name);
      await settleUnread(2);

      expect(within(bell()).getByText('2')).toBeInTheDocument();
      expect(within(main()).getByText(SAVED)).toBeInTheDocument();
      expect(bannerCloseButtons()).toHaveLength(0);
    }
  );

  it('lists the three outcomes first as unread beside the toast stack', async () => {
    renderStory('ToastHistoryOpen');
    await settleUnread(4);
    const rows = await openHistory();

    expect(rows.slice(0, 3).map((row) => row.textContent)).toEqual(
      THREE_TEXTS.map((text) => expect.stringContaining(text))
    );
    rows.slice(0, 3).forEach((row) => expect(within(row).getByText(UNREAD)).toBeInTheDocument());
    expect(within(main()).getAllByRole('button', { name: CLOSE })).toHaveLength(3);
    expect(bannerCloseButtons()).toHaveLength(0);
  });

  it('lists the three outcomes first as unread beside the inline block', async () => {
    renderStory('InlineHistoryOpen');
    await settleUnread(4);
    const rows = await openHistory();

    expect(rows.slice(0, 3).map((row) => row.textContent)).toEqual(
      THREE_TEXTS.map((text) => expect.stringContaining(text))
    );
    rows.slice(0, 3).forEach((row) => expect(within(row).getByText(UNREAD)).toBeInTheDocument());
    expect(within(main()).getAllByRole('listitem')).toHaveLength(3);
    expect(bannerCloseButtons()).toHaveLength(0);
  });

  it.each([
    ['Xl', '48px', '4'],
    ['Lg1366', '52px', '4'],
  ])(
    'renders the merged card under the %s header with a %s bell and its badge',
    async (viewport, width, badge) => {
      renderStory(`BellThreeSuccesses${viewport}`);
      await settleUnread(4);

      await waitFor(() => expect(bannerCloseButtons()).toHaveLength(3));
      expect(bell()).toHaveStyle({ width });
      expect(within(bell()).getByText(badge)).toBeInTheDocument();
      expect(within(main()).queryAllByRole('button', { name: CLOSE })).toHaveLength(0);
    }
  );

  it('renders the merged card under the mobile header, whose bell carries no badge', async () => {
    renderStory('BellThreeSuccessesMobile375');
    await settleUnread(4);

    await waitFor(() => expect(bannerCloseButtons()).toHaveLength(3));
    expect(within(bell()).queryByText('4')).not.toBeInTheDocument();
    expect(within(banner()).queryByRole('searchbox')).not.toBeInTheDocument();
  });

  it('gives each story a fresh history, so marking all read never reaches the next', async () => {
    const view = renderStory('BellAfterMarkAllRead');
    await settleUnread(4);
    await openHistory();
    await userEvent.click(screen.getByRole('button', { name: MARK_ALL_READ }));
    await waitFor(() => expect(bell()).not.toHaveAccessibleDescription());
    view.unmount();
    resetClientStores();

    renderStory('BellOneSuccessXl');
    await settleUnread(2);
    const rows = await openHistory();
    const unreadRows = rows.filter((row) => within(row).queryByText(UNREAD) !== null);

    expect(unreadRows.map((row) => row.textContent)).toEqual([
      expect.stringContaining(SAVED),
      expect.stringContaining(i18n.t('notification_center.seed.password_changed')),
    ]);
  });
});
