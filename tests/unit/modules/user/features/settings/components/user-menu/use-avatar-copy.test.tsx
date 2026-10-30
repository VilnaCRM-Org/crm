import '@testing-library/jest-dom';
import { render, renderHook, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

import useAvatarCopy from '@/modules/user/features/settings/components/user-menu/use-avatar-copy';
import type { UserDisplayName } from '@/modules/user/types/lib/user-display-name';

const named: UserDisplayName = { displayName: 'Олена Петренко', monogram: 'ОП' };

interface IdentityProps {
  readonly identity: UserDisplayName | null;
}

const lastCopy = (onAvatar: jest.Mock): ReactNode => onAvatar.mock.calls.at(-1)?.[0];

const paint = (copy: ReactNode): HTMLElement => {
  render(<>{copy}</>);

  return screen.getAllByRole('generic', { hidden: true }).at(-1) as HTMLElement;
};

describe('useAvatarCopy', () => {
  it('publishes the aria-hidden 40 px monogram avatar of a named user', () => {
    const onAvatar = jest.fn();
    renderHook(() => useAvatarCopy({ identity: named, onAvatar }));

    expect(onAvatar).toHaveBeenCalledTimes(1);
    const avatar = paint(lastCopy(onAvatar));
    expect(avatar).toHaveTextContent('ОП');
    expect(avatar).toHaveAttribute('aria-hidden', 'true');
    expect(avatar).not.toHaveAttribute('tabindex');
    expect(avatar).toHaveStyle({
      width: '40px',
      height: '40px',
      fontSize: '15px',
      borderRadius: '50%',
      backgroundColor: 'rgb(225, 231, 234)',
    });
  });

  it('publishes the no-data person glyph while the user is unknown', () => {
    const onAvatar = jest.fn();
    renderHook(() => useAvatarCopy({ identity: null, onAvatar }));

    const avatar = paint(lastCopy(onAvatar));
    expect(avatar).toContainHTML('PersonOutlinedIcon');
    expect(avatar).toHaveStyle({ width: '40px', height: '40px' });
    expect(screen.queryByText(/\S/u)).not.toBeInTheDocument();
  });

  it('withdraws the pending copy and publishes the monogram once the user resolves', () => {
    const onAvatar = jest.fn();
    const { rerender } = renderHook(
      ({ identity }: IdentityProps) => useAvatarCopy({ identity, onAvatar }),
      { initialProps: { identity: null } as IdentityProps }
    );

    rerender({ identity: named });

    expect(onAvatar).toHaveBeenCalledTimes(3);
    expect(onAvatar.mock.calls[1]).toEqual([null]);
    expect(paint(lastCopy(onAvatar))).toHaveTextContent('ОП');
  });

  it('publishes once across re-renders that keep the monogram', () => {
    const onAvatar = jest.fn();
    const { rerender } = renderHook(
      ({ identity }: IdentityProps) => useAvatarCopy({ identity, onAvatar }),
      { initialProps: { identity: named } as IdentityProps }
    );

    rerender({ identity: { ...named } });

    expect(onAvatar).toHaveBeenCalledTimes(1);
  });

  it('withdraws the copy when the menu unmounts', () => {
    const onAvatar = jest.fn();
    const { unmount } = renderHook(() => useAvatarCopy({ identity: named, onAvatar }));

    unmount();

    expect(onAvatar).toHaveBeenCalledTimes(2);
    expect(onAvatar).toHaveBeenLastCalledWith(null);
  });

  it('publishes nothing and does not throw without a handler', () => {
    expect(() => renderHook(() => useAvatarCopy({ identity: named })).unmount()).not.toThrow();
  });
});
