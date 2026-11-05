import type { Meta, StoryObj } from '@storybook/react-webpack5';

import SocialNetworks from './index';

const meta: Meta<typeof SocialNetworks> = {
  title: 'Settings/SocialNetworks',
  component: SocialNetworks,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'The social networks card under the profile card: Google, Facebook, GitHub and Twitter ' +
          'tiles drawn as Figma draws an unlinked account. user-service cannot list, link or ' +
          'unlink a social account yet, so the tiles are a plain list, not buttons, and each ' +
          'one tells a screen reader that linking is not available yet. Below 768 px the ' +
          'tiles show the icon only and fill the columns first, like the sign-in provider grid.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof SocialNetworks>;

export const NotConnected: Story = {};
