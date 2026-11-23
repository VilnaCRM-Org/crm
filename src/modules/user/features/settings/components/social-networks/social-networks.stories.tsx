import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { noop, noopAsync } from '@stories/story-callbacks';

import type { SocialLinks } from '../../types/social-link/social-links';

import { SocialNetworksCard } from './index';

const UNLINKED: SocialLinks = {
  status: 'ready',
  linked: { items: [] },
  busy: false,
  link: noopAsync,
  unlink: noopAsync,
  retry: noop,
};

const meta: Meta<typeof SocialNetworksCard> = {
  title: 'Settings/SocialNetworks',
  component: SocialNetworksCard,
  tags: ['autodocs'],
  args: { links: UNLINKED },
  argTypes: { links: { control: false } },
  parameters: {
    docs: {
      description: {
        component:
          'The social networks card under the profile card. A tile that is not linked is a ' +
          'button that opens the provider in a popup; a linked tile is light blue with an ' +
          'unlink button. Until the linked providers are known, and after they could not be ' +
          'loaded, the tiles are a plain list. Below 768 px the tiles show the icon only and ' +
          'fill the columns first, like the sign-in provider grid. Figma 315:11754.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof SocialNetworksCard>;

export const NotConnected: Story = {};

export const Connected: Story = {
  args: {
    links: { ...UNLINKED, linked: { items: ['google', 'facebook', 'github', 'twitter'] } },
  },
};

export const Busy: Story = {
  args: { links: { ...UNLINKED, busy: true, linked: { items: ['google'] } } },
};

export const Loading: Story = { args: { links: { ...UNLINKED, status: 'loading' } } };

export const LoadFailed: Story = { args: { links: { ...UNLINKED, status: 'failed' } } };
