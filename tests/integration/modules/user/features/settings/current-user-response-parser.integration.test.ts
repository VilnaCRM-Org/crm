import '../../../../setup';
import ResponseParser from '@/modules/user/features/settings/utils/current-user-response-parser';
import { buildUserNode } from '@tests/builders';

const parser = new ResponseParser();

const parse = (body: unknown, status = 200): ReturnType<typeof parser.parse> =>
  parser.parse({ status, text: JSON.stringify(body) });

describe('CurrentUserResponseParser (integration)', () => {
  it('reads the initials of the first user node as the full name', () => {
    const node = buildUserNode();

    expect(parse({ data: { users: { edges: [{ node }] } }, errors: [] })).toEqual({
      kind: 'ok',
      fullName: node.initials,
    });
  });

  it.each([
    [401, 'unauthorized'],
    [500, 'unavailable'],
  ] as const)('reads a %s status as %s', (status, reason) => {
    expect(parse({}, status)).toMatchObject({ kind: 'failed', reason });
  });

  it.each([
    ['a body that is not JSON', { status: 200, text: '{' }],
    ['a null body', { status: 200, text: 'null' }],
    ['a null node', { status: 200, text: '{"data":{"users":{"edges":[{"node":null}]}}}' }],
    ['non-list edges', { status: 200, text: '{"data":{"users":{"edges":{}}}}' }],
    [
      'non-string initials',
      { status: 200, text: '{"data":{"users":{"edges":[{"node":{"initials":1}}]}}}' },
    ],
  ])('reads %s as unavailable', (_name, response) => {
    expect(parser.parse(response)).toMatchObject({ kind: 'failed', reason: 'unavailable' });
  });

  it.each([
    ['an Access Denied. message', { message: 'Access Denied.' }, 'unavailable'],
    ['an extension status of 401', { extensions: { status: 401 } }, 'denied'],
    ['another error', { message: 'boom' }, 'unavailable'],
  ] as const)('reads %s on the first GraphQL error as %s', (_name, first, reason) => {
    expect(parse({ errors: [first] })).toMatchObject({ kind: 'failed', reason });
  });
});
