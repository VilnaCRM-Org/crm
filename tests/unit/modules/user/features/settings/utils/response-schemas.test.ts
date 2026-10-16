import {
  CurrentUserResultSchema,
  ResendEmailResultSchema,
  UpdateUserResultSchema,
} from '@/modules/user/features/settings/utils/response-schemas';
import { buildUserNode } from '@tests/builders';

describe('settings response schemas', () => {
  it('accepts the generated CurrentUser shape and nullish envelopes', () => {
    const node = buildUserNode();

    expect(CurrentUserResultSchema.safeParse({ users: { edges: [{ node }] } }).success).toBe(true);
    expect(CurrentUserResultSchema.safeParse({ users: null }).success).toBe(true);
    expect(CurrentUserResultSchema.safeParse(undefined).success).toBe(true);
    expect(CurrentUserResultSchema.safeParse(null).success).toBe(true);
  });

  it.each([
    ['a missing field', { id: 'a', email: 'a@b.co', initials: 'A B' }],
    ['a wrong type', { id: 'a', email: 'a@b.co', initials: 'A B', confirmed: 'yes' }],
  ])('rejects a CurrentUser node with %s', (_name, node) => {
    expect(CurrentUserResultSchema.safeParse({ users: { edges: [{ node }] } }).success).toBe(false);
  });

  it('accepts the generated UpdateUser shape and rejects a node without confirmed', () => {
    expect(
      UpdateUserResultSchema.safeParse({ updateUser: { user: buildUserNode() } }).success
    ).toBe(true);
    expect(UpdateUserResultSchema.safeParse({ updateUser: { user: { id: 'a' } } }).success).toBe(
      false
    );
  });

  it('accepts the generated ResendEmailToUser shape and rejects one without an id', () => {
    expect(
      ResendEmailResultSchema.safeParse({
        resendEmailToUser: { user: { id: 'a', confirmed: false } },
      }).success
    ).toBe(true);
    expect(
      ResendEmailResultSchema.safeParse({ resendEmailToUser: { user: { confirmed: true } } })
        .success
    ).toBe(false);
  });
});
