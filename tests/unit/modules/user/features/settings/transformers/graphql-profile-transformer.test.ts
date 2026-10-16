import GraphQLProfileTransformer from '@/modules/user/features/settings/transformers';
import type {
  FieldViolationReason,
  UserServiceFailure,
  UserServiceFailureReason,
} from '@/modules/user/types/user-service/user-service-failure';
import { buildProfileChange, buildUserNode } from '@tests/builders';

const transformer = new GraphQLProfileTransformer();

const failure = (
  reason: UserServiceFailureReason,
  violations: Array<{ path: string; reason: FieldViolationReason }> = []
): UserServiceFailure => ({ reason, status: null, violations: { items: violations } });

const REJECTED = { kind: 'failed', reason: 'rejected' };

describe('GraphQLProfileTransformer.toUpdateInput', () => {
  it('maps a name-only change to id, password and trimmed initials', () => {
    const change = buildProfileChange({ fullName: '  Олена Петренко  ' });

    expect(transformer.toUpdateInput(change)).toEqual({
      id: change.id,
      password: change.currentPassword,
      initials: 'Олена Петренко',
    });
    expect(Object.keys(transformer.toUpdateInput(change)).sort()).toEqual([
      'id',
      'initials',
      'password',
    ]);
  });

  it.each([
    ['e-mail only', { email: 'new@example.com' }, ['email', 'id', 'password']],
    ['password only', { newPassword: 'Newpass123' }, ['id', 'newPassword', 'password']],
    [
      'all three',
      { fullName: 'A B', email: 'a@b.co', newPassword: 'Newpass123' },
      ['email', 'id', 'initials', 'newPassword', 'password'],
    ],
  ])('sends exactly the %s keys with no undefined value', (_name, fields, keys) => {
    const change = {
      id: buildProfileChange().id,
      currentPassword: buildProfileChange().currentPassword,
      ...fields,
    };

    const input = transformer.toUpdateInput(change);

    expect(Object.keys(input).sort()).toEqual(keys);
    expect(Object.values(input)).not.toContain(undefined);
  });
});

describe('GraphQLProfileTransformer outcomes', () => {
  it('turns the first edge node into a user entity with the full name from initials', () => {
    const node = buildUserNode();

    expect(transformer.toReadOutcome({ users: { edges: [{ node }] } })).toEqual({
      kind: 'ok',
      user: { id: node.id, fullName: node.initials, email: node.email, confirmed: node.confirmed },
    });
  });

  it.each([
    ['an empty edge list', { users: { edges: [] } }],
    ['a null node', { users: { edges: [{ node: null }] } }],
    ['a null edge', { users: { edges: [null] } }],
    ['null edges', { users: { edges: null } }],
    ['a null connection', { users: null }],
    ['no data', null],
    ['undefined data', undefined],
    ['a schema failure', { users: { edges: [{ node: { id: 1 } }] } }],
  ])('turns %s into a rejected read', (_name, data) => {
    expect(transformer.toReadOutcome(data as never)).toEqual(REJECTED);
  });

  it('turns an update payload into the user entity', () => {
    const node = buildUserNode();

    expect(transformer.toUpdateOutcome({ updateUser: { user: node } })).toEqual({
      kind: 'ok',
      user: { id: node.id, fullName: node.initials, email: node.email, confirmed: node.confirmed },
    });
  });

  it.each([
    ['a null user', { updateUser: { user: null } }],
    ['a null payload', { updateUser: null }],
    ['no data', null],
    ['a schema failure', { updateUser: { user: { id: 'x' } } }],
  ])('turns %s into a rejected update', (_name, data) => {
    expect(transformer.toUpdateOutcome(data as never)).toEqual(REJECTED);
  });

  it.each([true, false])(
    'turns a resend payload with confirmed %s into a confirmation',
    (confirmed) => {
      expect(
        transformer.toResendOutcome({ resendEmailToUser: { user: { id: 'x', confirmed } } })
      ).toEqual({ kind: 'confirmed', confirmed });
    }
  );

  it.each([
    ['a null user', { resendEmailToUser: { user: null } }],
    ['a null payload', { resendEmailToUser: null }],
    ['no data', undefined],
    ['a schema failure', { resendEmailToUser: { user: { id: 'x' } } }],
  ])('turns %s into a rejected resend', (_name, data) => {
    expect(transformer.toResendOutcome(data as never)).toEqual(REJECTED);
  });
});

describe('GraphQLProfileTransformer.failed', () => {
  it.each([
    ['unauthenticated', 'session_ended'],
    ['access_denied', 'session_ended'],
    ['rate_limited', 'rate_limited'],
    ['network', 'transient'],
    ['server', 'transient'],
    ['aborted', 'transient'],
    ['violation', 'rejected'],
    ['refused', 'rejected'],
    ['unknown', 'rejected'],
    ['invalid_password', 'rejected'],
  ] as const)('maps %s to %s', (reason, expected) => {
    expect(transformer.failed(failure(reason))).toEqual({ kind: 'failed', reason: expected });
  });
});

describe('GraphQLProfileTransformer.invalid', () => {
  it('maps invalid_password to the wrong current password', () => {
    expect(transformer.invalid(failure('invalid_password'))).toEqual({
      kind: 'invalid',
      errors: { items: [{ field: 'currentPassword', reason: 'password_wrong' }] },
    });
  });

  it.each([
    ['initials', 'other', { field: 'fullName', reason: 'name_rejected' }],
    ['email', 'taken', { field: 'email', reason: 'email_taken' }],
    ['email', 'other', { field: 'email', reason: 'email_invalid' }],
    ['password', 'other', { field: 'currentPassword', reason: 'password_not_accepted' }],
    ['newPassword', 'other', { field: 'newPassword', reason: 'new_password_rejected' }],
  ] as const)('maps a %s violation (%s) to its field error', (path, reason, expected) => {
    expect(transformer.invalid(failure('violation', [{ path, reason }]))).toEqual({
      kind: 'invalid',
      errors: { items: [expected] },
    });
  });

  it('gives one field error per path, in order', () => {
    const outcome = transformer.invalid(
      failure('violation', [
        { path: 'initials', reason: 'other' },
        { path: 'email', reason: 'taken' },
      ])
    );

    expect(outcome).toEqual({
      kind: 'invalid',
      errors: {
        items: [
          { field: 'fullName', reason: 'name_rejected' },
          { field: 'email', reason: 'email_taken' },
        ],
      },
    });
  });

  it.each([
    ['an unknown path', failure('violation', [{ path: 'clientMutationId', reason: 'other' }])],
    [
      'a known path beside an unknown one',
      failure('violation', [
        { path: 'initials', reason: 'other' },
        { path: 'token', reason: 'other' },
      ]),
    ],
    [
      'a taken reason on a non-email path',
      failure('violation', [{ path: 'initials', reason: 'taken' }]),
    ],
    ['an empty violation set', failure('violation')],
    ['a rate limit', failure('rate_limited')],
    ['a server failure', failure('server')],
    ['an unauthenticated failure', failure('unauthenticated')],
  ])('gives null for %s', (_name, input) => {
    expect(transformer.invalid(input)).toBeNull();
  });
});
