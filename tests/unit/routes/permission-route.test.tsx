import { ThemeProvider } from '@mui/material/styles';
import { act, fireEvent, render, screen } from '@testing-library/react';
import type { RenderResult } from '@testing-library/react';
import { Suspense, useCallback } from 'react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';

import localization from '@/i18n/localization.json';
import accessSession from '@/lib/access/access-session';
import accessState from '@/lib/access/access-state';
import auditCore from '@/lib/access/audit-core';
import noopAuditSink from '@/lib/access/noop-audit-sink';
import { PERMISSIONS, ROLES } from '@/lib/access/permission-catalog';
import type { AuditEvent, AuditSink } from '@/lib/types/access/audit';
import type { Permission, Role } from '@/lib/types/access/permission';
import type { Principal } from '@/lib/types/access/principal';
import PermissionRoute from '@/routes/permission-route';
import { buildPrincipal } from '@tests/builders';
import { testI18n, testTheme } from '@tests/unit/utils/render-with-providers';

const FIRST_PATH = '/contacts';
const SECOND_PATH = '/contacts/archive';
const NESTED_TEXT = 'nested contacts page';
const NAVIGATE_LABEL = 'go to the second guarded path';
const DENIED = localization.en.translation.access_denied;

const record = jest.fn<void, [AuditEvent]>();
const spySink: AuditSink = { record };
const eventAt = (index: number): AuditEvent => record.mock.calls[index][0];

function focusedElement(): HTMLElement {
  return document.activeElement as HTMLElement;
}

function Navigator(): JSX.Element {
  const navigate = useNavigate();
  const goToSecondPath = useCallback((): void => navigate(SECOND_PATH), [navigate]);

  return (
    <button type="button" onClick={goToSecondPath}>
      {NAVIGATE_LABEL}
    </button>
  );
}

const gate = (permission: Permission, path: string, navigator = false): JSX.Element => (
  <ThemeProvider theme={testTheme}>
    <I18nextProvider i18n={testI18n}>
      <MemoryRouter initialEntries={[path]}>
        {navigator ? <Navigator /> : null}
        {/* Mirrors the RootLayout boundary that resolves the code-split refusal panel. */}
        <Suspense fallback={null}>
          <Routes>
            <Route element={<PermissionRoute permission={permission} />}>
              <Route path={FIRST_PATH} element={<p>{NESTED_TEXT}</p>} />
              <Route path={SECOND_PATH} element={<p>{NESTED_TEXT}</p>} />
            </Route>
          </Routes>
        </Suspense>
      </MemoryRouter>
    </I18nextProvider>
  </ThemeProvider>
);

const renderGate = (permission: Permission, path: string): RenderResult =>
  render(gate(permission, path));

const seedPrincipal = (roles: readonly Role[]): Principal => {
  const principal = buildPrincipal({ roles });
  accessState.setSession(principal, {});
  return principal;
};

describe('PermissionRoute (#114)', () => {
  beforeEach(() => {
    act(() => {
      accessSession.end();
    });
    auditCore.useSink(spySink);
  });

  // The gate is still mounted here, so ending the session notifies its store subscription:
  // wrapped in act(...) the teardown stays a real React update instead of a stray warning.
  afterEach(() => {
    auditCore.useSink(noopAuditSink);
    act(() => {
      accessSession.end();
    });
  });

  it('renders nothing and records no denial before the session hydrates', () => {
    expect(accessState.get().principal).toBeNull();

    const { container } = renderGate(PERMISSIONS.contactRead, FIRST_PATH);

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByText(NESTED_TEXT)).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: DENIED.title })).not.toBeInTheDocument();
    expect(record).not.toHaveBeenCalled();
  });

  it('renders the nested route when the principal holds the permission', () => {
    seedPrincipal([ROLES.viewer]);

    renderGate(PERMISSIONS.contactRead, FIRST_PATH);

    expect(screen.getByText(NESTED_TEXT)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: DENIED.title })).not.toBeInTheDocument();
    expect(record).not.toHaveBeenCalled();
  });

  it('renders the access denied panel when the principal lacks the permission', async () => {
    seedPrincipal([ROLES.viewer]);

    renderGate(PERMISSIONS.contactWrite, FIRST_PATH);

    expect(
      await screen.findByRole('heading', { level: 1, name: DENIED.title })
    ).toBeInTheDocument();
    expect(screen.getByText(DENIED.description)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: DENIED.cta })).toBeInTheDocument();
    expect(screen.queryByText(NESTED_TEXT)).not.toBeInTheDocument();
  });

  it('records exactly one denial carrying the permission and the current path', () => {
    const principal = seedPrincipal([ROLES.viewer]);

    renderGate(PERMISSIONS.contactWrite, FIRST_PATH);

    expect(record).toHaveBeenCalledTimes(1);
    expect(eventAt(0).type).toBe('permission_denied');
    expect(eventAt(0).metadata).toEqual({
      path: FIRST_PATH,
      permission: PERMISSIONS.contactWrite,
    });
    expect(eventAt(0).principalId).toBe(principal.id);
    expect(eventAt(0).tenantId).toBe(principal.tenantId);
    expect(new Date(eventAt(0).at).toISOString()).toBe(eventAt(0).at);
  });

  it('does not re-record the denial while the denied path stays the same', () => {
    seedPrincipal([ROLES.viewer]);

    const view = renderGate(PERMISSIONS.contactWrite, FIRST_PATH);
    view.rerender(gate(PERMISSIONS.contactWrite, FIRST_PATH));

    expect(record).toHaveBeenCalledTimes(1);
  });

  it('records a fresh denial when navigating to a different denied path', async () => {
    seedPrincipal([ROLES.viewer]);

    render(gate(PERMISSIONS.contactWrite, FIRST_PATH, true));

    expect(record).toHaveBeenCalledTimes(1);
    expect(eventAt(0).metadata).toEqual({
      path: FIRST_PATH,
      permission: PERMISSIONS.contactWrite,
    });

    fireEvent.click(screen.getByRole('button', { name: NAVIGATE_LABEL }));

    expect(record).toHaveBeenCalledTimes(2);
    expect(eventAt(1).metadata).toEqual({
      path: SECOND_PATH,
      permission: PERMISSIONS.contactWrite,
    });
    expect(
      await screen.findByRole('heading', { level: 1, name: DENIED.title })
    ).toBeInTheDocument();
  });

  // `key={pathname}` remounts the panel per path. Without it React would reuse the mounted
  // instance, the focus-on-mount ref would never fire again, and the second refusal would
  // leave focus wherever the navigation left it — silent for a screen reader (WCAG 2.4.3).
  it('re-keys the panel per path so a second denial moves focus to the heading again', async () => {
    seedPrincipal([ROLES.viewer]);

    render(gate(PERMISSIONS.contactWrite, FIRST_PATH, true));

    const firstHeading = await screen.findByRole('heading', { level: 1, name: DENIED.title });
    const firstWrapper = focusedElement();
    expect(firstWrapper).toContainElement(firstHeading);

    const navigate = screen.getByRole('button', { name: NAVIGATE_LABEL });
    navigate.focus();
    expect(navigate).toHaveFocus();

    fireEvent.click(navigate);

    const secondHeading = await screen.findByRole('heading', { level: 1, name: DENIED.title });
    expect(secondHeading).not.toBe(firstHeading);
    expect(focusedElement()).toContainElement(secondHeading);
    expect(focusedElement()).not.toBe(firstWrapper);
    expect(focusedElement()).toHaveAttribute('tabindex', '-1');
    expect(navigate).not.toHaveFocus();
  });
});
