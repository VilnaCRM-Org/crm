import ResponseParser from '@/modules/user/features/settings/utils/current-user-response-parser';
import ApiError from '@/modules/user/lib/api-errors/api-error';
import { buildFullName, buildUserNode } from '@tests/builders';

const parser = new ResponseParser();

const ok = (body: unknown, status = 200): ReturnType<typeof parser.parse> =>
  parser.parse({ status, text: JSON.stringify(body) });

const userBody = (initials: string): unknown => ({
  data: { users: { edges: [{ node: buildUserNode({ initials }) }] } },
});

describe('CurrentUserResponseParser', () => {
  it('reads the full name of the first user node', () => {
    const fullName = buildFullName();

    expect(ok(userBody(fullName))).toEqual({ kind: 'ok', fullName });
  });

  it('reads the name beside an empty errors list or a non-list errors value', () => {
    const fullName = buildFullName();
    const body = userBody(fullName) as Record<string, unknown>;

    expect(ok({ ...body, errors: [] })).toEqual({ kind: 'ok', fullName });
    expect(ok({ ...body, errors: 'ignored' })).toEqual({ kind: 'ok', fullName });
  });

  it('reads a name from a node that carries only the initials', () => {
    const fullName = buildFullName();

    expect(ok({ data: { users: { edges: [{ node: { initials: fullName } }] } } })).toEqual({
      kind: 'ok',
      fullName,
    });
  });

  it.each([
    ['a 401 status', 401, 'unauthorized'],
    ['a 300 status', 300, 'unavailable'],
    ['a 403 status', 403, 'unavailable'],
    ['a 500 status', 500, 'unavailable'],
  ] as const)('fails %s as an HTTP error, whatever the body says', (_name, status, reason) => {
    const parsed = ok(userBody(buildFullName()), status);

    expect(parsed).toEqual({ kind: 'failed', reason, error: expect.any(ApiError) });
    expect(parsed.kind === 'failed' && parsed.error).toMatchObject({
      status,
      code: 'UNKNOWN_ERROR',
      message: `Response not successful: Received status code ${status}`,
    });
  });

  it('accepts a 299 status as a successful response', () => {
    const fullName = buildFullName();

    expect(ok(userBody(fullName), 299)).toEqual({ kind: 'ok', fullName });
  });

  it('fails a body that is not JSON', () => {
    const parsed = parser.parse({ status: 200, text: '<html>' });

    expect(parsed).toEqual({ kind: 'failed', reason: 'unavailable', error: expect.any(ApiError) });
    expect(parsed.kind === 'failed' && parsed.error).toMatchObject({
      status: 200,
      code: 'UNKNOWN_ERROR',
      message: 'Failed to parse JSON response',
    });
  });

  it.each([
    ['an envelope with neither data nor errors', {}],
    ['a non-object body', 'text'],
    ['a null body', null],
    ['null data', { data: null }],
    ['a string in place of data', { data: 'users' }],
    ['null users', { data: { users: null } }],
    ['null edges', { data: { users: { edges: null } } }],
    ['edges that are an object, not a list', { data: { users: { edges: { 0: { node: {} } } } } }],
    ['no edge', { data: { users: { edges: [] } } }],
    ['a null edge', { data: { users: { edges: [null] } } }],
    ['a null node', { data: { users: { edges: [{ node: null }] } } }],
    ['a node without initials', { data: { users: { edges: [{ node: { id: 'u' } }] } } }],
    ['non-string initials', { data: { users: { edges: [{ node: { initials: 7 } }] } } }],
  ])('fails %s as a response that is not a user', (_name, body) => {
    const parsed = ok(body, 202);

    expect(parsed).toEqual({ kind: 'failed', reason: 'unavailable', error: expect.any(ApiError) });
    expect(parsed.kind === 'failed' && parsed.error).toMatchObject({
      status: 202,
      code: 'UNKNOWN_ERROR',
      message: 'Response did not match the expected schema',
    });
  });

  it('fails GraphQL errors as one API error that carries them all', () => {
    const errors = [{ message: 'Internal server error' }, { message: 'second' }];
    const parsed = ok({ data: null, errors });

    expect(parsed).toEqual({ kind: 'failed', reason: 'unavailable', error: expect.any(ApiError) });
    expect(parsed.kind === 'failed' && parsed.error).toMatchObject({
      message: 'The CurrentUser query returned GraphQL errors',
      code: 'UNKNOWN_ERROR',
      status: 200,
      cause: errors,
    });
  });

  it.each([
    ['an Access Denied. message', { message: 'Access Denied.' }],
    ['an extension status of 401', { message: 'Nope', extensions: { status: 401 } }],
  ])('reads %s on the first GraphQL error as a denied session', (_name, first) => {
    expect(ok({ errors: [first, { message: 'later' }] })).toMatchObject({
      kind: 'failed',
      reason: 'denied',
    });
  });

  it.each([
    ['another message', { message: 'Access denied' }],
    ['another extension status', { message: 'Nope', extensions: { status: 403 } }],
    ['a null first error', null],
    ['a string first error', 'Access Denied.'],
  ])('reads %s on the first GraphQL error as unavailable', (_name, first) => {
    expect(ok({ errors: [first, { message: 'Access Denied.' }] })).toMatchObject({
      kind: 'failed',
      reason: 'unavailable',
    });
  });
});
