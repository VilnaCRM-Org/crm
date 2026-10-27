import { type ComponentType, type JSX, lazy, Suspense, useRef, useState } from 'react';

import useFeatureFlag from '@/hooks/use-feature-flag';
import i18n from '@/i18n';
import lazyCatalogLoader from '@/lib/locale-catalog/lazy-catalog-loader';
import type { UserDisplayName } from '@/modules/user/types/lib/user-display-name';

import type { CurrentUserMenuProps, UserMenuSlotProps } from '../../types/components/user-menu';

import currentUserMenuLoader from './current-user-menu-loader';
import en from './i18n/en.json';
import uk from './i18n/uk.json';

import UserMenu from '.';

lazyCatalogLoader.register(i18n, { en, uk });

function NoCurrentUser(): null {
  return null;
}

export default function UserMenuSlot({
  signOut,
  onChunkFailure,
  onAvatar,
}: UserMenuSlotProps): JSX.Element {
  const settingsAvailable = useFeatureFlag('userSettings');
  const [identity, setIdentity] = useState<UserDisplayName | null>(null);
  const report = useRef(onChunkFailure);
  report.current = onChunkFailure;
  const [CurrentUserMenu] = useState<ComponentType<CurrentUserMenuProps>>(() =>
    lazy(() =>
      currentUserMenuLoader.load().catch((error: unknown) => {
        report.current('app-shell:current-user', error);

        return { default: NoCurrentUser };
      })
    )
  );

  return (
    <>
      <UserMenu
        identity={identity}
        settingsAvailable={settingsAvailable}
        signOut={signOut}
        onAvatar={onAvatar}
      />
      {settingsAvailable && (
        <Suspense fallback={<NoCurrentUser />}>
          <CurrentUserMenu onIdentity={setIdentity} />
        </Suspense>
      )}
    </>
  );
}
