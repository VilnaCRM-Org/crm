import type { Meta, StoryObj } from '@storybook/react-webpack5';
import type { JSX } from 'react';
import { Outlet } from 'react-router';

import AppLayout from '@/components/layouts/app-layout';
import UIContainer from '@/components/ui-container';
import UITypography from '@/components/ui-typography';
import { DataRouterStory, storySignOut } from '@stories/router-decorators';

function PlaceholderPage(): JSX.Element {
  return (
    <UIContainer>
      <UITypography component="h1" variant="h4">
        Сторінка застосунку
      </UITypography>
      <UITypography>Тут рендериться захищена сторінка, на яку веде маршрут.</UITypography>
    </UIContainer>
  );
}

function AppLayoutStory(): JSX.Element {
  return (
    <DataRouterStory
      routes={[
        {
          element: <Outlet context={storySignOut} />,
          children: [
            {
              element: <AppLayout />,
              children: [{ index: true, element: <PlaceholderPage /> }],
            },
          ],
        },
      ]}
    />
  );
}

const meta: Meta<typeof AppLayoutStory> = {
  title: 'Layouts/AppLayout',
  component: AppLayoutStory,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'The authenticated shell every protected page renders inside: a focusable `<main>` ' +
          'holding the routed page and the lazily loaded footer. It forwards the sign-out ' +
          'outlet context from ProtectedRoute to the page.',
      },
      story: { inline: false },
    },
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof AppLayoutStory>;

export const WithPage: Story = {};
