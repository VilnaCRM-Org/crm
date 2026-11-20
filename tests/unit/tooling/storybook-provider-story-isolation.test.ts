import 'reflect-metadata';
import fs from 'fs';
import path from 'path';

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const SETTINGS_ROOT = 'src/modules/user/features/settings';
const NOTIFICATIONS_ROOT = 'src/modules/user/features/notifications';
const SHARED_STATE_STUB_CALLS = [
  'withProfileProvider(',
  'withCurrentUserAnswer(',
  'withCurrentUserFailure(',
  'withNotificationStyle(',
  'withRaisedNotifications(',
  'withFreshNotificationRepository(',
];

interface DocsStoryParameters {
  readonly inline?: boolean;
}

interface DocsParameters {
  readonly story?: DocsStoryParameters;
}

interface StoryMetaParameters {
  readonly docs?: DocsParameters;
}

interface StoryMeta {
  readonly parameters?: StoryMetaParameters;
}

interface StoryModule {
  readonly default: StoryMeta;
}

const walk = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });

const storiesRegisteringTheProviderStub = (): string[] =>
  walk(path.join(repoRoot, 'src'))
    .filter((file) => file.endsWith('.stories.tsx'))
    .filter((file) => {
      const source = fs.readFileSync(file, 'utf-8');
      return SHARED_STATE_STUB_CALLS.some((call) => source.includes(call));
    })
    .map((file) => path.relative(repoRoot, file).split(path.sep).join('/'));

describe('stories that stub a Data provider or the current-user answer in shared state', () => {
  const stories = storiesRegisteringTheProviderStub();

  it('finds the stories that stub shared provider, user or notification state', () => {
    expect(stories).toEqual([
      'src/components/ui-notification-outlet/ui-notification-outlet.stories.tsx',
      'src/components/ui-notification-slot/ui-notification-slot.stories.tsx',
      'src/components/ui-toast/ui-toast-stack.stories.tsx',
      `${NOTIFICATIONS_ROOT}/components/bell-notifications.stories.tsx`,
      `${NOTIFICATIONS_ROOT}/components/bell-outcome-notice.stories.tsx`,
      `${NOTIFICATIONS_ROOT}/components/comparison/notification-comparison.stories.tsx`,
      `${NOTIFICATIONS_ROOT}/components/notifications-shell-slot.stories.tsx`,
      `${SETTINGS_ROOT}/components/profile-form/profile-form.stories.tsx`,
      `${SETTINGS_ROOT}/components/profile-form/profile-section-form.stories.tsx`,
      `${SETTINGS_ROOT}/components/profile-form/section-fields.stories.tsx`,
      `${SETTINGS_ROOT}/components/user-menu/current-user-menu.stories.tsx`,
      `${SETTINGS_ROOT}/components/user-menu/user-menu-slot.stories.tsx`,
      `${SETTINGS_ROOT}/components/user-profile-settings/user-profile-settings.stories.tsx`,
      `${SETTINGS_ROOT}/routes/user-profile/user-profile.stories.tsx`,
    ]);
  });

  it.each(stories)('%s renders each story in its own frame on the docs page', async (file) => {
    const { default: meta }: StoryModule = await import(path.join(repoRoot, file));

    expect(meta.parameters?.docs?.story?.inline).toBe(false);
  });
});
