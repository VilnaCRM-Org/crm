import type { Meta, StoryObj } from '@storybook/react-webpack5';
import type { JSX } from 'react';

import RouteErrorPage from '@/components/error-boundary/route-error-page';
import type { ErrorPageVariantId } from '@/components/types/error-page';
import { DataRouterStory } from '@stories/router-decorators';

type RouteErrorPageStoryProps = {
  variant: ErrorPageVariantId;
  landmark: 'main' | 'region';
};

function RenderFailure(): JSX.Element {
  throw new Error('Route component failed to render');
}

function RouteErrorPageStory({ variant, landmark }: RouteErrorPageStoryProps): JSX.Element {
  return (
    <DataRouterStory
      key={`${variant}-${landmark}`}
      routes={[
        {
          path: '/',
          element: <RenderFailure />,
          errorElement: <RouteErrorPage variant={variant} landmark={landmark} />,
        },
      ]}
    />
  );
}

const meta: Meta<typeof RouteErrorPageStory> = {
  title: 'Components/ErrorBoundary/RouteErrorPage',
  component: RouteErrorPageStory,
  tags: ['autodocs'],
  args: { variant: 'notFound', landmark: 'main' },
  argTypes: {
    variant: { control: 'inline-radio', options: ['notFound', 'forbidden', 'serverError'] },
    landmark: { control: 'inline-radio', options: ['main', 'region'] },
  },
  parameters: {
    docs: {
      description: {
        component:
          'How RouteError shows the designed error page: the `error-page` chunk loads lazily ' +
          'behind the deferred RouteFallback, the page remounts on every navigation key, and a ' +
          'chunk that still fails after its retry falls back to RouteErrorFallback.',
      },
      story: { inline: false },
    },
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof RouteErrorPageStory>;

export const NotFound: Story = {};

export const Forbidden: Story = {
  args: { variant: 'forbidden' },
};

export const ServerError: Story = {
  args: { variant: 'serverError' },
};
