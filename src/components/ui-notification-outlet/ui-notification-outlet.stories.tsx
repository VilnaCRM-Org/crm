import Box from '@mui/material/Box';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { type JSX, useRef } from 'react';

import UINotificationOutlet from '@/components/ui-notification-outlet';
import useNotificationAnnouncement from '@/hooks/use-notification-announcement';
import { withRaisedNotifications } from '@stories/notification-story-decorators';

const DRAFTS = {
  items: [
    { kind: 'success', messageKey: 'settings.toasts.saved' },
    { kind: 'error', messageKey: 'settings.toasts.save_failed' },
  ],
} as const;

function Readout(): JSX.Element {
  const { polite, assertive } = useNotificationAnnouncement();

  return (
    <Box component="dl" sx={{ margin: 0, fontFamily: 'Golos' }}>
      <dt>Status region</dt>
      <dd>{polite}</dd>
      <dt>Alert region</dt>
      <dd>{assertive}</dd>
    </Box>
  );
}

function OutletStage(): JSX.Element {
  const save = useRef<HTMLButtonElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);

  return (
    <Box sx={{ padding: '1rem' }}>
      <Box component="h1" ref={heading} tabIndex={-1} sx={{ font: 'inherit' }}>
        Налаштування
      </Box>
      <Box component="button" type="button" ref={save}>
        Зберегти
      </Box>
      <UINotificationOutlet returnFocusRef={save} fallbackFocusRef={heading} />
      <Readout />
    </Box>
  );
}

const meta: Meta<typeof OutletStage> = {
  title: 'Components/Feedback/UINotificationOutlet',
  component: OutletStage,
  tags: ['autodocs'],
  decorators: [withRaisedNotifications(DRAFTS)],
  parameters: {
    docs: {
      description: {
        component:
          'The page announcer and lifetime owner. It always mounts exactly two visually hidden ' +
          'regions: a polite `role="status"` for successes and an assertive `role="alert"` for ' +
          'errors, each atomic, both fed from the outlet store. An identical repeat raise ' +
          'changes the text by an alternating zero-width mark so it is spoken again. On mount ' +
          'it publishes the focus return refs; on unmount it clears the store. The story ' +
          'raises one success and one error; the readout below the controls only shows what ' +
          'the two regions hold. The outlet draws nothing: the bell in the shell header shows ' +
          'the outcomes.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof OutletStage>;

export const Default: Story = {};
