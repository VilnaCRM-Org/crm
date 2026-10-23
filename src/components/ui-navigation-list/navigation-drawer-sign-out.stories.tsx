import type { Meta, StoryObj } from '@storybook/react-webpack5';
import type { JSX } from 'react';

import { withMemoryRouter } from '@stories/router-decorators';
import { noop } from '@stories/story-callbacks';

import NavigationDrawerSignOut from './navigation-drawer-sign-out';

const meta: Meta<typeof NavigationDrawerSignOut> = {
  title: 'Shell/Navigation/NavigationDrawerSignOut',
  component: NavigationDrawerSignOut,
  tags: ['autodocs'],
  args: { onSignOut: noop },
  decorators: [
    withMemoryRouter('/'),
    (Story): JSX.Element => (
      <ol style={{ width: 313, margin: 24, padding: 0, listStyle: 'none' }}>
        <Story />
      </ol>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'The drawer Sign out: a 54 px row with a 1 px `#E1E7EA` top border in place of the ' +
          'sidebar divider, directly after the Settings group.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof NavigationDrawerSignOut>;

export const Default: Story = {};
