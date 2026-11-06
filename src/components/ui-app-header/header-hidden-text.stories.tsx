import type { Meta, StoryObj } from '@storybook/react-webpack5';

import HeaderHiddenText from './header-hidden-text';

const meta: Meta<typeof HeaderHiddenText> = {
  title: 'Shell/Header/HeaderHiddenText',
  component: HeaderHiddenText,
  tags: ['autodocs'],
  args: { id: 'header-hidden-text', children: 'Not available yet' },
  parameters: {
    docs: {
      description: {
        component:
          'Status text a disabled header control points at with `aria-describedby`. It uses the ' +
          'clip pattern of `UILiveStatus` without `role="status"`: it is not news, so it is not ' +
          'a live region and is not re-announced on render. Nothing is visible.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof HeaderHiddenText>;

export const Default: Story = {};
