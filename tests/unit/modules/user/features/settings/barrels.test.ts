import 'reflect-metadata';

import ProfileProvider, {
  SocialLinkProvider,
  TwoFactorSettingsProvider,
} from '@/modules/user/features/settings/data-providers';
import GraphQLProfileRepository, {
  GraphQLSocialLinkRepository,
  GraphQLTwoFactorSettingsRepository,
} from '@/modules/user/features/settings/repositories';
import GraphQLProfileTransformer, {
  GraphQLSocialLinkTransformer,
  GraphQLTwoFactorSettingsTransformer,
} from '@/modules/user/features/settings/transformers';

interface BarrelCase {
  readonly folder: string;
  readonly exported: ReadonlyArray<{ readonly name: string }>;
  readonly names: readonly string[];
}

const BARRELS: readonly BarrelCase[] = [
  {
    folder: 'data-providers',
    exported: [ProfileProvider, SocialLinkProvider, TwoFactorSettingsProvider],
    names: ['ProfileProvider', 'SocialLinkProvider', 'TwoFactorSettingsProvider'],
  },
  {
    folder: 'repositories',
    exported: [
      GraphQLProfileRepository,
      GraphQLSocialLinkRepository,
      GraphQLTwoFactorSettingsRepository,
    ],
    names: [
      'GraphQLProfileRepository',
      'GraphQLSocialLinkRepository',
      'GraphQLTwoFactorSettingsRepository',
    ],
  },
  {
    folder: 'transformers',
    exported: [
      GraphQLProfileTransformer,
      GraphQLSocialLinkTransformer,
      GraphQLTwoFactorSettingsTransformer,
    ],
    names: [
      'GraphQLProfileTransformer',
      'GraphQLSocialLinkTransformer',
      'GraphQLTwoFactorSettingsTransformer',
    ],
  },
];

describe.each(BARRELS)('settings $folder barrel', ({ exported, names }) => {
  it('re-exports the profile class as its default and the other two by name', () => {
    expect(exported.map(({ name }) => name)).toEqual(names);
  });
});
