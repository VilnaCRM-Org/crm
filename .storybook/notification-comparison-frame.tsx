import Box from '@mui/material/Box';
import { type JSX, useId, useRef } from 'react';

import type { ShellLayout } from '@/components/types/ui-app-shell';
import UINotificationOutlet from '@/components/ui-notification-outlet';
import UINotificationSlot from '@/components/ui-notification-slot';

export const COMPARISON_ANCHOR = 'fullName-save';

interface NotificationComparisonFrameProps {
  readonly layout: ShellLayout;
}

const PADDING: Record<ShellLayout, string> = {
  desktop: '2rem 3rem',
  tablet: '1.5rem',
  mobile: '1rem',
};

const STYLES = {
  card: {
    boxSizing: 'border-box',
    maxWidth: '40rem',
    padding: '1.5rem',
    borderRadius: '1rem',
    backgroundColor: '#FFFFFF',
  },
  heading: { margin: '0 0 1rem', font: 'inherit', fontSize: '1.5rem', fontWeight: 600 },
  sectionHeading: { margin: '0 0 0.5rem', font: 'inherit', fontWeight: 600 },
  value: { margin: '0 0 1rem' },
  actions: { display: 'flex', justifyContent: 'flex-end' },
  save: {
    minHeight: '2.75rem',
    padding: '0 1.5rem',
    border: 0,
    borderRadius: '0.5rem',
    font: 'inherit',
    color: '#FFFFFF',
    backgroundColor: '#1B2327',
    cursor: 'pointer',
  },
} as const;

export default function NotificationComparisonFrame({
  layout,
}: NotificationComparisonFrameProps): JSX.Element {
  const save = useRef<HTMLButtonElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const sectionHeading = useId();

  return (
    <Box component="main" sx={{ padding: PADDING[layout], backgroundColor: '#FBFBFB' }}>
      <Box component="h1" ref={heading} tabIndex={-1} sx={STYLES.heading}>
        Налаштування
      </Box>
      <Box component="section" aria-labelledby={sectionHeading} sx={STYLES.card}>
        <Box component="h2" id={sectionHeading} sx={STYLES.sectionHeading}>
          Особисті дані
        </Box>
        <Box component="p" sx={STYLES.value}>
          Олена Петренко
        </Box>
        <Box sx={STYLES.actions}>
          <Box component="button" type="button" ref={save} sx={STYLES.save}>
            Зберегти
          </Box>
        </Box>
        <UINotificationSlot anchor={COMPARISON_ANCHOR} />
      </Box>
      <UINotificationOutlet returnFocusRef={save} fallbackFocusRef={heading} />
    </Box>
  );
}
