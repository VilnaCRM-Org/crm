import auditCore from '@/lib/access/audit-core';
import { MUTATION_KEYS } from '@/lib/access/mutation-catalogue';
import mutationKeyFilter, { MutationKeyFilter } from '@/lib/access/mutation-key-filter';
import noopAuditSink from '@/lib/access/noop-audit-sink';
import type { AuditEvent } from '@/lib/types/access/audit';

describe('MutationKeyFilter', () => {
  const filter = new MutationKeyFilter();
  let events: AuditEvent[] = [];

  beforeEach(() => {
    events = [];
    auditCore.useSink({ record: (event) => events.push(event) });
  });

  afterEach(() => {
    auditCore.useSink(noopAuditSink);
  });

  it('exports a shared singleton instance', () => {
    expect(mutationKeyFilter).toBeInstanceOf(MutationKeyFilter);
  });

  it('keeps every key the catalogue declares', () => {
    expect(filter.filter([MUTATION_KEYS.createUser])).toStrictEqual([MUTATION_KEYS.createUser]);
  });

  it('emits no audit event when every key is known', () => {
    filter.filter([MUTATION_KEYS.createUser]);

    expect(events).toStrictEqual([]);
  });

  it('emits no audit event for an empty candidate list', () => {
    expect(filter.filter([])).toStrictEqual([]);
    expect(events).toStrictEqual([]);
  });

  it('drops a key the catalogue does not declare', () => {
    expect(filter.filter(['deleteUser'])).toStrictEqual([]);
  });

  it('keeps the known keys that sit beside dropped ones', () => {
    expect(filter.filter(['deleteUser', MUTATION_KEYS.createUser, 'purgeTenant'])).toStrictEqual([
      MUTATION_KEYS.createUser,
    ]);
  });

  it('audits the dropped keys as access_unknown_mutation', () => {
    filter.filter(['deleteUser', MUTATION_KEYS.createUser]);

    expect(events).toHaveLength(1);
    expect(events[0]?.type).toBe('access_unknown_mutation');
  });

  it('names every dropped key in the audit metadata, comma separated', () => {
    filter.filter(['deleteUser', 'purgeTenant']);

    expect(events[0]?.metadata?.mutations).toBe('deleteUser,purgeTenant');
  });

  it('audits once per call rather than once per dropped key', () => {
    filter.filter(['deleteUser', 'purgeTenant', 'assignUserRoles']);

    expect(events).toHaveLength(1);
  });
});
