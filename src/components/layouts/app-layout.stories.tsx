import type { Meta, StoryObj } from '@storybook/react-webpack5';
import type { JSX } from 'react';
import { Outlet } from 'react-router';

import AppLayout from '@/components/layouts/app-layout';
import AppLayoutFrame from '@/components/layouts/app-layout-frame';
import type { AppShellModuleLoader } from '@/components/types/layouts/app-layout-frame';
import UIContainer from '@/components/ui-container';
import UITypography from '@/components/ui-typography';
import type { ProtectedOutletContext } from '@/routes/types/protected-outlet-context';
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

function StubUserMenu({ signOut }: ProtectedOutletContext): JSX.Element {
  return (
    <button type="button" onClick={signOut}>
      Профіль
    </button>
  );
}

type ShellState = 'loaded' | 'pending' | 'failed';

const pendingShell: AppShellModuleLoader = {
  load: () => new Promise<never>(() => undefined),
};

const failedShell: AppShellModuleLoader = {
  load: () => Promise.reject(new Error('Loading chunk ui-app-shell failed.')),
};

interface AppLayoutStoryProps {
  withUserMenu?: boolean;
  shell?: ShellState;
}

function layoutFor(shell: ShellState, withUserMenu: boolean): JSX.Element {
  const userMenu = withUserMenu ? StubUserMenu : undefined;
  if (shell === 'loaded') {
    return <AppLayout userMenu={userMenu} />;
  }

  return (
    <AppLayoutFrame
      shellLoader={shell === 'pending' ? pendingShell : failedShell}
      userMenu={userMenu}
      onShellFailure={noop}
    />
  );
}

function AppLayoutStory({
  withUserMenu = false,
  shell = 'loaded',
}: AppLayoutStoryProps): JSX.Element {
  return (
    <DataRouterStory
      key={`${shell}-${String(withUserMenu)}`}
      routes={[
        {
          element: <Outlet context={storySignOut} />,
          children: [
            {
              element: layoutFor(shell, withUserMenu),
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
          'the optional `userMenu` slot in the banner. AppLayout hands the real shell loader ' +
          'to AppLayoutFrame; the pending and failed stories hand the frame a loader that never ' +
          'settles or rejects.',
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
