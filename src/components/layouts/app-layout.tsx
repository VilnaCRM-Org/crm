import type { JSX } from 'react';

import type { AppLayoutProps } from '@/components/types/layouts/app-layout';

import AppLayoutFrame from './app-layout-frame';
import appShellLoader from './app-shell-loader';

export default function AppLayout({ userMenu, onShellFailure }: AppLayoutProps): JSX.Element {
  return (
    <AppLayoutFrame
      shellLoader={appShellLoader}
      userMenu={userMenu}
      onShellFailure={onShellFailure}
    />
  );
}
