import type { Meta, StoryObj } from '@storybook/react-webpack5';
import type { JSX } from 'react';
import { Outlet } from 'react-router';

import AppLayout from '@/components/layouts/app-layout';
import UIContainer from '@/components/ui-container';
import UITypography from '@/components/ui-typography';
import type { SignOutContext } from '@/routes/types/protected-outlet-context';
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

function StubUserMenu({ signOut }: SignOutContext): JSX.Element {
  return (
    <button type="button" onClick={signOut}>
      Профіль
    </button>
  );
}

function AppLayoutStory({
  withUserMenu,
  withBanner,
}: {
  withUserMenu?: boolean;
  withBanner?: boolean;
}): JSX.Element {
  return (
    <DataRouterStory
      key={`${String(withUserMenu)}-${String(withBanner)}`}
      routes={[
        {
          element: (
            <Outlet
              context={{
                ...storySignOut,
                banner: withBanner ? (
                  <UITypography role="status">Банер, який передає ProtectedRoute</UITypography>
                ) : undefined,
              }}
            />
          ),
          children: [
            {
              element: <AppLayout userMenu={withUserMenu ? StubUserMenu : undefined} />,
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
          'The authenticated frame every protected page renders inside: the lazily loaded app ' +
          'shell (banner and sidebar, held by two placeholders until it arrives), a focusable ' +
          '`<main>` holding the routed page and the lazily loaded footer. It forwards the ' +
          'sign-out outlet context from ProtectedRoute to the shell and the page, and renders ' +
          'the optional `userMenu` slot in the banner.',
      },
      story: { inline: false },
    },
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof AppLayoutStory>;

export const WithPage: Story = {};

export const WithUserMenuSlot: Story = { args: { withUserMenu: true } };

export const WithBanner: Story = { args: { withBanner: true } };
