import 'reflect-metadata';
import fs from 'fs';
import path from 'path';

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const SETTINGS_ROOT = 'src/modules/user/features/settings';
const PROVIDER_STUB_CALL = 'withProfileProvider(';

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
    .filter((file) => fs.readFileSync(file, 'utf-8').includes(PROVIDER_STUB_CALL))
    .map((file) => path.relative(repoRoot, file).split(path.sep).join('/'));

describe('stories that register a Data provider stub against the shared container', () => {
  const stories = storiesRegisteringTheProviderStub();

  it('finds the settings stories that stub the provider', () => {
    expect(stories).toEqual([
      `${SETTINGS_ROOT}/components/profile-form/profile-form.stories.tsx`,
      `${SETTINGS_ROOT}/components/user-profile-settings/user-profile-settings.stories.tsx`,
      `${SETTINGS_ROOT}/routes/user-profile/user-profile.stories.tsx`,
    ]);
  });

  it.each(stories)('%s renders each story in its own frame on the docs page', async (file) => {
    const { default: meta }: StoryModule = await import(path.join(repoRoot, file));

    expect(meta.parameters?.docs?.story?.inline).toBe(false);
  });
});
