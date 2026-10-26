import Box from '@mui/material/Box';
import type { Decorator, Meta, StoryObj } from '@storybook/react-webpack5';
import type { JSX } from 'react';

import layoutStyles from '@/components/layouts/app-layout.styles';
import { withMemoryRouter } from '@stories/router-decorators';
import { noop } from '@stories/story-callbacks';

import UIAppShell from '.';

const withFrame: Decorator = function FrameDecorator(Story): JSX.Element {
  return (
    <Box sx={layoutStyles.frame}>
      <Story />
      <Box component="main" sx={layoutStyles.main}>
        Page content
      </Box>
    </Box>
  );
};

const meta: Meta<typeof UIAppShell> = {
  title: 'Shell/UIAppShell',
  component: UIAppShell,
  tags: ['autodocs'],
  args: { signOut: noop },
  decorators: [withFrame, withMemoryRouter('/')],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The lazy half of the app shell: the banner and, from 1024 px, the sidebar, placed in ' +
          'the header and navigation cells that AppLayout reserves with placeholders. Below ' +
          '1024 px the banner carries the burger that opens the navigation drawer. The user ' +
          'menu slot is optional and renders in the banner.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof UIAppShell>;

export const Desktop: Story = {
  globals: { viewport: { value: 'xl', isRotated: false } },
};

export const Tablet: Story = {
  globals: { viewport: { value: 'lg', isRotated: false } },
};

export const Mobile: Story = {
  globals: { viewport: { value: 'xs', isRotated: false } },
};
