import styled from '@emotion/styled';
import { type ComponentType, type JSX, lazy, Suspense, useRef, useState } from 'react';
import { Outlet, useOutletContext } from 'react-router';

import type { AppLayoutProps } from '@/components/types/layouts/app-layout';
import type { UIAppShellProps } from '@/components/types/ui-app-shell';
import useArrivalFocus from '@/hooks/use-arrival-focus';
import type { ProtectedOutletContext } from '@/routes/types/protected-outlet-context';

import styles from './app-layout.styles';
import appShellLoader from './app-shell-loader';
import footerLoader from './footer-loader';

function FooterUnavailable(): null {
  return null;
}

const UIFooter = lazy<ComponentType>(() =>
  footerLoader.load().catch(() => ({ default: FooterUnavailable }))
);

const Frame = styled('div')(styles.frame);

const Main = styled('main')(styles.main);

const HeaderSlot = styled('div')(styles.headerSlot);

const NavSlot = styled('div')(styles.navSlot, styles.navPlaceholder);

const FooterArea = styled('div')(styles.footerArea);

const FooterSlot = styled('div')(styles.footerSlot);

function ShellPlaceholders(): JSX.Element {
  return (
    <>
      <HeaderSlot aria-hidden="true" />
      <NavSlot aria-hidden="true" />
    </>
  );
}

export default function AppLayout({ userMenu, onShellFailure }: AppLayoutProps): JSX.Element {
  const focusOnArrival = useArrivalFocus();
  const outletContext = useOutletContext<ProtectedOutletContext>();
  const report = useRef(onShellFailure);
  report.current = onShellFailure;
  const [AppShell] = useState<ComponentType<UIAppShellProps>>(() =>
    lazy(() =>
      appShellLoader.load().catch((error: unknown) => {
        report.current?.(error);

        return { default: ShellPlaceholders };
      })
    )
  );

  return (
    <Frame>
      <Suspense fallback={<ShellPlaceholders />}>
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
