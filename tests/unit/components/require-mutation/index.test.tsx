// @jest-environment jsdom

import '@tests/unit/utils/setup-bun-dom';
import '@testing-library/jest-dom';
import { act, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import RequireMutation from '@/components/require-mutation';
import accessCore from '@/lib/access/access-core';
import accessState from '@/lib/access/access-state';
import { MUTATION_KEYS } from '@/lib/access/mutation-catalogue';
import { buildPrincipal } from '@tests/builders';
import ROUTER_FUTURE_FLAGS from '@tests/unit/utils/router-future-flags';

const GATED = 'create-user-control';
const SIBLING = 'sibling-content';

const AT_PATH = '/contacts';

const renderGate = (): void => {
  render(
    <MemoryRouter future={ROUTER_FUTURE_FLAGS} initialEntries={[AT_PATH]}>
      <div>
        <span>{SIBLING}</span>
        <RequireMutation mutation={MUTATION_KEYS.createUser}>
          <button type="button">{GATED}</button>
        </RequireMutation>
      </div>
    </MemoryRouter>
  );
};

describe('RequireMutation', () => {
  beforeEach(() => {
    accessState.clear();
  });

  afterEach(() => {
    act(() => {
      accessState.clear();
    });
  });

  it('renders its children when the mutation is in the allowed set', () => {
    accessState.setSession(buildPrincipal({ allowedMutations: [MUTATION_KEYS.createUser] }), {});

    renderGate();

    expect(screen.getByRole('button', { name: GATED })).toBeInTheDocument();
  });

  it('renders nothing when the allowed set is empty', () => {
    accessState.setSession(buildPrincipal({ allowedMutations: [] }), {});

    renderGate();

    expect(screen.getByText(SIBLING)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: GATED })).not.toBeInTheDocument();
  });

  it('renders nothing while anonymous', () => {
    renderGate();

    expect(screen.queryByRole('button', { name: GATED })).not.toBeInTheDocument();
  });

  it('keeps the denied control out of the accessibility tree entirely', () => {
    accessState.setSession(buildPrincipal({ allowedMutations: [] }), {});

    renderGate();

    expect(screen.queryAllByRole('button', { hidden: true })).toStrictEqual([]);
  });

  // The refusal carries where it happened, so an audit trail says which screen hid the control.
  it('records one denial naming the mutation and the path it was refused on', () => {
    const recordDenial = jest.spyOn(accessCore, 'recordDenial').mockImplementation(() => undefined);
    accessState.setSession(buildPrincipal({ allowedMutations: [] }), {});

    renderGate();

    expect(recordDenial).toHaveBeenCalledTimes(1);
    expect(recordDenial).toHaveBeenCalledWith(MUTATION_KEYS.createUser, { path: AT_PATH });
    recordDenial.mockRestore();
  });

  it('records no denial while anonymous, when there is nobody to refuse', () => {
    const recordDenial = jest.spyOn(accessCore, 'recordDenial').mockImplementation(() => undefined);

    renderGate();

    expect(recordDenial).not.toHaveBeenCalled();
    recordDenial.mockRestore();
  });
});
