import { createElement, useEffect } from 'react';

import type { UserAvatarCopyOptions } from '../../types/components/user-menu';

import UserAvatar from './user-avatar';

export default function useAvatarCopy({ identity, onAvatar }: UserAvatarCopyOptions): void {
  const monogram = identity?.monogram ?? '';

  useEffect(() => {
    if (onAvatar === undefined) return undefined;
    onAvatar(createElement(UserAvatar, { monogram, size: 'avatar' }));

    return (): void => onAvatar(null);
  }, [monogram, onAvatar]);
}
