import claimsMutationResolver, {
  ClaimsMutationResolver,
} from '@/lib/access/claims-mutation-resolver';
import { MUTATION_KEYS } from '@/lib/access/mutation-catalogue';
import { buildAccessToken, buildClaims } from '@tests/builders';

describe('ClaimsMutationResolver', () => {
  const resolver = new ClaimsMutationResolver();

  it('exports a shared singleton instance', () => {
    expect(claimsMutationResolver).toBeInstanceOf(ClaimsMutationResolver);
  });

  it('resolves the allowed mutations carried by the token claims', async () => {
    const token = buildAccessToken(buildClaims({ allowedMutations: [MUTATION_KEYS.createUser] }));

    await expect(resolver.resolve({ token })).resolves.toStrictEqual([MUTATION_KEYS.createUser]);
  });

  it('resolves an empty set when the token carries no allowed mutations', async () => {
    await expect(
      resolver.resolve({ token: buildAccessToken(buildClaims()) })
    ).resolves.toStrictEqual([]);
  });

  it('resolves an empty set for an absent token', async () => {
    await expect(resolver.resolve({ token: null })).resolves.toStrictEqual([]);
  });

  it('resolves an empty set for a token whose payload is unreadable', async () => {
    await expect(resolver.resolve({ token: 'not-a-jwt' })).resolves.toStrictEqual([]);
  });
});
