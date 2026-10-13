import type { Meta } from '@storybook/react-webpack5';

import Forbidden from '@/components/forbidden/forbidden';
import statusPageStories from '@stories/status-page-story';

export default {
  title: 'Pages/Forbidden',
  component: Forbidden,
  tags: ['autodocs'],
  parameters: statusPageStories.parameters('The public `/forbidden` page', '403'),
} satisfies Meta<typeof Forbidden>;

export const Default = statusPageStories.desktop;

export const Mobile = statusPageStories.mobile;
