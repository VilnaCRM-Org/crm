// @jest-environment jsdom

import '@tests/unit/utils/setup-bun-dom';
import '@testing-library/jest-dom';
import { act, render, screen } from '@testing-library/react';

import RequireMutation from '@/components/require-mutation';
import accessState from '@/lib/access/access-state';
import { MUTATION_KEYS } from '@/lib/access/mutation-catalogue';
import { buildPrincipal } from '@tests/builders';

const GATED = 'create-user-control';
const SIBLING = 'sibling-content';

const renderGate = (): void => {
  render(
    <div>
      <span>{SIBLING}</span>
      <RequireMutation mutation={MUTATION_KEYS.createUser}>
        <button type="button">{GATED}</button>
      </RequireMutation>
    </div>
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
});
