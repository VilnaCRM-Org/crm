import { print } from 'graphql';

import {
  CompleteSocialLinkDocument as COMPLETE,
  InitiateSocialLinkDocument as INITIATE,
  LinkedSocialProvidersDocument as LIST,
  UnlinkSocialProviderDocument as UNLINK,
} from '@/api/generated/graphql';

const compact = (document: Parameters<typeof print>[0]): string =>
  print(document).replace(/\s+/g, ' ').trim();

describe('social link GraphQL documents', () => {
  it('selects exactly the linked provider names', () => {
    expect(compact(LIST)).toBe('query LinkedSocialProviders { linkedSocialProviders }');
  });

  it('selects exactly the authorization URL and state from initiate', () => {
    expect(compact(INITIATE)).toBe(
      'mutation InitiateSocialLink($input: initiateSocialLinkUserInput!) ' +
        '{ initiateSocialLinkUser(input: $input) { user { authorizationUrl state } } }'
    );
  });

  it('selects exactly success from complete', () => {
    expect(compact(COMPLETE)).toBe(
      'mutation CompleteSocialLink($input: completeSocialLinkUserInput!) ' +
        '{ completeSocialLinkUser(input: $input) { user { success } } }'
    );
  });

  it('selects exactly success from unlink', () => {
    expect(compact(UNLINK)).toBe(
      'mutation UnlinkSocialProvider($input: unlinkSocialProviderUserInput!) ' +
        '{ unlinkSocialProviderUser(input: $input) { user { success } } }'
    );
  });
});
