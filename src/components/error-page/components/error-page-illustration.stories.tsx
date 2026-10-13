import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { withErrorPageFrame } from '@stories/error-page-decorators';

import ErrorPageIllustration from './error-page-illustration';

const meta: Meta<typeof ErrorPageIllustration> = {
  title: 'Components/ErrorPage/Illustration',
  component: ErrorPageIllustration,
  tags: ['autodocs'],
  decorators: [withErrorPageFrame(560)],
  parameters: {
    docs: {
      description: {
        component:
          'The decorative layer behind the digits and the card: the yellow tab, the dashed ' +
          'curve, the diamond, the dot, and the dot columns (desktop and tablet) or dot rows ' +
          '(mobile). Every node is hidden from assistive technology (`aria-hidden`) and ' +
          'positioned against the composition box, which the story frame reproduces.',
      },
    },
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof ErrorPageIllustration>;

export const Default: Story = {};
