import type { Meta, StoryObj } from '@storybook/react-webpack5';
import type { JSX } from 'react';

import RouteErrorFallback from '@/components/error-boundary/route-error-fallback';
import { DataRouterStory } from '@stories/router-decorators';

type RouteErrorFallbackStoryProps = {
  landmark: 'main' | 'region';
};

function RenderFailure(): JSX.Element {
  throw new Error('Route component failed to render');
}

function RouteErrorFallbackStory({ landmark }: RouteErrorFallbackStoryProps): JSX.Element {
  return (
    <DataRouterStory
      key={landmark}
      routes={[
        {
          path: '/',
          element: <RenderFailure />,
          errorElement: <RouteErrorFallback landmark={landmark} />,
        },
      ]}
    />
  );
}

const meta: Meta<typeof RouteErrorFallbackStory> = {
  title: 'Components/ErrorBoundary/RouteErrorFallback',
  component: RouteErrorFallbackStory,
  tags: ['autodocs'],
  args: { landmark: 'main' },
  argTypes: {
    landmark: { control: 'inline-radio', options: ['main', 'region'] },
  },
  parameters: {
    docs: {
      description: {
        component:
          'The recovery path RouteError takes for a route error that is not a 404, 403 or 5xx ' +
          'response, and for a designed page whose chunk could not be loaded: it classifies ' +
          'the error and renders ErrorFallback with a "Try again" that re-navigates to the ' +
          'same location and returns focus to `<main>` when focus was lost.',
      },
      story: { inline: false },
    },
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof RouteErrorFallbackStory>;

export const RenderError: Story = {};

export const RegionLandmark: Story = {
  args: { landmark: 'region' },
};
