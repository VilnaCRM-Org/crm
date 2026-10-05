import type { Meta, StoryObj } from '@storybook/react-webpack5';

import UISkeletonBlock from '@/components/skeletons/ui-skeleton-block';

const meta: Meta<typeof UISkeletonBlock> = {
  title: 'Components/Skeletons/UISkeletonBlock',
  component: UISkeletonBlock,
  tags: ['autodocs'],
  argTypes: {
    width: { control: 'text', description: 'Block width (CSS length or px number)' },
    height: { control: 'text', description: 'Block height (CSS length or px number)' },
    borderRadius: { control: 'text', description: 'Corner radius (CSS length or px number)' },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Rectangular loading placeholder from @vilnacrm/ui-toolkit, used for buttons and ' +
          'tiles while a lazily loaded surface resolves. Decorative: it carries no text.',
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof UISkeletonBlock>;

export const Default: Story = {
  args: { width: 240, height: 48 },
};

export const Rounded: Story = {
  args: { width: 64, height: 64, borderRadius: '50%' },
};
