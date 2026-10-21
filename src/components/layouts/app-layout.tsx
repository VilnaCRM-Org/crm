import styled from '@emotion/styled';
import { type ComponentType, type JSX, lazy, Suspense } from 'react';
import { Outlet, useOutletContext } from 'react-router';

import useArrivalFocus from '@/hooks/use-arrival-focus';
import type { ProtectedOutletContext } from '@/routes/types/protected-outlet-context';

import styles from './app-layout.styles';
import footerLoader from './footer-loader';

function FooterUnavailable(): null {
  return null;
}

const UIFooter = lazy<ComponentType>(() =>
  footerLoader.load().catch(() => ({ default: FooterUnavailable }))
);

const Main = styled('main')(styles.main);

const FooterSlot = styled('div')(styles.footerSlot);

export default function AppLayout(): JSX.Element {
  const focusOnArrival = useArrivalFocus();
  const outletContext = useOutletContext<ProtectedOutletContext>();

  return (
    <>
      <Main ref={focusOnArrival} tabIndex={-1}>
        <Outlet context={outletContext} />
      </Main>
      <Suspense fallback={<FooterSlot aria-hidden="true" />}>
        <UIFooter />
      </Suspense>
    </>
  );
}
