import type { Meta, StoryObj } from '@storybook/react-webpack5';

import UIFooter from '@/components/ui-footer';

const meta: Meta<typeof UIFooter> = {
  title: 'Components/Layout/UIFooter',
  component: UIFooter,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'The page footer landmark: the Vilna logo and the privacy and terms links inside the ' +
          'layout container. AppLayout loads it lazily; the auth and not-found pages render it ' +
          'directly.',
      },
    },
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof UIFooter>;

export const Default: Story = {};
