import type { Meta, StoryObj } from '@storybook/react-webpack5';
import type { JSX } from 'react';

import CardHeader from './card-header';
import KeyCopyButton from './key-copy-button';
import KeyInfoBubble from './key-info-bubble';
import ScanStepBody from './scan-step-body';

const OTPAUTH_URI =
  'otpauth://totp/VilnaCRM%3Aolena.petrenko%40example.com?secret=JBSWY3DPEHPK3PXP&issuer=VilnaCRM';
const SECRET = 'JBSWY3DPEHPK3PXP';
const IGNORE = (): void => undefined;

const meta: Meta<typeof CardHeader> = {
  title: 'Settings/TwoFactorSettings/Card parts',
  component: CardHeader,
  tags: ['autodocs'],
  args: { title: 'Налаштуйте 2FA', focus: false, divided: true },
  argTypes: {
    title: { control: 'text' },
    focus: { control: false },
    divided: { control: 'boolean' },
  },
  parameters: {
    docs: {
      description: {
        component:
          'The Figma card pieces: the header with the authenticator logo, the scan step body ' +
          '(QR 250 px, key chip, manual hint), the icon-only copy button and the key info bubble.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof CardHeader>;

export const SetupHeader: Story = {};

export const ConnectedHeader: Story = { args: { title: '2FA підключено', divided: false } };

export const ScanBody: Story = {
  render: (): JSX.Element => <ScanStepBody otpauthUri={OTPAUTH_URI} secret={SECRET} />,
};

export const CopyIdle: Story = {
  render: (): JSX.Element => (
    <KeyCopyButton label="Скопіювати ключ" copied={false} onCopy={IGNORE} />
  ),
};

export const CopyDone: Story = {
  render: (): JSX.Element => <KeyCopyButton label="Скопіювати ключ" copied onCopy={IGNORE} />,
};

export const InfoBubble: Story = {
  render: (): JSX.Element => (
    <KeyInfoBubble
      id="key-info"
      open
      text="Цей ключ дозволить вам відновити Authenticator у разі втрати телефона."
    />
  ),
};
