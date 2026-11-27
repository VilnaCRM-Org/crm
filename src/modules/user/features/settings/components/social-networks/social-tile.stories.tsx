import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { ReactComponent as Google } from '@/assets/icons/social/google-color.svg';
import { withStoryList } from '@stories/list-decorators';
import { noopAsync } from '@stories/story-callbacks';

import SocialTile from './social-tile';

const DESKTOP_TILE_WIDTH = 304;

const meta: Meta<typeof SocialTile> = {
  title: 'Settings/SocialTile',
  component: SocialTile,
  tags: ['autodocs'],
  decorators: [withStoryList(DESKTOP_TILE_WIDTH)],
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

export const NotLinkedBusy: Story = { args: { busy: true } };

export const Linked: Story = { args: { linked: true } };

export const LinkedBusy: Story = { args: { linked: true, busy: true } };
