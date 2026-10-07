import type { Meta } from '@storybook/react-webpack5';

import NotFound from '@/components/not-found/not-found';
import statusPageStories from '@stories/status-page-story';

export default {
  title: 'Pages/NotFound',
  component: NotFound,
  tags: ['autodocs'],
  parameters: statusPageStories.parameters('The 404 page for any unknown path', '404'),
} satisfies Meta<typeof NotFound>;

export const Default = statusPageStories.desktop;

export const Mobile = statusPageStories.mobile;
