import type { Meta, StoryObj } from '@storybook/react';

import AuthSkeleton from '@/components/skeletons/auth-skeleton';

const meta: Meta<typeof AuthSkeleton> = {
  title: 'Components/Skeletons/AuthSkeleton',
  component: AuthSkeleton,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Loading skeleton for authentication forms. Displays while lazy-loaded ' +
          'authentication module is loading. Matches the structure and responsive ' +
          'behavior of the actual auth form.',
      },
    },
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof AuthSkeleton>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Loading skeleton for authentication forms. Responsive design adapts to different screen sizes. ' +
          'Use Canvas mode and the viewport toolbar to test different breakpoints ' +
          '(XS/320px, SM/480px, MD/768px, LG/1024px, XL/1440px).',
      },
    },
  },
};

export const Static: Story = {
  args: {
    disableAnimation: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'AuthSkeleton with animations disabled to inspect the static layout.',
      },
    },
  },
};
