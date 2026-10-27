import { act, renderHook } from '@testing-library/react';
import type { JSX, ReactNode } from 'react';
import { MemoryRouter, useNavigate } from 'react-router';

import useCloseOnNavigation from '@/components/ui-navigation-drawer/use-close-on-navigation';

const setup = (onNavigate: () => void): { go: (to: string) => void } => {
  const wrapper = ({ children }: { children: ReactNode }): JSX.Element => (
    <MemoryRouter initialEntries={['/']}>{children}</MemoryRouter>
  );
  const { result } = renderHook(
    () => {
      useCloseOnNavigation(onNavigate);
      const navigate = useNavigate();

      return { go: (to: string): void => void navigate(to) };
    },
    { wrapper }
  );

  return result.current;
};

describe('useCloseOnNavigation', () => {
  it('does nothing on mount', () => {
    const onNavigate = jest.fn();

    setup(onNavigate);

    expect(onNavigate).not.toHaveBeenCalled();
  });

  it('calls back once when the route changes', () => {
    const onNavigate = jest.fn();
    const { go } = setup(onNavigate);

    act(() => go('/settings'));

    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  it('calls back for a navigation to the route it opened on, as any location change', () => {
    const onNavigate = jest.fn();
    const { go } = setup(onNavigate);

    act(() => go('/'));

    expect(onNavigate).toHaveBeenCalledTimes(1);
  });
});
