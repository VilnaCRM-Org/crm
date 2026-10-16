import type { Decorator, Meta, StoryObj } from '@storybook/react-webpack5';
import { type JSX, useEffect, useState } from 'react';

import { APP_CONFIG_ELEMENT_ID } from '@/config/runtime/app-config-source';
import Home from '@/features/home';
import { withProtectedOutlet } from '@stories/router-decorators';

const meta: Meta<typeof Home> = {
  title: 'Pages/Home',
  component: Home,
  tags: ['autodocs'],
  decorators: [withProtectedOutlet()],
  parameters: {
    docs: {
      description: {
        component:
          'The authenticated landing page (issue #106): a welcome heading, a short ' +
          'description and the sign-out button, which calls the `signOut` that ProtectedRoute ' +
          'passes through the outlet context. In the app it renders inside AppLayout. While the ' +
          '`userSettings` flag is on, a Налаштування link sits between the two.',
      },
    },
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof Home>;

export const Default: Story = {};

function installFlagBlock(): HTMLScriptElement {
  const block = document.createElement('script');
  block.id = APP_CONFIG_ELEMENT_ID;
  block.type = 'application/json';
  block.textContent = JSON.stringify({ flags: { userSettings: true } });
  document.head.appendChild(block);
  return block;
}

function withUserSettingsFlag(): Decorator {
  return function UserSettingsFlagDecorator(Story): JSX.Element {
    const [block] = useState(installFlagBlock);
    useEffect(() => (): void => block.remove(), [block]);

    return <Story />;
  };
}

export const WithSettingsLink: Story = { decorators: [withUserSettingsFlag()] };
