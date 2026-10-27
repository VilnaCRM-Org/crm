import styled from '@emotion/styled';
import { type ComponentType, type JSX, lazy, Suspense } from 'react';
import { Outlet, useOutletContext } from 'react-router';

import type { AppLayoutFrameProps } from '@/components/types/layouts/app-layout-frame';
import type { ProtectedOutletContext } from '@/routes/types/protected-outlet-context';

import styles from './app-layout.styles';
import AppShellPlaceholders from './app-shell-placeholders';
import footerLoader from './footer-loader';
import useAppShell from './use-app-shell';
import useFrameFocus from './use-frame-focus';

function FooterUnavailable(): null {
  return null;
}

const UIFooter = lazy<ComponentType>(() =>
  footerLoader.load().catch(() => ({ default: FooterUnavailable }))
);

const Frame = styled('div')(styles.frame);

const Main = styled('main')(styles.main);

const FooterArea = styled('div')(styles.footerArea);

const FooterSlot = styled('div')(styles.footerSlot);

export default function AppLayoutFrame({
  shellLoader,
  userMenu,
  onShellFailure,
}: AppLayoutFrameProps): JSX.Element {
  const focusOnArrival = useFrameFocus();
  const outletContext = useOutletContext<ProtectedOutletContext>();
  const AppShell = useAppShell(shellLoader, onShellFailure);

  return (
    <Frame>
      <Suspense fallback={<AppShellPlaceholders />}>
        <AppShell signOut={outletContext.signOut} userMenu={userMenu} />
      </Suspense>
      <Main ref={focusOnArrival} tabIndex={-1}>
        <Outlet context={outletContext} />
      </Main>
      <FooterArea>
        <Suspense fallback={<FooterSlot aria-hidden="true" />}>
          <UIFooter />
        </Suspense>
      </FooterArea>
    </Frame>
  );
}
