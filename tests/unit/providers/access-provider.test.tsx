// @jest-environment jsdom

import '@tests/unit/utils/setup-bun-dom';
import '@testing-library/jest-dom';
import { act, render, renderHook, screen } from '@testing-library/react';
import { useContext } from 'react';

import useAccess from '@/hooks/use-access';
import accessState from '@/lib/access/access-state';
import { FEATURE_FLAGS } from '@/lib/access/feature-flag-catalog';
import AccessContext from '@/providers/access-context';
import AccessProvider from '@/providers/access-provider';
import { buildPrincipal } from '@tests/builders';

function AccessReadout(): JSX.Element {
  const { principal, flags } = useAccess();

  return (
    <div>
      <span>{principal === null ? 'anonymous' : principal.email}</span>
      <span>{`contacts:${String(flags[FEATURE_FLAGS.contactsModule] ?? false)}`}</span>
    </div>
  );
}

describe('AccessProvider', () => {
  beforeEach(() => {
    accessState.clear();
  });

  afterEach(() => {
    act(() => {
      accessState.clear();
    });
  });

  it('renders its children', () => {
    render(
      <AccessProvider>
        <span>child</span>
      </AccessProvider>
    );

    expect(screen.getByText('child')).toBeInTheDocument();
  });

  it('publishes the current access snapshot through the context', () => {
    const principal = buildPrincipal();
    accessState.setSession(principal, { [FEATURE_FLAGS.contactsModule]: true });

    const { result } = renderHook(() => useContext(AccessContext), { wrapper: AccessProvider });

    expect(result.current).toBe(accessState.get());
    expect(result.current?.principal).toBe(principal);
    expect(result.current?.flags).toEqual({ [FEATURE_FLAGS.contactsModule]: true });
  });

  it('lets a child hook read the published snapshot', () => {
    const principal = buildPrincipal();
    accessState.setSession(principal, { [FEATURE_FLAGS.contactsModule]: true });

    render(
      <AccessProvider>
        <AccessReadout />
      </AccessProvider>
    );

    expect(screen.getByText(principal.email)).toBeInTheDocument();
    expect(screen.getByText('contacts:true')).toBeInTheDocument();
  });

  it('updates its children when the access state changes after mount', () => {
    render(
      <AccessProvider>
        <AccessReadout />
      </AccessProvider>
    );
    expect(screen.getByText('anonymous')).toBeInTheDocument();
    expect(screen.getByText('contacts:false')).toBeInTheDocument();

    const principal = buildPrincipal();
    act(() => {
      accessState.setSession(principal, { [FEATURE_FLAGS.contactsModule]: true });
    });

    expect(screen.getByText(principal.email)).toBeInTheDocument();
    expect(screen.queryByText('anonymous')).not.toBeInTheDocument();
    expect(screen.getByText('contacts:true')).toBeInTheDocument();

    act(() => {
      accessState.clear();
    });

    expect(screen.getByText('anonymous')).toBeInTheDocument();
    expect(screen.queryByText(principal.email)).not.toBeInTheDocument();
  });

  it('defaults the context to null when no provider is mounted', () => {
    accessState.setSession(buildPrincipal(), {});

    const { result } = renderHook(() => useContext(AccessContext));

    expect(result.current).toBeNull();
  });
});
