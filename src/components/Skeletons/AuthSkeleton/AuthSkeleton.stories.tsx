import type { Meta, StoryObj } from '@storybook/react';
import type { JSX } from 'react';

import AuthSkeleton from '@/components/Skeletons/AuthSkeleton';

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
  parameters: {
    docs: {
      description: {
        story: 'AuthSkeleton with animations disabled to inspect the static layout.',
      },
    },
  },
  decorators: [
    (StoryFn): JSX.Element => (
      <div className="auth-skeleton-story">
        <style>{`
          .auth-skeleton-story *, .auth-skeleton-story *::before, .auth-skeleton-story *::after {
            animation: none !important;
            background-size: 100% 100% !important;
          }
          .auth-skeleton-story [data-testid^="auth-skeleton-input-"] {
            border: 1px solid transparent !important;
            background-image: linear-gradient(#fff, #fff),
              linear-gradient(90deg, rgba(211, 216, 224, 0.78) 0%, rgba(211, 216, 224, 0.598958) 49.13%, rgba(211, 216, 224, 0) 100%) !important;
            background-origin: border-box !important;
            background-clip: padding-box, border-box !important;
          }
        `}</style>
        <StoryFn />
      </div>
    ),
  ],
};
