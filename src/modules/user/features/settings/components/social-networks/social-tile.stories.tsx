import type { Decorator, Meta, StoryObj } from '@storybook/react-webpack5';
import type { JSX } from 'react';

import { ReactComponent as Google } from '@/assets/icons/social/google-color.svg';
import { noopAsync } from '@stories/story-callbacks';

import SocialTile from './social-tile';

const inList: Decorator = function ListDecorator(Story): JSX.Element {
  return (
    <ul aria-label="Social networks">
      <Story />
    </ul>
  );
};

const meta: Meta<typeof SocialTile> = {
  title: 'Settings/SocialTile',
  component: SocialTile,
  tags: ['autodocs'],
  decorators: [inList],
  args: {
    tile: { id: 'google', label: 'Google', Icon: Google },
    linked: false,
    busy: false,
    onLink: noopAsync,
    onUnlink: noopAsync,
  },
  argTypes: { tile: { control: false } },
  parameters: {
    docs: {
      description: {
        component:
          'One provider of the social networks card. After a link or an unlink the keyboard ' +
          'stays on the tile: its new control takes the focus the old one held.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof SocialTile>;

export const NotLinked: Story = {};

export const Linked: Story = { args: { linked: true } };

export const LinkedBusy: Story = { args: { linked: true, busy: true } };
