import type { Meta, StoryObj } from '@storybook/react-webpack5';

import ErrorPageActions from '@/components/error-page/error-page-actions';
import { withErrorPageFrame } from '@stories/error-page-decorators';

const meta: Meta<typeof ErrorPageActions> = {
  title: 'Components/ErrorPage/Actions',
  component: ErrorPageActions,
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
          'The card actions. 404 and 5xx show one contained link to the homepage. 403 shows an ' +
          'outlined homepage link and a "Request access" button that has no behaviour yet: it ' +
          'stays focusable and is announced as unavailable (`aria-disabled="true"`). Below ' +
          '768 px the 403 actions stack at the full card width with "Request access" first.',
      },
    },
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof ErrorPageActions>;

export const NotFound: Story = {};

export const Forbidden: Story = {
  args: { variant: 'forbidden' },
};

export const ForbiddenMobile: Story = {
  args: { variant: 'forbidden' },
  globals: { viewport: { value: 'xs', isRotated: false } },
};
