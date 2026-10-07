import type { Meta, StoryObj } from '@storybook/react-webpack5';

import ServerError from '@/components/server-error/server-error';

const meta: Meta<typeof ServerError> = {
  title: 'Pages/ServerError',
  component: ServerError,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'The public `/server-error` page (issue #309): the designed 5xx error page in a ' +
          '`<main>` landmark with the footer. It also sets the document title.',
      },
      story: { inline: false },
    },
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof ServerError>;

export const Default: Story = {};

export const Mobile: Story = {
  globals: { viewport: { value: 'xs', isRotated: false } },
};
