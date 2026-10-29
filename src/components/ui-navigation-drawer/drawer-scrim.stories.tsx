import type { Meta, StoryObj } from '@storybook/react-webpack5';

import DrawerScrim from './drawer-scrim';

const meta: Meta<typeof DrawerScrim> = {
  title: 'Shell/Drawer/DrawerScrim',
  component: DrawerScrim,
  tags: ['autodocs'],
  args: { duration: 0 },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The drawer scrim `287:14782`: `rgba(54,79,93,.05)` with a 4 px backdrop blur. It ' +
          'paints only above the page footer, which Figma draws untinted over it, and takes no ' +
          'pointer events; the Modal backdrop under it stays the full-viewport hit target.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof DrawerScrim>;

export const Default: Story = {};
