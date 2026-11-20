import 'reflect-metadata';

import GraphQLProfileTransformer, {
  GraphQLTwoFactorSettingsTransformer,
} from '@/modules/user/features/settings/transformers';

describe('settings transformers barrel', () => {
  it('re-exports the profile transformer as its default', () => {
    expect(GraphQLProfileTransformer.name).toBe('GraphQLProfileTransformer');
  });

  it('re-exports the two-factor settings transformer by name', () => {
    expect(GraphQLTwoFactorSettingsTransformer.name).toBe('GraphQLTwoFactorSettingsTransformer');
  });
});
