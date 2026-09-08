import '@testing-library/jest-dom';
import { act, render, screen } from '@testing-library/react';

import RequireMutation from '@/components/require-mutation';
import accessSession from '@/lib/access/access-session';
import accessState from '@/lib/access/access-state';
import auditCore from '@/lib/access/audit-core';
import claimsMutationResolver from '@/lib/access/claims-mutation-resolver';
import mutationAccessDispatcher from '@/lib/access/mutation-access-dispatcher';
import { MUTATION_KEYS } from '@/lib/access/mutation-catalogue';
import noopAuditSink from '@/lib/access/noop-audit-sink';
import type { AuditEvent } from '@/lib/types/access/audit';
import AccessContext from '@/providers/access-context';
import { buildAccessToken, buildClaims, buildPrincipal } from '@tests/builders';

const GATED = 'create-user-control';

const renderGate = (): void => {
  render(
    <RequireMutation mutation={MUTATION_KEYS.createUser}>
      <button type="button">{GATED}</button>
    </RequireMutation>
  );
};

describe('mutation-keyed access, end to end', () => {
  let events: AuditEvent[] = [];

  beforeEach(() => {
    events = [];
    auditCore.useSink({ record: (event) => events.push(event) });
  });

  afterEach(() => {
    act(() => {
      accessSession.end();
    });
    auditCore.useSink(noopAuditSink);
  });

  it('renders nothing for a signed-in principal until the access source answers', () => {
    const token = buildAccessToken(buildClaims({ allowedMutations: [MUTATION_KEYS.createUser] }));
    accessSession.start({ token });

    renderGate();

    expect(accessState.get().principal?.allowedMutations).toStrictEqual([]);
    expect(screen.queryByRole('button', { name: GATED })).not.toBeInTheDocument();
  });

  it('renders the gated control once the dispatcher republishes the allowed set', async () => {
    const token = buildAccessToken(buildClaims({ allowedMutations: [MUTATION_KEYS.createUser] }));
    accessSession.start({ token });
    renderGate();

    await act(async () => {
      await mutationAccessDispatcher.request({ token });
    });

    expect(screen.getByRole('button', { name: GATED })).toBeInTheDocument();
  });

  it('keeps the control hidden when the source grants nothing', async () => {
    const token = buildAccessToken(buildClaims({ allowedMutations: [] }));
    accessSession.start({ token });
    renderGate();

    await act(async () => {
      await mutationAccessDispatcher.request({ token });
    });

    expect(screen.queryByRole('button', { name: GATED })).not.toBeInTheDocument();
  });

  it('drops a server key the UI does not gate on and audits it once', () => {
    const token = buildAccessToken({ ...buildClaims(), allowedMutations: ['deleteUser'] });

    accessSession.start({ token });

    expect(events.filter((event) => event.type === 'access_unknown_mutation')).toStrictEqual([
      expect.objectContaining({ type: 'access_unknown_mutation' }),
    ]);
  });

  it('seals the published set so a decision cannot be rewritten behind the UI', async () => {
    const token = buildAccessToken(buildClaims({ allowedMutations: [MUTATION_KEYS.createUser] }));
    accessSession.start({ token });

    await mutationAccessDispatcher.request({ token });

    expect(Object.isFrozen(accessState.get().principal?.allowedMutations)).toBe(true);
  });
  it('reads a provided snapshot ahead of the live store', () => {
    render(
      <AccessContext.Provider
        value={{
          principal: buildPrincipal({ allowedMutations: [MUTATION_KEYS.createUser] }),
          flags: {},
        }}
      >
        <RequireMutation mutation={MUTATION_KEYS.createUser}>
          <button type="button">{GATED}</button>
        </RequireMutation>
      </AccessContext.Provider>
    );

    expect(screen.getByRole('button', { name: GATED })).toBeInTheDocument();
  });

  it('denies every mutation when the access source is unavailable', async () => {
    const token = buildAccessToken(buildClaims({ allowedMutations: [MUTATION_KEYS.createUser] }));
    accessSession.start({ token });
    mutationAccessDispatcher.useResolver({
      resolve: () => Promise.reject(new Error('access source unavailable')),
    });
    renderGate();

    await act(async () => {
      await mutationAccessDispatcher.request({ token });
    });
    mutationAccessDispatcher.useResolver(claimsMutationResolver);

    expect(screen.queryByRole('button', { name: GATED })).not.toBeInTheDocument();
  });

  it('resolves an empty set when the session carries no token at all', async () => {
    await expect(claimsMutationResolver.resolve({ token: null })).resolves.toStrictEqual([]);
  });
  it('publishes nothing while no session is live', async () => {
    const token = buildAccessToken(buildClaims({ allowedMutations: [MUTATION_KEYS.createUser] }));

    await expect(mutationAccessDispatcher.request({ token })).resolves.toStrictEqual([]);
    expect(accessState.get().principal).toBeNull();
  });
});
