import { act, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import accessSession from '@/lib/access/access-session';
import accessState from '@/lib/access/access-state';
import auditCore from '@/lib/access/audit-core';
import noopAuditSink from '@/lib/access/noop-audit-sink';
import { ROLES } from '@/lib/access/permission-catalog';
import type { AuditEvent, AuditSink } from '@/lib/types/access/audit';
import ProtectedRoute from '@auth/components/protected-route';
import { AuthStateVar } from '@auth/stores';
import { buildAccessToken, buildClaims } from '@tests/builders';

const record = jest.fn<void, [AuditEvent]>();
const spySink: AuditSink = { record };

const eventTypes = (): string[] => record.mock.calls.map(([event]) => event.type);

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

const routerTree = (): JSX.Element => (
  <MemoryRouter initialEntries={['/']}>
    <Routes>
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<div>dashboard</div>} />
      </Route>
      <Route path="/sign-in" element={<div>sign in page</div>} />
      <Route path="/sign-up" element={<div>sign up page</div>} />
    </Routes>
  </MemoryRouter>
);

const renderWithRouter = (token: string | null): ReturnType<typeof render> => {
  seedToken(token);
  return render(routerTree());
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

    expect(screen.getByText('sign in page')).toBeInTheDocument();
    expect(screen.queryByText('sign up page')).not.toBeInTheDocument();
    expect(screen.queryByText('dashboard')).not.toBeInTheDocument();
  });

  it('renders children when token is present', () => {
    renderWithRouter('test-token');

    expect(screen.getByText('dashboard')).toBeInTheDocument();
    expect(screen.queryByText('sign in page')).not.toBeInTheDocument();
  });

  it('leaves the access session anonymous when token is null (#114)', () => {
    renderWithRouter(null);

    expect(accessState.get().principal).toBeNull();
    expect(record).not.toHaveBeenCalled();
  });

  it('hydrates the access session from the token claims on mount (#114)', () => {
    const claims = buildClaims({ roles: [ROLES.manager] });

    renderWithRouter(buildAccessToken(claims));

    const { principal } = accessState.get();
    expect(principal?.id).toBe(claims.sub);
    expect(principal?.email).toBe(claims.email);
    expect(principal?.roles).toEqual([ROLES.manager]);
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
    expect(record.mock.calls[1][0].principalId).toBe(first.sub);
    expect(record.mock.calls[2][0].principalId).toBe(second.sub);
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
