import type { Meta, StoryObj } from '@storybook/react-webpack5';

import ErrorPageDigits from '@/components/error-page/error-page-digits';
import { withErrorPageFrame } from '@stories/error-page-decorators';

const meta: Meta<typeof ErrorPageDigits> = {
  title: 'Components/ErrorPage/Digits',
  component: ErrorPageDigits,
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
          'The three status glyphs with the middle one dropped, coloured per status. They are ' +
          'decorative and hidden from assistive technology (`aria-hidden`); the card heading ' +
          'and the visually hidden status line carry the code for screen readers.',
      },
    },
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof ErrorPageDigits>;

export const NotFound: Story = {};

export const Forbidden: Story = {
  args: { variant: 'forbidden' },
};

export const ServerError: Story = {
  args: { variant: 'serverError' },
};
