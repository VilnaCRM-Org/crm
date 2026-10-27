import styled from '@emotion/styled';
import type { JSX } from 'react';

import styles from './app-layout.styles';

const HeaderSlot = styled('div')(styles.headerSlot);

const NavSlot = styled('div')(styles.navSlot, styles.navPlaceholder);

export default function AppShellPlaceholders(): JSX.Element {
  return (
    <>
      <HeaderSlot aria-hidden="true" />
      <NavSlot aria-hidden="true" />
    </>
  );
}
