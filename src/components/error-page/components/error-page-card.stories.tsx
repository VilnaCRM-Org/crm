import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { withErrorPageFrame } from '@stories/error-page-decorators';

import ErrorPageCard from './error-page-card';

const meta: Meta<typeof ErrorPageCard> = {
  title: 'Components/ErrorPage/Card',
  component: ErrorPageCard,
  tags: ['autodocs'],
  decorators: [withErrorPageFrame()],
  args: { variant: 'notFound' },
  argTypes: {
    variant: { control: 'inline-radio', options: ['notFound', 'forbidden', 'serverError'] },
  },
  parameters: {
    docs: {
      description: {
        component:
          'The white card: an `h1` that takes focus on mount, a visually hidden status code, ' +
          'the description, and the variant actions. Each story renders in its own iframe ' +
          'because every card mounts the heading with the same id and moves focus to it.',
      },
      story: { inline: false, height: '360px' },
    },
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof ErrorPageCard>;

export const NotFound: Story = {};

export const Forbidden: Story = {
  args: { variant: 'forbidden' },
};

export const ServerError: Story = {
  args: { variant: 'serverError' },
};
