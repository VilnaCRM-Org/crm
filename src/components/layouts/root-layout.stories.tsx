import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { type JSX, lazy } from 'react';

import RootLayout from '@/components/layouts/root-layout';
import UITypography from '@/components/ui-typography';
import { DataRouterStory } from '@stories/router-decorators';

function LoadedPage(): JSX.Element {
  return (
    <main>
      <UITypography component="h1" variant="h4">
        Сторінку завантажено
      </UITypography>
    </main>
  );
}

const PendingPage = lazy(
  (): Promise<{ default: () => JSX.Element }> => new Promise<never>(() => undefined)
);

interface RootLayoutStoryProps {
  pageLoading: boolean;
}

function RootLayoutStory({ pageLoading }: RootLayoutStoryProps): JSX.Element {
  return (
    <DataRouterStory
      key={String(pageLoading)}
      routes={[
        {
          element: <RootLayout />,
          children: [{ index: true, element: pageLoading ? <PendingPage /> : <LoadedPage /> }],
        },
      ]}
    />
  );
}

const meta: Meta<typeof RootLayoutStory> = {
  title: 'Layouts/RootLayout',
  component: RootLayoutStory,
  tags: ['autodocs'],
  args: { pageLoading: false },
  argTypes: {
    pageLoading: { control: 'boolean', description: 'Keep the page chunk pending forever' },
  },
  parameters: {
    docs: {
      description: {
        component:
          'The root route element: it keeps `<html dir>` in step with the active language and ' +
          'wraps every page in the route-level Suspense boundary whose fallback is ' +
          'RouteFallback. Pages bring their own landmarks.',
      },
      story: { inline: false },
    },
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof RootLayoutStory>;

export const PageLoaded: Story = {};

export const PageLoading: Story = {
  args: { pageLoading: true },
  parameters: {
    docs: {
      description: {
        story: 'A page chunk that has not resolved yet: the deferred RouteFallback shows.',
      },
    },
  },
};
