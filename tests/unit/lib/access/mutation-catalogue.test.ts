import type { MutationCatalogue } from '@/lib/access/mutation-catalogue';
import type { MutationKey } from '@/lib/types/access/mutation-access';
import loadIsolated from '@tests/unit/utils/isolated-module';

type CatalogueModule = {
  default: MutationCatalogue;
  MUTATION_KEYS: Readonly<Record<string, MutationKey>>;
  MutationCatalogue: new () => MutationCatalogue;
};

const loadCatalogue = (): Promise<CatalogueModule> =>
  loadIsolated(async () => (await import('@/lib/access/mutation-catalogue')) as CatalogueModule);

describe('MutationCatalogue', () => {
  it('exports a shared singleton instance', async () => {
    const module = await loadCatalogue();

    expect(module.default).toBeInstanceOf(module.MutationCatalogue);
  });

  it('names createUser as the mutation the UI gates on', async () => {
    const { MUTATION_KEYS } = await loadCatalogue();

    expect(MUTATION_KEYS).toStrictEqual({ createUser: 'createUser' });
  });

  it('recognises every key the catalogue declares', async () => {
    const { default: catalogue, MUTATION_KEYS } = await loadCatalogue();

    expect(Object.values(MUTATION_KEYS).every((key) => catalogue.isKey(key))).toBe(true);
  });

  it('recognises the createUser key by its literal name', async () => {
    const { default: catalogue } = await loadCatalogue();

    expect(catalogue.isKey('createUser')).toBe(true);
  });

  it.each([
    { label: 'a mutation the catalogue does not declare', candidate: 'deleteUser' },
    { label: 'an empty string', candidate: '' },
    { label: 'a catalogue property name', candidate: 'default' },
    { label: 'an inherited object member', candidate: 'toString' },
    { label: 'the prototype key', candidate: '__proto__' },
    { label: 'a resource:action permission', candidate: 'contact:read' },
  ])('rejects $label', async ({ candidate }) => {
    const { default: catalogue } = await loadCatalogue();

    expect(catalogue.isKey(candidate)).toBe(false);
  });

  it('freezes the exported key map', async () => {
    const { MUTATION_KEYS } = await loadCatalogue();

    expect(Object.isFrozen(MUTATION_KEYS)).toBe(true);
  });
});
