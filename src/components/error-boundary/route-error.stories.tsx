import type { Meta, StoryObj } from '@storybook/react-webpack5';
import type { JSX } from 'react';
import { data } from 'react-router';

import RouteError from '@/components/error-boundary/route-error';
import { DataRouterStory } from '@stories/router-decorators';

interface RouteErrorStoryProps {
  failure: 'render' | 'not-found' | 'server';
  landmark: 'main' | 'region';
}

function RenderFailure(): JSX.Element {
  throw new Error('Route component failed to render');
}

const RESPONSES = {
  'not-found': { status: 404, statusText: 'Not Found' },
  server: { status: 503, statusText: 'Service Unavailable' },
} as const;

const loaderFor = (failure: RouteErrorStoryProps['failure']): { loader?: () => never } =>
  failure === 'render'
    ? {}
    : {
        loader: (): never => {
          throw data(null, RESPONSES[failure]);
        },
      };

function RouteErrorStory({ failure, landmark }: RouteErrorStoryProps): JSX.Element {
  return (
    <DataRouterStory
      key={`${failure}-${landmark}`}
      routes={[
        {
          path: '/',
          element: <RenderFailure />,
          errorElement: <RouteError landmark={landmark} />,
          ...loaderFor(failure),
        },
      ]}
    />
  );
}

const meta: Meta<typeof RouteErrorStory> = {
  title: 'Components/ErrorBoundary/RouteError',
  component: RouteErrorStory,
  tags: ['autodocs'],
  args: {
    failure: 'render',
    landmark: 'main',
  },
  argTypes: {
    failure: { control: 'inline-radio', options: ['render', 'not-found', 'server'] },
    landmark: { control: 'inline-radio', options: ['main', 'region'] },
  },
  parameters: {
    docs: {
      description: {
        component:
          'The `errorElement` the route composer attaches to every route (issue #116). It reads ' +
          'the route error, classifies it into a recovery strategy and renders ErrorFallback: ' +
          '"Try again" re-navigates to the same location, a 4xx response offers only the ' +
          'homepage link, and a 5xx response is retryable. The story mounts a one-route data ' +
          'router whose page throws.',
      },
      story: { inline: false },
    },
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof RouteErrorStory>;

export const RenderError: Story = {};

export const NotFoundResponse: Story = {
  args: { failure: 'not-found' },
};

export const ServerErrorResponse: Story = {
  args: { failure: 'server' },
};
