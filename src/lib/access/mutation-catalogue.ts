import type { MutationKey } from '@/lib/types/access/mutation-access';

const MUTATION_KEYS = Object.freeze({
  createUser: 'createUser',
} as const) satisfies Readonly<Record<string, MutationKey>>;

const GATED_MUTATIONS: ReadonlySet<string> = new Set<string>(Object.values(MUTATION_KEYS));

export class MutationCatalogue {
  public isKey(candidate: string): candidate is MutationKey {
    return GATED_MUTATIONS.has(candidate);
  }
}

const mutationCatalogue = new MutationCatalogue();

export { MUTATION_KEYS };

export default mutationCatalogue;
