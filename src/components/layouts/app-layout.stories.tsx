import type { Meta, StoryObj } from '@storybook/react-webpack5';
import type { JSX } from 'react';
import { Outlet } from 'react-router';

import AppLayout from '@/components/layouts/app-layout';
import AppLayoutFrame from '@/components/layouts/app-layout-frame';
import type { AppLayoutProps } from '@/components/types/layouts/app-layout';
import type { AppShellModuleLoader } from '@/components/types/layouts/app-layout-frame';
import UIContainer from '@/components/ui-container';
import UITypography from '@/components/ui-typography';
import type { SignOutContext } from '@/routes/types/protected-outlet-context';
import { DataRouterStory, storySignOut } from '@stories/router-decorators';
import { noop } from '@stories/story-callbacks';

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

function StubNotifications(): JSX.Element {
  return <button type="button">Сповіщення</button>;
}

type ShellSlots = Pick<AppLayoutProps, 'userMenu' | 'notifications'>;

type ShellState = 'loaded' | 'pending' | 'failed';

const pendingShell: AppShellModuleLoader = {
  load: () => new Promise<never>(() => undefined),
};

const failedShell: AppShellModuleLoader = {
  load: () => Promise.reject(new Error('Loading chunk ui-app-shell failed.')),
};

interface AppLayoutStoryProps {
  withUserMenu?: boolean;
  withNotifications?: boolean;
  withBanner?: boolean;
  shell?: ShellState;
}

function layoutFor(shell: ShellState, { userMenu, notifications }: ShellSlots): JSX.Element {
  if (shell === 'loaded') {
    return <AppLayout userMenu={userMenu} notifications={notifications} />;
  }

  return (
    <AppLayoutFrame
      shellLoader={shell === 'pending' ? pendingShell : failedShell}
      userMenu={userMenu}
      notifications={notifications}
      onShellFailure={noop}
    />
  );
}

function AppLayoutStory({
  withUserMenu = false,
  withNotifications = false,
  withBanner = false,
  shell = 'loaded',
}: AppLayoutStoryProps): JSX.Element {
  return (
    <DataRouterStory
      key={[shell, withUserMenu, withNotifications, withBanner].join('-')}
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
              element: layoutFor(shell, {
                userMenu: withUserMenu ? StubUserMenu : undefined,
                notifications: withNotifications ? StubNotifications : undefined,
              }),
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
  argTypes: {
    shell: {
      control: 'inline-radio',
      options: ['loaded', 'pending', 'failed'],
      description: 'The state of the ui-app-shell chunk',
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          'The authenticated frame every protected page renders inside: the lazily loaded app ' +
          'shell (banner and sidebar, held by two placeholders until it arrives), a focusable ' +
          '`<main>` holding the routed page and the lazily loaded footer. It forwards the ' +
          'sign-out outlet context from ProtectedRoute to the shell and the page, and renders ' +
          'the optional `userMenu` and `notifications` slots in the header. An optional notice ' +
          'from ProtectedRoute renders first inside `<main>`. AppLayout hands the real shell ' +
          'loader to AppLayoutFrame; the pending and failed stories hand the frame a loader that ' +
          'never settles or rejects.',
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

export const WithNotificationsSlot: Story = { args: { withNotifications: true } };

export const WithBanner: Story = { args: { withBanner: true } };

export const ShellLoading: Story = {
  args: { shell: 'pending' },
  parameters: {
    docs: {
      description: {
        story:
          'The ui-app-shell chunk has not resolved: the empty, aria-hidden header slot and ' +
          'navigation column hold the shell boxes, and the page is already usable.',
      },
    },
  },
};

export const ShellUnavailable: Story = {
  args: { shell: 'failed' },
  parameters: {
    docs: {
      description: {
        story:
          'The ui-app-shell chunk failed after its retry: the frame reports the failure through ' +
          '`onShellFailure` and keeps the same placeholders, so nothing shifts.',
      },
    },
  },
};
