import { act, renderHook } from '@testing-library/react';
import type { JSX, ReactNode } from 'react';
import { MemoryRouter, useNavigate } from 'react-router';

import useGroupDisclosure from '@/components/ui-navigation-list/use-group-disclosure';

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
  go: (to: string) => void;
} {
  const disclosure = useGroupDisclosure('/settings');
  const navigate = useNavigate();

  return { disclosure, go: (to) => navigate(to) };
}

describe('useGroupDisclosure', () => {
  it.each(['/settings', '/settings/', '/settings/webhooks', '/settings/billing'])(
    'is expanded on %s',
    (path) => {
      expect(setup(path).result.current.disclosure.expanded).toBe(true);
    }
  );

  it.each(['/', '/boards', '/settingsx', '/set'])('is collapsed on %s', (path) => {
    expect(setup(path).result.current.disclosure.expanded).toBe(false);
  });

  it('flips on toggle and flips back on a second toggle', () => {
    const { result } = setup('/boards');

    act(() => result.current.disclosure.toggle());
    expect(result.current.disclosure.expanded).toBe(true);

    act(() => result.current.disclosure.toggle());
    expect(result.current.disclosure.expanded).toBe(false);
  });

  it('collapses a toggled-open group on the next route change back to the route rule', () => {
    const { result } = setup('/boards');

    act(() => result.current.disclosure.toggle());
    act(() => result.current.go('/products'));

    expect(result.current.disclosure.expanded).toBe(false);
  });

  it('expands a toggled-closed group again on a settings route', () => {
    const { result } = setup('/settings');

    act(() => result.current.disclosure.toggle());
    expect(result.current.disclosure.expanded).toBe(false);

    act(() => result.current.go('/settings/billing'));

    expect(result.current.disclosure.expanded).toBe(true);
  });

  it('keeps the override while the route does not change', () => {
    const { result, rerender } = setup('/boards');

    act(() => result.current.disclosure.toggle());
    rerender();

    expect(result.current.disclosure.expanded).toBe(true);
  });
});
