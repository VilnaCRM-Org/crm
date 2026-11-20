import { act, renderHook, type RenderHookResult } from '@testing-library/react';
import type { JSX, ReactNode } from 'react';
import { MemoryRouter, type NavigateFunction, useNavigate } from 'react-router';

import type { ShellLayout } from '@/components/types/ui-app-shell';
import useClose from '@/modules/user/features/notifications/hooks/use-bell-context-close';

interface HookProps {
  readonly layout: ShellLayout;
}

function RouterWrapper({ children }: { children: ReactNode }): JSX.Element {
  return <MemoryRouter>{children}</MemoryRouter>;
}

interface Setup extends RenderHookResult<NavigateFunction, HookProps> {
  readonly close: jest.Mock;
}

const setup = (layout: ShellLayout): Setup => {
  const close = jest.fn();
  const view = renderHook<NavigateFunction, HookProps>(
    (props) => {
      useClose({ layout: props.layout, close });
      return useNavigate();
    },
    { wrapper: RouterWrapper, initialProps: { layout } }
  );

  return { close, ...view };
};

describe('useBellContextClose', () => {
  it('does not close on mount or on a re-render with the same route and layout', () => {
    const { close, rerender } = setup('desktop');

    rerender({ layout: 'desktop' });

    expect(close).not.toHaveBeenCalled();
  });

  it('closes once when the route changes', () => {
    const { close, result } = setup('desktop');

    act(() => result.current('/elsewhere'));

    expect(close).toHaveBeenCalledTimes(1);
  });

  it.each<[ShellLayout, ShellLayout]>([
    ['desktop', 'tablet'],
    ['tablet', 'mobile'],
    ['mobile', 'desktop'],
  ])('closes once when the layout changes from %s to %s', (from, to) => {
    const { close, rerender } = setup(from);

    rerender({ layout: to });

    expect(close).toHaveBeenCalledTimes(1);
  });
});
