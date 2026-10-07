import type { Meta, StoryObj } from '@storybook/react-webpack5';

import ErrorPageComposition from '@/components/error-page/error-page-composition';

const meta: Meta<typeof ErrorPageComposition> = {
  title: 'Components/ErrorPage/Composition',
  component: ErrorPageComposition,
  tags: ['autodocs'],
  args: { variant: 'notFound' },
  argTypes: {
    variant: { control: 'inline-radio', options: ['notFound', 'forbidden', 'serverError'] },
  },
  parameters: {
    docs: {
      description: {
        component:
          'The centred composition inside the error page landmark: the decorative ' +
          'illustration layer, the status digits and the card, stacked in paint order. It has ' +
          'no landmark of its own; ErrorPage wraps it in `<main>` or a labelled `<section>`.',
      },
      story: { inline: false, height: '760px' },
    },
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof ErrorPageComposition>;

export const NotFound: Story = {};

export const Forbidden: Story = {
  args: { variant: 'forbidden' },
};

export const ServerError: Story = {
  args: { variant: 'serverError' },
};
