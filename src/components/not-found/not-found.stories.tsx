import type { Meta, StoryObj } from '@storybook/react-webpack5';

import NotFound from '@/components/not-found/not-found';

const meta: Meta<typeof NotFound> = {
  title: 'Pages/NotFound',
  component: NotFound,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'The 404 page for any unknown path: the back-to-main link, a `<main>` with the ' +
          'heading, the explanation and a link home, and the footer. It also sets the ' +
          'document title.',
      },
      story: { inline: false },
    },
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof NotFound>;

export const Default: Story = {};
