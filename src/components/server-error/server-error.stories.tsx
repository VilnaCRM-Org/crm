import type { Meta } from '@storybook/react-webpack5';

import ServerError from '@/components/server-error/server-error';
import statusPageStories from '@stories/status-page-story';

export default {
  title: 'Pages/ServerError',
  component: ServerError,
  tags: ['autodocs'],
  parameters: statusPageStories.parameters('The public `/server-error` page', '5xx'),
} satisfies Meta<typeof ServerError>;

export const Default = statusPageStories.desktop;

export const Mobile = statusPageStories.mobile;
