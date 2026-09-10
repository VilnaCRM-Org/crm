import 'reflect-metadata';

import accessCore from '@/lib/access/access-core';
import accessState from '@/lib/access/access-state';
import { MUTATION_KEYS } from '@/lib/access/mutation-catalogue';
import MutationAccessService from '@/services/access/mutation-access-service';
import { buildPrincipal } from '@tests/builders';

describe('MutationAccessService', () => {
  const service = new MutationAccessService(accessCore);

  afterEach(() => {
    accessState.clear();
  });

  it('denies every mutation while anonymous', () => {
    expect(service.can(MUTATION_KEYS.createUser)).toBe(false);
  });

  // The service answers from the same sealed snapshot the React gate reads, so a supplied set
  // reaches non-React callers without a second source of truth.
  it('grants a mutation the published principal was supplied', () => {
    accessState.setSession(buildPrincipal({ allowedMutations: [MUTATION_KEYS.createUser] }), {});

    expect(service.can(MUTATION_KEYS.createUser)).toBe(true);
  });

  it('denies a mutation the published principal was not supplied', () => {
    accessState.setSession(buildPrincipal({ allowedMutations: [] }), {});

    expect(service.can(MUTATION_KEYS.createUser)).toBe(false);
  });
});
