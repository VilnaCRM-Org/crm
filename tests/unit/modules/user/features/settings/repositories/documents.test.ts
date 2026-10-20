import { print } from 'graphql';

import CURRENT from '@/modules/user/features/settings/repositories/current-user-query';
import RESEND from '@/modules/user/features/settings/repositories/resend-email-to-user-mutation';
import UPDATE from '@/modules/user/features/settings/repositories/update-user-mutation';

const compact = (document: Parameters<typeof print>[0]): string =>
  print(document).replace(/\s+/g, ' ').trim();

describe('settings GraphQL documents', () => {
  it('selects exactly the current user fields through users(first: 1)', () => {
    expect(compact(CURRENT)).toBe(
      'query CurrentUser { users(first: 1) { edges { node { id email initials confirmed } } } }'
    );
  });

  it('selects exactly the updated user fields and no clientMutationId', () => {
    expect(compact(UPDATE)).toBe(
      'mutation UpdateUser($input: updateUserInput!) ' +
        '{ updateUser(input: $input) { user { id email initials confirmed } } }'
    );
  });

  it('selects exactly the id and confirmed flag of the resend payload', () => {
    expect(compact(RESEND)).toBe(
      'mutation ResendEmailToUser($input: resendEmailToUserInput!) ' +
        '{ resendEmailToUser(input: $input) { user { id confirmed } } }'
    );
  });

  it.each([
    ['CurrentUser', CURRENT],
    ['UpdateUser', UPDATE],
    ['ResendEmailToUser', RESEND],
  ])('never selects clientMutationId in %s', (_name, document) => {
    expect(compact(document)).not.toContain('clientMutationId');
  });
});
