import type { Meta, StoryObj } from '@storybook/react-webpack5';

import {
  ComparisonStage,
  comparisonStory,
  historyOpen,
  markAllRead,
  ONE_SUCCESS,
  PERMANENT_ERROR,
  reducedMotion,
  THREE_SUCCESSES,
  TRANSIENT_ERROR,
} from '@stories/notification-comparison-stories';
import { withMemoryRouter } from '@stories/router-decorators';

const meta: Meta<typeof ComparisonStage> = {
  title: 'Notifications/Comparison',
  component: ComparisonStage,
  args: { layout: 'desktop' },
  decorators: [withMemoryRouter('/settings')],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The three notification styles side by side: `toast`, `inline` and `bell`, each ' +
          'with one success, three successes, a transient error and a permanent error, at ' +
          '1440, 1366 and 375 px. Every outcome is raised through the notifications port ' +
          'with a frozen clock and the shipped settings copy, and every story records into ' +
          'its own fresh in-memory history, so the badge starts from the seed in each one. ' +
          'The shell layout arrives as an arg, so the header matches the viewport in every ' +
          'frame.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof ComparisonStage>;

export const ToastOneSuccessXl: Story = comparisonStory('toast', ONE_SUCCESS, 'xl');
export const ToastOneSuccessLg1366: Story = comparisonStory('toast', ONE_SUCCESS, 'lg1366');
export const ToastOneSuccessMobile375: Story = comparisonStory('toast', ONE_SUCCESS, 'mobile375');
export const ToastThreeSuccessesXl: Story = comparisonStory('toast', THREE_SUCCESSES, 'xl');
export const ToastThreeSuccessesLg1366: Story = comparisonStory('toast', THREE_SUCCESSES, 'lg1366');
export const ToastThreeSuccessesMobile375: Story = comparisonStory(
  'toast',
  THREE_SUCCESSES,
  'mobile375'
);
export const ToastTransientErrorXl: Story = comparisonStory('toast', TRANSIENT_ERROR, 'xl');
export const ToastTransientErrorLg1366: Story = comparisonStory('toast', TRANSIENT_ERROR, 'lg1366');
export const ToastTransientErrorMobile375: Story = comparisonStory(
  'toast',
  TRANSIENT_ERROR,
  'mobile375'
);
export const ToastPermanentErrorXl: Story = comparisonStory('toast', PERMANENT_ERROR, 'xl');
export const ToastPermanentErrorLg1366: Story = comparisonStory('toast', PERMANENT_ERROR, 'lg1366');
export const ToastPermanentErrorMobile375: Story = comparisonStory(
  'toast',
  PERMANENT_ERROR,
  'mobile375'
);

export const InlineOneSuccessXl: Story = comparisonStory('inline', ONE_SUCCESS, 'xl');
export const InlineOneSuccessLg1366: Story = comparisonStory('inline', ONE_SUCCESS, 'lg1366');
export const InlineOneSuccessMobile375: Story = comparisonStory('inline', ONE_SUCCESS, 'mobile375');
export const InlineThreeSuccessesXl: Story = comparisonStory('inline', THREE_SUCCESSES, 'xl');
export const InlineThreeSuccessesLg1366: Story = comparisonStory(
  'inline',
  THREE_SUCCESSES,
  'lg1366'
);
export const InlineThreeSuccessesMobile375: Story = comparisonStory(
  'inline',
  THREE_SUCCESSES,
  'mobile375'
);
export const InlineTransientErrorXl: Story = comparisonStory('inline', TRANSIENT_ERROR, 'xl');
export const InlineTransientErrorLg1366: Story = comparisonStory(
  'inline',
  TRANSIENT_ERROR,
  'lg1366'
);
export const InlineTransientErrorMobile375: Story = comparisonStory(
  'inline',
  TRANSIENT_ERROR,
  'mobile375'
);
export const InlinePermanentErrorXl: Story = comparisonStory('inline', PERMANENT_ERROR, 'xl');
export const InlinePermanentErrorLg1366: Story = comparisonStory(
  'inline',
  PERMANENT_ERROR,
  'lg1366'
);
export const InlinePermanentErrorMobile375: Story = comparisonStory(
  'inline',
  PERMANENT_ERROR,
  'mobile375'
);

export const BellOneSuccessXl: Story = comparisonStory('bell', ONE_SUCCESS, 'xl');
export const BellOneSuccessLg1366: Story = comparisonStory('bell', ONE_SUCCESS, 'lg1366');
export const BellOneSuccessMobile375: Story = comparisonStory('bell', ONE_SUCCESS, 'mobile375');
export const BellThreeSuccessesXl: Story = comparisonStory('bell', THREE_SUCCESSES, 'xl');
export const BellThreeSuccessesLg1366: Story = comparisonStory('bell', THREE_SUCCESSES, 'lg1366');
export const BellThreeSuccessesMobile375: Story = comparisonStory(
  'bell',
  THREE_SUCCESSES,
  'mobile375'
);
export const BellTransientErrorXl: Story = comparisonStory('bell', TRANSIENT_ERROR, 'xl');
export const BellTransientErrorLg1366: Story = comparisonStory('bell', TRANSIENT_ERROR, 'lg1366');
export const BellTransientErrorMobile375: Story = comparisonStory(
  'bell',
  TRANSIENT_ERROR,
  'mobile375'
);
export const BellPermanentErrorXl: Story = comparisonStory('bell', PERMANENT_ERROR, 'xl');
export const BellPermanentErrorLg1366: Story = comparisonStory('bell', PERMANENT_ERROR, 'lg1366');
export const BellPermanentErrorMobile375: Story = comparisonStory(
  'bell',
  PERMANENT_ERROR,
  'mobile375'
);

export const ToastReducedMotion: Story = reducedMotion('toast');
export const InlineReducedMotion: Story = reducedMotion('inline');
export const BellReducedMotion: Story = reducedMotion('bell');

export const ToastHistoryOpen: Story = historyOpen('toast');
export const InlineHistoryOpen: Story = historyOpen('inline');
export const BellHistoryOpen: Story = historyOpen('bell');

export const BellAfterMarkAllRead: Story = {
  ...comparisonStory('bell', THREE_SUCCESSES, 'xl'),
  play: markAllRead,
};
