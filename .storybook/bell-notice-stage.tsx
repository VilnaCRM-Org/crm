import Box from '@mui/material/Box';
import type { JSX, ReactNode, RefObject } from 'react';

import type { BellAnchorMoment } from '@/components/types/ui-bell-notice';
import useBellAnchor from '@/components/ui-bell-notice/use-bell-anchor';

interface StagePageProps {
  readonly children: ReactNode;
}

interface StageHeaderProps {
  readonly bell: RefObject<HTMLButtonElement | null>;
  readonly children: ReactNode;
}

interface StageMainProps {
  readonly save: RefObject<HTMLButtonElement | null>;
  readonly heading: RefObject<HTMLHeadingElement | null>;
  readonly children?: ReactNode;
}

const STAGE = {
  page: { minHeight: '20rem', backgroundColor: '#FBFBFB' },
  header: { position: 'sticky', top: 0, height: '64px', display: 'flex', alignItems: 'center' },
  wrapper: { position: 'relative', marginLeft: 'auto', marginRight: '3rem' },
  bell: {
    position: 'relative',
    zIndex: 1,
    width: '48px',
    height: '48px',
    border: 0,
    borderRadius: '50%',
    backgroundColor: '#FFFFFF',
  },
  main: { padding: '1rem' },
  heading: { font: 'inherit' },
} as const;

const STAGE_MOMENT: BellAnchorMoment = { expanded: false, rows: { items: [] } };

export function StagePage({ children }: StagePageProps): JSX.Element {
  return <Box sx={STAGE.page}>{children}</Box>;
}

export function StageHeader({ bell, children }: StageHeaderProps): JSX.Element {
  useBellAnchor(bell, STAGE_MOMENT);

  return (
    <Box component="header" sx={STAGE.header}>
      <Box sx={STAGE.wrapper}>
        <Box component="button" type="button" ref={bell} aria-label="Сповіщення" sx={STAGE.bell} />
        {children}
      </Box>
    </Box>
  );
}

export function StageMain({ save, heading, children }: StageMainProps): JSX.Element {
  return (
    <Box component="main" sx={STAGE.main}>
      <Box component="h1" tabIndex={-1} ref={heading} sx={STAGE.heading}>
        Налаштування
      </Box>
      <Box component="button" type="button" ref={save}>
        Зберегти
      </Box>
      {children}
    </Box>
  );
}
