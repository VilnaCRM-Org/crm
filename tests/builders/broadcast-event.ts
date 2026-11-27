import { faker } from '@faker-js/faker';

export interface BroadcastEventJson {
  readonly id: string;
  readonly type: string;
  readonly occurredAt: string;
  readonly data: unknown;
}

export const buildBroadcastEvent = (
  overrides: Partial<BroadcastEventJson> = {}
): BroadcastEventJson => ({
  id: faker.string.uuid(),
  type: 'crm.broadcast',
  occurredAt: '2026-11-23T12:00:00Z',
  data: { code: 'new_version' },
  ...overrides,
});
