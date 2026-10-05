import type { Meta, StoryObj } from '@storybook/react-webpack5';

import UIFooterContent from './ui-footer';

const meta: Meta<typeof UIFooterContent> = {
  title: 'Components/Layout/UIFooterContent',
  component: UIFooterContent,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'The inner row of UIFooter without the `<footer>` landmark or the container: the ' +
          'logo and the privacy and terms links. Resize the viewport to see the stacked ' +
          'mobile layout.',
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof UIFooterContent>;

export const Default: Story = {};
