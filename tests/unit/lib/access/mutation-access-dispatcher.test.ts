import accessState from '@/lib/access/access-state';
import mutationAccessDispatcher, {
  MutationAccessDispatcher,
} from '@/lib/access/mutation-access-dispatcher';
import { MUTATION_KEYS } from '@/lib/access/mutation-catalogue';
import type { MutationKey } from '@/lib/types/access/mutation-access';
import { buildAccessToken, buildClaims, buildPrincipal } from '@tests/builders';

const resolverOf = (
  allowed: readonly MutationKey[]
): { resolve: () => Promise<readonly MutationKey[]> } => ({
  resolve: () => Promise.resolve(allowed),
});

const publishedMutations = (): readonly MutationKey[] | undefined =>
  accessState.get().principal?.allowedMutations;

describe('MutationAccessDispatcher', () => {
  beforeEach(() => {
    accessState.clear();
  });

  afterEach(() => {
    accessState.clear();
  });

  it('exports a shared singleton instance', () => {
    expect(mutationAccessDispatcher).toBeInstanceOf(MutationAccessDispatcher);
  });

  it('republishes the resolved set onto the live principal', async () => {
    const dispatcher = new MutationAccessDispatcher();
    dispatcher.useResolver(resolverOf([MUTATION_KEYS.createUser]));
    accessState.setSession(buildPrincipal(), {});

    await expect(dispatcher.request({ token: 'session-token' })).resolves.toStrictEqual([
      MUTATION_KEYS.createUser,
    ]);
    expect(publishedMutations()).toStrictEqual([MUTATION_KEYS.createUser]);
  });

  it('notifies the snapshot watchers when the set arrives', async () => {
    const dispatcher = new MutationAccessDispatcher();
    dispatcher.useResolver(resolverOf([MUTATION_KEYS.createUser]));
    accessState.setSession(buildPrincipal(), {});
    const watcher = jest.fn();
    const unsubscribe = accessState.subscribe(watcher);

    await dispatcher.request({ token: 'session-token' });
    unsubscribe();

    expect(watcher).toHaveBeenCalledTimes(1);
  });

  it('preserves the rest of the principal when it republishes', async () => {
    const dispatcher = new MutationAccessDispatcher();
    dispatcher.useResolver(resolverOf([MUTATION_KEYS.createUser]));
    const principal = buildPrincipal();
    accessState.setSession(principal, {});

    await dispatcher.request({ token: 'session-token' });

    expect(accessState.get().principal).toStrictEqual({
      ...principal,
      allowedMutations: [MUTATION_KEYS.createUser],
    });
  });

  it('publishes an empty set and denies when the resolver rejects', async () => {
    const dispatcher = new MutationAccessDispatcher();
    dispatcher.useResolver({ resolve: () => Promise.reject(new Error('unavailable')) });
    accessState.setSession(buildPrincipal({ allowedMutations: [MUTATION_KEYS.createUser] }), {});

    await expect(dispatcher.request({ token: 'session-token' })).resolves.toStrictEqual([]);
    expect(publishedMutations()).toStrictEqual([]);
  });

  it('denies without publishing while no session is live', async () => {
    const dispatcher = new MutationAccessDispatcher();
    dispatcher.useResolver(resolverOf([MUTATION_KEYS.createUser]));

    await expect(dispatcher.request({ token: 'session-token' })).resolves.toStrictEqual([]);
    expect(accessState.get().principal).toBeNull();
  });

  it('reads the token claims through the claim-derived resolver by default', async () => {
    const dispatcher = new MutationAccessDispatcher();
    accessState.setSession(buildPrincipal(), {});
    const token = buildAccessToken(buildClaims({ allowedMutations: [MUTATION_KEYS.createUser] }));

    await expect(dispatcher.request({ token })).resolves.toStrictEqual([MUTATION_KEYS.createUser]);
  });

  it('swaps the resolver seam without touching any call site', async () => {
    const dispatcher = new MutationAccessDispatcher();
    accessState.setSession(buildPrincipal(), {});
    const token = buildAccessToken(buildClaims({ allowedMutations: [MUTATION_KEYS.createUser] }));

    dispatcher.useResolver(resolverOf([]));

    await expect(dispatcher.request({ token })).resolves.toStrictEqual([]);
  });
});
