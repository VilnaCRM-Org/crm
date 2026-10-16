import type { Meta, StoryObj } from '@storybook/react-webpack5';

import UserProfile from './index';

const meta: Meta<typeof UserProfile> = {
  title: 'Settings/Pages/UserProfile',
  component: UserProfile,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'The settings page shell at /settings (issue #330): the page title, one level-1 ' +
          'heading, the subtitle and the grid its sections will fill. In the app it renders ' +
          'inside AppLayout, behind ProtectedRoute and the userSettings flag.',
      },
    },
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof UserProfile>;

export const Default: Story = {};
