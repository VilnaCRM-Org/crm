import type { Meta, StoryObj } from '@storybook/react-webpack5';

import UIFooterContent from './ui-footer';

const description =
  'The inner row of UIFooter without the `<footer>` landmark or the container: the ' +
  'logo and the privacy and terms links. Resize the viewport to see the stacked ' +
  'mobile layout.';

const meta: Meta<typeof UIFooterContent> = {
  title: 'Components/Layout/UIFooterContent',
  component: UIFooterContent,
  tags: ['autodocs'],
  parameters: { docs: { description: { component: description } } },
};

export default meta;

export const Default: StoryObj<typeof UIFooterContent> = {};
