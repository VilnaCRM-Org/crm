import type { Meta, StoryObj } from '@storybook/react-webpack5';

import Forbidden from '@/components/forbidden/forbidden';

const meta: Meta<typeof Forbidden> = {
  title: 'Pages/Forbidden',
  component: Forbidden,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'The public `/forbidden` page (issue #309): the designed 403 error page in a ' +
          '`<main>` landmark with the footer. It also sets the document title.',
      },
      story: { inline: false },
    },
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof Forbidden>;

export const Default: Story = {};

export const Mobile: Story = {
  globals: { viewport: { value: 'xs', isRotated: false } },
};
