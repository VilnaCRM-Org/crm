import mutationAccessCore, { MutationAccessCore } from '@/lib/access/mutation-access-core';
import { MUTATION_KEYS } from '@/lib/access/mutation-catalogue';
import { buildPrincipal } from '@tests/builders';

describe('MutationAccessCore', () => {
  const core = new MutationAccessCore();

  it('exports a shared singleton instance', () => {
    expect(mutationAccessCore).toBeInstanceOf(MutationAccessCore);
  });

  it('allows a mutation the principal was granted', () => {
    const principal = buildPrincipal({ allowedMutations: [MUTATION_KEYS.createUser] });

    expect(core.can(principal, MUTATION_KEYS.createUser)).toBe(true);
  });

  it('denies a mutation absent from the granted set', () => {
    const principal = buildPrincipal({ allowedMutations: [] });

    expect(core.can(principal, MUTATION_KEYS.createUser)).toBe(false);
  });

  it('denies every mutation while anonymous', () => {
    expect(core.can(null, MUTATION_KEYS.createUser)).toBe(false);
  });
});
