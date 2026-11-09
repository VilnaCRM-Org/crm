import { act, renderHook } from '@testing-library/react';
import type { JSX, ReactNode } from 'react';
import { MemoryRouter, useNavigate } from 'react-router';

import useGroupDisclosure from '@/components/ui-navigation-list/use-group-disclosure';

const SETTINGS = { id: 'settings', href: '/settings' } as const;
const BOARDS = { id: 'boards', href: '/boards' } as const;

const setup = (
  path: string
): ReturnType<typeof renderHook<ReturnType<typeof useBoth>, unknown>> => {
  const wrapper = ({ children }: { children: ReactNode }): JSX.Element => (
    <MemoryRouter initialEntries={[path]}>{children}</MemoryRouter>
  );

  return renderHook(() => useBoth(), { wrapper });
};

function useBoth(): {
  disclosure: ReturnType<typeof useGroupDisclosure>;
  expanded: () => boolean;
  go: (to: string) => void;
  back: () => void;
} {
  const disclosure = useGroupDisclosure();
  const navigate = useNavigate();

  return {
    disclosure,
    expanded: () => disclosure.stateOf(SETTINGS).expanded,
    go: (to) => navigate(to),
    back: () => navigate(-1),
  };
}

describe('useGroupDisclosure', () => {
  it.each([
    '/settings',
    '/settings/',
    '/settings/webhooks',
    '/settings/billing',
    '/Settings/billing',
    '/SETTINGS',
  ])('is expanded on %s', (path) => {
    expect(setup(path).result.current.expanded()).toBe(true);
  });

  it.each(['/', '/boards', '/settingsx', '/set'])('is collapsed on %s', (path) => {
    expect(setup(path).result.current.expanded()).toBe(false);
  });

  it('flips on toggle and flips back on a second toggle', () => {
    const { result } = setup('/boards');

    act(() => result.current.disclosure.stateOf(SETTINGS).toggle());
    expect(result.current.expanded()).toBe(true);

    act(() => result.current.disclosure.stateOf(SETTINGS).toggle());
    expect(result.current.expanded()).toBe(false);
  });

  it('collapses a toggled-open group on the next route change back to the route rule', () => {
    const { result } = setup('/boards');

    act(() => result.current.disclosure.stateOf(SETTINGS).toggle());
    act(() => result.current.go('/products'));

    expect(result.current.expanded()).toBe(false);
  });

  it('expands a toggled-closed group again on a settings route', () => {
    const { result } = setup('/settings');

    act(() => result.current.disclosure.stateOf(SETTINGS).toggle());
    expect(result.current.expanded()).toBe(false);

    act(() => result.current.go('/settings/billing'));

    expect(result.current.expanded()).toBe(true);
  });

  it('does not re-apply a toggle when the route returns to the path it was set on', () => {
    const { result } = setup('/boards');

    act(() => result.current.disclosure.stateOf(SETTINGS).toggle());
    expect(result.current.expanded()).toBe(true);

    act(() => result.current.go('/products'));
    act(() => result.current.go('/boards'));

    expect(result.current.expanded()).toBe(false);
  });

  it('does not re-apply a toggle-closed when the route returns to the settings path', () => {
    const { result } = setup('/settings');

    act(() => result.current.disclosure.stateOf(SETTINGS).toggle());
    expect(result.current.expanded()).toBe(false);

    act(() => result.current.go('/settings/billing'));
    act(() => result.current.go('/settings'));

    expect(result.current.expanded()).toBe(true);
  });

  it('does not re-apply a toggle when browser Back returns to the path it was set on', () => {
    const { result } = setup('/boards');

    act(() => result.current.disclosure.stateOf(SETTINGS).toggle());
    act(() => result.current.go('/products'));
    act(() => result.current.back());

    expect(result.current.expanded()).toBe(false);
  });

  it('holds each group apart: toggling one leaves another on its route rule', () => {
    const { result } = setup('/boards');

    act(() => result.current.disclosure.stateOf(SETTINGS).toggle());
    expect(result.current.expanded()).toBe(true);
    expect(result.current.disclosure.stateOf(BOARDS).expanded).toBe(true);

    act(() => result.current.disclosure.stateOf(BOARDS).toggle());
    expect(result.current.expanded()).toBe(true);
    expect(result.current.disclosure.stateOf(BOARDS).expanded).toBe(false);
  });

  it('applies two toggles batched in one update, one per group', () => {
    const { result } = setup('/boards');
    const settings = result.current.disclosure.stateOf(SETTINGS);
    const boards = result.current.disclosure.stateOf(BOARDS);

    act(() => {
      settings.toggle();
      boards.toggle();
    });

    expect(result.current.expanded()).toBe(true);
    expect(result.current.disclosure.stateOf(BOARDS).expanded).toBe(false);
  });

  it('flips back when one group toggles twice in one update', () => {
    const { result } = setup('/boards');
    const settings = result.current.disclosure.stateOf(SETTINGS);

    act(() => {
      settings.toggle();
      settings.toggle();
    });

    expect(result.current.expanded()).toBe(false);
  });

  it('keeps the override while the route does not change', () => {
    const { result, rerender } = setup('/boards');

    act(() => result.current.disclosure.stateOf(SETTINGS).toggle());
    rerender();

    expect(result.current.expanded()).toBe(true);
  });
});
