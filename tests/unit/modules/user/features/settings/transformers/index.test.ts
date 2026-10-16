import 'reflect-metadata';

import GraphQLProfileTransformer from '@/modules/user/features/settings/transformers';
import Direct from '@/modules/user/features/settings/transformers/graphql-profile-transformer';

describe('settings transformers barrel', () => {
  it('re-exports the profile transformer as its default', () => {
    expect(GraphQLProfileTransformer).toBe(Direct);
  });
});
