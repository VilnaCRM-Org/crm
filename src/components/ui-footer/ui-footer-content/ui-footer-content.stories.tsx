import type { StoryObj } from '@storybook/react-webpack5';

import createStoryMeta from '@stories/story-meta';

import UIFooterContent from './ui-footer';

const meta = createStoryMeta({
  title: 'Components/Layout/UIFooterContent',
  component: UIFooterContent,
  description:
    'The inner row of UIFooter without the `<footer>` landmark or the container: the ' +
    'logo and the privacy and terms links. Resize the viewport to see the stacked ' +
    'mobile layout.',
});

export default meta;

export const Default: StoryObj<typeof UIFooterContent> = {};
