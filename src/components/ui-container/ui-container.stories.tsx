import type { Meta, StoryObj } from '@storybook/react-webpack5';

import UIContainer from '@/components/ui-container';
import UITypography from '@/components/ui-typography';

const meta: Meta<typeof UIContainer> = {
  title: 'Components/Layout/UIContainer',
  component: UIContainer,
  tags: ['autodocs'],
  args: {
    children: (
      <UITypography>
        Вміст сторінки обмежується максимальною шириною макета та відступами контейнера.
      </UITypography>
    ),
  },
  argTypes: {
    children: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Page-width container from @vilnacrm/ui-toolkit: centres its content and applies the ' +
          'layout gutters at every breakpoint. Use the viewport toolbar to compare widths.',
      },
    },
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof UIContainer>;

export const Default: Story = {};
