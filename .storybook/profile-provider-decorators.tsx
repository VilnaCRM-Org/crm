import type { Decorator } from '@storybook/react-webpack5';
import { type JSX, useEffect, useState } from 'react';

import container from '@/config/dependency-injection-config';
import AUTH_TOKENS from '@/modules/user/config/tokens';
import ProfileProvider from '@/modules/user/features/settings/data-providers/profile-provider';
import type {
  ProfileChange,
  ProfileReadOutcome,
  ProfileResendOutcome,
  ProfileUpdateOutcome,
} from '@/modules/user/features/settings/types/user-profile';
import type { UserEntity } from '@/modules/user/types/user/user-entity';

export interface ProfileProviderStub {
  readonly read: (signal: AbortSignal) => Promise<ProfileReadOutcome>;
  readonly update: (change: ProfileChange, signal: AbortSignal) => Promise<ProfileUpdateOutcome>;
  readonly resend: (userId: string, signal: AbortSignal) => Promise<ProfileResendOutcome>;
}

export const STORY_USER: UserEntity = {
  id: '/api/users/0193a9e2-7c1d-7d8e-9f3a-5b6c7d8e9f01',
  fullName: 'Олена Петренко',
  email: 'olena.petrenko@example.com',
  confirmed: true,
};

function applied(user: UserEntity, change: ProfileChange): UserEntity {
  const email = change.email ?? user.email;
  return {
    ...user,
    fullName: change.fullName ?? user.fullName,
    email,
    confirmed: email === user.email && user.confirmed,
  };
}

export function loadedProfile(user: UserEntity = STORY_USER): ProfileProviderStub {
  return {
    read: async (): Promise<ProfileReadOutcome> => ({ kind: 'ok', user }),
    update: async (change: ProfileChange): Promise<ProfileUpdateOutcome> => ({
      kind: 'ok',
      user: applied(user, change),
    }),
    resend: async (): Promise<ProfileResendOutcome> => ({ kind: 'sent', confirmed: false }),
  };
}

export function unreachableProfile(): ProfileProviderStub {
  const failed = { kind: 'failed', reason: 'transient' } as const;
  return {
    read: async (): Promise<ProfileReadOutcome> => failed,
    update: async (): Promise<ProfileUpdateOutcome> => failed,
    resend: async (): Promise<ProfileResendOutcome> => failed,
  };
}

export function withProfileProvider(stub: ProfileProviderStub): Decorator {
  return function ProfileProviderDecorator(Story): JSX.Element {
    useState(() => container.register(AUTH_TOKENS.ProfileProvider, { useValue: stub }));
    useEffect(
      () => (): void => {
        container.registerSingleton(AUTH_TOKENS.ProfileProvider, ProfileProvider);
      },
      []
    );
    return <Story />;
  };
}
