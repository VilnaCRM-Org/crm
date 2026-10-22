import type { Meta, StoryObj } from '@storybook/react-webpack5';

import ProfileSkeleton from './profile-skeleton';

const meta: Meta<typeof ProfileSkeleton> = {
  title: 'Settings/ProfileSkeleton',
  component: ProfileSkeleton,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'The loading placeholder in the shape of the profile card: a round monogram, two ' +
          'lines, four labelled inputs and the save button, built from the UISkeleton blocks. ' +
          'It is hidden from the accessibility tree and holds no focusable element; under ' +
          '`prefers-reduced-motion: reduce` nothing animates.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof ProfileSkeleton>;

export const Default: Story = {};
