import type { CSSObject } from '@emotion/react';
import styled from '@emotion/styled';
import { type ComponentType, type JSX, lazy, Suspense } from 'react';
import { Outlet, useOutletContext } from 'react-router';

import useArrivalFocus from '@/hooks/use-arrival-focus';
import type { ProtectedOutletContext } from '@/routes/types/protected-outlet-context';

import footerLoader from './footer-loader';

function FooterUnavailable(): null {
  return null;
}

const UIFooter = lazy<ComponentType>(() =>
  footerLoader.load().catch(() => ({ default: FooterUnavailable }))
);

const Main = styled('main')((): CSSObject => ({
  flexGrow: 1,
  display: 'flex',
  flexDirection: 'column',
  // The landmark is focusable only so the post-login redirect can land on it. Suppress the ring
  // for that programmatic case, never for a keyboard user who tabs into it.
  '&:focus:not(:focus-visible)': { outline: 'none' },
}));

const FooterSlot = styled('div')((): CSSObject => ({ minHeight: '4.125rem' }));

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
