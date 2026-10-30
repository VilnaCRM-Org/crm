import type { Meta, StoryObj } from '@storybook/react-webpack5';

import ModeToggle from '@auth/components/two-factor/mode-toggle';
import { noop } from '@stories/story-callbacks';

const meta: Meta<typeof ModeToggle> = {
  title: 'Auth/TwoFactor/ModeToggle',
  component: ModeToggle,
  tags: ['autodocs'],
  args: { mode: 'totp', busy: false, onSwitch: noop },
  parameters: {
    docs: {
      description: {
        component:
          'The text button under the challenge submit that switches between the authenticator ' +
          'code and a recovery code (issue #331). It is the shared UILinkButton, so it is ' +
          'underlined in the link colour and inert while a request is in flight.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof ModeToggle>;

export const UseRecoveryCode: Story = {};

export const UseAuthenticatorCode: Story = { args: { mode: 'recovery' } };

export const Busy: Story = { args: { busy: true } };
