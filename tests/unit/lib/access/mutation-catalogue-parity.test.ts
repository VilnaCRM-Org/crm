import * as generated from '@/api/generated/graphql';
import type { MutationKey } from '@/lib/types/access/mutation-access';
import loadIsolated from '@tests/unit/utils/isolated-module';

type NamedField = { readonly name: { readonly value: string } };
type OperationDefinition = {
  readonly kind: string;
  readonly operation?: string;
  readonly selectionSet: { readonly selections: readonly NamedField[] };
};
type GraphqlDocument = {
  readonly kind: string;
  readonly definitions: readonly OperationDefinition[];
};

const isDocument = (value: unknown): value is GraphqlDocument =>
  typeof value === 'object' &&
  value !== null &&
  (value as GraphqlDocument).kind === 'Document' &&
  Array.isArray((value as GraphqlDocument).definitions);

const rootMutationFields = (): readonly string[] =>
  Object.values(generated as Record<string, unknown>)
    .filter(isDocument)
    .flatMap((document) => document.definitions)
    .filter((definition) => definition.operation === 'mutation')
    .flatMap((definition) => definition.selectionSet.selections)
    .map((selection) => selection.name.value);

const catalogueKeys = (): Promise<readonly MutationKey[]> =>
  loadIsolated(async () => {
    const { MUTATION_KEYS } = await import('@/lib/access/mutation-catalogue');
    return Object.values(MUTATION_KEYS);
  });

describe('mutation catalogue parity with the pinned GraphQL contract', () => {
  it('reads at least one mutation field out of the generated artifacts', () => {
    expect(rootMutationFields().length).toBeGreaterThan(0);
  });

  it('declares every gate key as a mutation field of the pinned contract', async () => {
    const declared = rootMutationFields();

    expect((await catalogueKeys()).filter((key) => !declared.includes(key))).toStrictEqual([]);
  });

  it('gates on createUser, which the pinned contract declares', async () => {
    expect(await catalogueKeys()).toStrictEqual(['createUser']);
    expect(rootMutationFields()).toContain('createUser');
  });
});
