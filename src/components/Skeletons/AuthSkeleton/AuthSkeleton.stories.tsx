import type { Meta, StoryObj } from '@storybook/react';
import { Suspense } from 'react';

import AuthSkeleton from './index';

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

export const InSuspense: Story = {
  render: () => (
    <Suspense fallback={<AuthSkeleton />}>
      <div>Content would load here</div>
    </Suspense>
  ),
  parameters: {
    docs: {
      description: {
        story: 'AuthSkeleton wrapped in Suspense boundary, matching real usage in App.tsx.',
      },
    },
  },
};
