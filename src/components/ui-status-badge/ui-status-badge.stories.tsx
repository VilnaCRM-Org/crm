import type { Meta, StoryObj } from '@storybook/react-webpack5';

import UIStatusBadge from '@/components/ui-status-badge';

const meta: Meta<typeof UIStatusBadge> = {
  title: 'Components/Feedback/UIStatusBadge',
  component: UIStatusBadge,
  tags: ['autodocs'],
  args: { label: 'Підключено', active: true },
  argTypes: {
    label: { control: 'text' },
    active: { control: 'boolean' },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Trial seam for the linked social tile (S3.4, the badge variant). It wraps the ' +
          'ui-toolkit UiStatusBadge in its static mode: a 26 px check-circle exposed as ' +
          'role="img", named by `label`, which must name the state it paints. Active is the ' +
          'Figma UI kit "done" state 451:25845, a #38B386 fill with a white check, at 2.64:1 ' +
          'on white (an accepted SC 1.4.11 gap, #276). Toolkit story: ' +
          'uicomponents-uistatusbadge--static-done. The seam is removed if its variant loses.',
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof UIStatusBadge>;

export const Active: Story = {};

export const Rest: Story = { args: { label: 'Не підключено', active: false } };
