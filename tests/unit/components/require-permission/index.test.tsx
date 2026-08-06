// @jest-environment jsdom

import '@tests/unit/utils/setup-bun-dom';
import '@testing-library/jest-dom';
import { act, render, screen } from '@testing-library/react';

import RequirePermission from '@/components/require-permission';
import accessState from '@/lib/access/access-state';
import { PERMISSIONS, ROLES } from '@/lib/access/permission-catalog';
import { buildPrincipal } from '@tests/builders';

const GRANTED = 'granted-content';
const FALLBACK = 'fallback-content';

describe('RequirePermission', () => {
  beforeEach(() => {
    accessState.clear();
  });

  afterEach(() => {
    act(() => {
      accessState.clear();
    });
  });

  it('renders its children when the principal holds the permission', () => {
    accessState.setSession(buildPrincipal({ roles: [ROLES.member] }), {});

    render(
      <RequirePermission permission={PERMISSIONS.contactWrite}>
        <span>{GRANTED}</span>
      </RequirePermission>
    );

    expect(screen.getByText(GRANTED)).toBeInTheDocument();
  });

  it('renders nothing when the permission is missing and no fallback is given', () => {
    accessState.setSession(buildPrincipal({ roles: [ROLES.member] }), {});

    render(
      <div>
        <span>sibling</span>
        <RequirePermission permission={PERMISSIONS.adminManageUsers}>
          <span>{GRANTED}</span>
        </RequirePermission>
      </div>
    );

    expect(screen.getByText('sibling')).toBeInTheDocument();
    expect(screen.queryByText(GRANTED)).not.toBeInTheDocument();
  });

  it('renders nothing while anonymous', () => {
    render(
      <RequirePermission permission={PERMISSIONS.appHome}>
        <span>{GRANTED}</span>
      </RequirePermission>
    );

    expect(screen.queryByText(GRANTED)).not.toBeInTheDocument();
  });

  it('renders an element fallback instead of the children when the permission is missing', () => {
    accessState.setSession(buildPrincipal({ roles: [ROLES.viewer] }), {});

    render(
      <RequirePermission
        permission={PERMISSIONS.contactWrite}
        fallback={<button type="button">{FALLBACK}</button>}
      >
        <span>{GRANTED}</span>
      </RequirePermission>
    );

    expect(screen.getByRole('button', { name: FALLBACK })).toBeInTheDocument();
    expect(screen.queryByText(GRANTED)).not.toBeInTheDocument();
  });

  it('accepts a plain string as the fallback', () => {
    accessState.setSession(buildPrincipal({ roles: [ROLES.viewer] }), {});

    render(
      <RequirePermission permission={PERMISSIONS.contactWrite} fallback={FALLBACK}>
        <span>{GRANTED}</span>
      </RequirePermission>
    );

    expect(screen.getByText(FALLBACK)).toBeInTheDocument();
    expect(screen.queryByText(GRANTED)).not.toBeInTheDocument();
  });

  it('never renders the fallback when the permission is held', () => {
    accessState.setSession(buildPrincipal({ roles: [ROLES.admin] }), {});

    render(
      <RequirePermission permission={PERMISSIONS.adminManageUsers} fallback={FALLBACK}>
        <span>{GRANTED}</span>
      </RequirePermission>
    );

    expect(screen.getByText(GRANTED)).toBeInTheDocument();
    expect(screen.queryByText(FALLBACK)).not.toBeInTheDocument();
  });
});
