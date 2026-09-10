import { act, render, screen } from '@testing-library/react';
import type { JSX } from 'react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';

import accessCore from '@/lib/access/access-core';
import accessSession from '@/lib/access/access-session';
import accessState from '@/lib/access/access-state';
import auditCore from '@/lib/access/audit-core';
import noopAuditSink from '@/lib/access/noop-audit-sink';
import sessionFactory from '@/lib/access/session-factory';
import type { AuditEvent, AuditSink } from '@/lib/types/access/audit';
import type { RedirectNavigationState } from '@/routes/types/navigation-state';
import ProtectedRoute from '@auth/components/protected-route';
import { AuthStateVar } from '@auth/stores';
import { SAMPLE_ROLES, buildAccessToken, buildClaims, buildTenantRef } from '@tests/builders';

const record = jest.fn<void, [AuditEvent]>();
const spySink: AuditSink = { record };

const eventTypes = (): string[] => record.mock.calls.map(([event]) => event.type);
const eventAt = (index: number): AuditEvent => {
  const call = record.mock.calls[index];
  if (call === undefined) {
    throw new Error(`no audit event recorded at index ${index}`);
  }
  return call[0];
};

function seedToken(token: string | null): void {
  act(() => {
    AuthStateVar.reset();
    AuthStateVar.set({ token });
  });
}

function swapToken(token: string): void {
  act(() => {
    AuthStateVar.set({ token });
  });
}

function SignInProbe(): JSX.Element {
  const location = useLocation();
  const from = (location.state as RedirectNavigationState | null)?.from;
  const target = from ? `${from.pathname}${from.search}${from.hash}` : 'none';
  return <div>sign in page from:{target}</div>;
}

const routerTree = (initialEntry = '/'): JSX.Element => (
  <MemoryRouter initialEntries={[initialEntry]}>
    <Routes>
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<div>dashboard</div>} />
      </Route>
      <Route path="/sign-in" element={<SignInProbe />} />
      <Route path="/sign-up" element={<div>sign up page</div>} />
    </Routes>
  </MemoryRouter>
);

const renderWithRouter = (token: string | null, initialEntry = '/'): ReturnType<typeof render> => {
  seedToken(token);
  return render(routerTree(initialEntry));
};

describe('ProtectedRoute', () => {
  beforeEach(() => {
    accessSession.end();
    auditCore.useSink(spySink);
  });

  afterEach(() => {
    auditCore.useSink(noopAuditSink);
    act(() => {
      accessSession.end();
      AuthStateVar.reset();
    });
  });

  it('redirects to /sign-in (not /sign-up) when token is null', () => {
    renderWithRouter(null);

    expect(screen.getByText(/sign in page/)).toBeInTheDocument();
    expect(screen.queryByText('sign up page')).not.toBeInTheDocument();
    expect(screen.queryByText('dashboard')).not.toBeInTheDocument();
  });

  it('preserves the intended location in the redirect state (issue #150)', () => {
    renderWithRouter(null, '/?tab=deals#activity');

    expect(screen.getByText('sign in page from:/?tab=deals#activity')).toBeInTheDocument();
  });

  it('renders children when token is present', () => {
    renderWithRouter('test-token');

    expect(screen.getByText('dashboard')).toBeInTheDocument();
    expect(screen.queryByText(/sign in page/)).not.toBeInTheDocument();
  });

  it('leaves the access session anonymous when token is null (#114)', () => {
    renderWithRouter(null);

    expect(accessState.get().principal).toBeNull();
    expect(record).not.toHaveBeenCalled();
  });

  it('hydrates the access session from the token claims on mount (#114)', () => {
    const claims = buildClaims({ roles: [SAMPLE_ROLES.manager] });

    renderWithRouter(buildAccessToken(claims));

    const { principal } = accessState.get();
    expect(principal?.id).toBe(claims.sub);
    expect(principal?.email).toBe(claims.email);
    expect(principal?.roles).toEqual([SAMPLE_ROLES.manager]);
    expect(principal?.tenantId).toBe(claims.tenantId);
    expect(principal?.tenants).toEqual(claims.tenants);
    expect(eventTypes()).toEqual(['login']);
  });

  it('does not re-hydrate the access session for the same token (#114)', () => {
    const token = buildAccessToken(buildClaims());

    const view = renderWithRouter(token);
    const hydrated = accessState.get();
    view.rerender(routerTree());
    render(routerTree());

    expect(accessState.get()).toBe(hydrated);
    expect(eventTypes()).toEqual(['login']);
  });

  it('re-hydrates the access session when the token changes (#114)', () => {
    const first = buildClaims();
    const second = buildClaims();

    renderWithRouter(buildAccessToken(first));
    expect(accessState.get().principal?.id).toBe(first.sub);

    swapToken(buildAccessToken(second));

    expect(accessState.get().principal?.id).toBe(second.sub);
    // The outgoing principal is closed out before the replacement logs in, so the trail
    // reconciles into whole sessions instead of a run of logins with no ends.
    expect(eventTypes()).toEqual(['login', 'logout', 'login']);
    expect(eventAt(1).principalId).toBe(first.sub);
    expect(eventAt(2).principalId).toBe(second.sub);
  });

  // Regression: the layout effect depends on whether a principal is hydrated, never on the
  // principal itself. Composing the DI container installs the bound repository as the loader,
  // which clears the memoized token, so an identity-keyed dependency would re-enter the sync on
  // the next snapshot and rebuild the session — silently undoing a tenant switch.
  it('keeps a tenant switch made after the session loader was reinstalled (#114)', () => {
    const home = buildTenantRef();
    const other = buildTenantRef();
    const claims = buildClaims({
      roles: [SAMPLE_ROLES.manager],
      tenantId: home.id,
      tenants: [home, other],
    });

    renderWithRouter(buildAccessToken(claims));
    expect(accessState.get().principal?.tenantId).toBe(home.id);

    act(() => {
      accessSession.useLoader(sessionFactory);
      expect(accessCore.switchTenant(other.id)).toBe(true);
    });

    expect(accessState.get().principal?.tenantId).toBe(other.id);
    expect(eventTypes()).toEqual(['login', 'tenant_switch']);
    expect(screen.getByText('dashboard')).toBeInTheDocument();
  });

  // Regression: the layout effect depends on the hydrated principal as well as the token,
  // so a session ended under a still-valid token re-hydrates instead of leaving the gated
  // page blank forever.
  it('re-hydrates after the session is ended under a still-valid token (#114)', () => {
    const claims = buildClaims();
    renderWithRouter(buildAccessToken(claims));
    expect(accessState.get().principal?.id).toBe(claims.sub);

    act(() => {
      accessSession.end();
    });

    expect(accessState.get().principal?.id).toBe(claims.sub);
    expect(eventTypes()).toEqual(['login', 'logout', 'login']);
    expect(screen.getByText('dashboard')).toBeInTheDocument();
  });
});
