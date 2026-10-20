import { buildUserNode } from '@tests/builders';
import loadIsolated from '@tests/unit/utils/isolated-module';

type SchemasModule = typeof import('@/modules/user/features/settings/utils/response-schemas');

const loadSchemas = (): Promise<SchemasModule> =>
  loadIsolated(async () => await import('@/modules/user/features/settings/utils/response-schemas'));

describe('settings response schemas', () => {
  it('accepts the generated CurrentUser shape and hands the node back unchanged', async () => {
    const { CurrentUserResultSchema } = await loadSchemas();
    const node = buildUserNode();
    const payload = { users: { edges: [{ node }] } };

    expect(CurrentUserResultSchema.safeParse(payload)).toEqual({ success: true, data: payload });
  });

  it.each([
    ['a null connection', { users: null }],
    ['null edges', { users: { edges: null } }],
    ['a null edge', { users: { edges: [null] } }],
    ['a null node', { users: { edges: [{ node: null }] } }],
    ['undefined data', undefined],
    ['null data', null],
  ])('accepts %s as a nullish CurrentUser envelope', async (_name, payload) => {
    const { CurrentUserResultSchema } = await loadSchemas();

    expect(CurrentUserResultSchema.safeParse(payload)).toEqual({ success: true, data: payload });
  });

  it.each([
    ['a missing confirmed flag', { id: 'a', email: 'a@b.co', initials: 'A B' }],
    ['a missing id', { email: 'a@b.co', initials: 'A B', confirmed: true }],
    ['a missing e-mail', { id: 'a', initials: 'A B', confirmed: true }],
    ['missing initials', { id: 'a', email: 'a@b.co', confirmed: true }],
    [
      'a non-boolean confirmed flag',
      { id: 'a', email: 'a@b.co', initials: 'A B', confirmed: 'yes' },
    ],
  ])('rejects a CurrentUser node with %s', async (_name, node) => {
    const { CurrentUserResultSchema } = await loadSchemas();

    expect(CurrentUserResultSchema.safeParse({ users: { edges: [{ node }] } }).success).toBe(false);
  });

  it('accepts the generated UpdateUser shape and hands the user back unchanged', async () => {
    const { UpdateUserResultSchema } = await loadSchemas();
    const payload = { updateUser: { user: buildUserNode() } };

    expect(UpdateUserResultSchema.safeParse(payload)).toEqual({ success: true, data: payload });
    expect(UpdateUserResultSchema.safeParse({ updateUser: { user: null } })).toEqual({
      success: true,
      data: { updateUser: { user: null } },
    });
  });

  it('rejects an UpdateUser user without the confirmed flag', async () => {
    const { UpdateUserResultSchema } = await loadSchemas();
    const user = { id: 'a', email: 'a@b.co', initials: 'A B' };

    expect(UpdateUserResultSchema.safeParse({ updateUser: { user } }).success).toBe(false);
  });

  it('accepts the generated ResendEmailToUser shape and hands the user back as is', async () => {
    const { ResendEmailResultSchema } = await loadSchemas();
    const payload = { resendEmailToUser: { user: { id: 'a', confirmed: false } } };

    expect(ResendEmailResultSchema.safeParse(payload)).toEqual({ success: true, data: payload });
    expect(ResendEmailResultSchema.safeParse({ resendEmailToUser: null })).toEqual({
      success: true,
      data: { resendEmailToUser: null },
    });
  });

  it.each([
    ['without an id', { confirmed: true }],
    ['without the confirmed flag', { id: 'a' }],
  ])('rejects a ResendEmailToUser user %s', async (_name, user) => {
    const { ResendEmailResultSchema } = await loadSchemas();

    expect(ResendEmailResultSchema.safeParse({ resendEmailToUser: { user } }).success).toBe(false);
  });
});
