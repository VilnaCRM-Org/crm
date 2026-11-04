import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { createRef } from 'react';

import { OTPAUTH_URI, SECRET } from '@stories/two-factor-story-fixtures';

import CopyButton from './copy-button';
import KeyBlock from './key-block';
import KeyChip from './key-chip';
import KeyInfoTooltip from './key-info-tooltip';
import OffGuide from './off-guide';
import SetupGuide from './setup-guide';
import StepItem from './step-item';

const meta: Meta<typeof StepItem> = {
  title: 'Settings/TwoFactorSettings/Parts',
  component: StepItem,
  tags: ['autodocs'],
  args: { position: 1, text: 'Завантажте й установіть застосунок Google Authenticator' },
  argTypes: { position: { control: 'number' }, text: { control: 'text' } },
  parameters: {
    docs: {
      description: {
        component:
          'The small pieces of the setup card: a numbered step (24 px #E1E7EA badge, text ' +
          '#404142), the key chip (#EAECEE, text #57595B) with its icon-only copy button, and ' +
          'the guides that group them.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof StepItem>;

export const Step: Story = {
  render: (args) => (
    <ol>
      <StepItem position={args.position} text={args.text} />
    </ol>
  ),
};

export const Key: Story = {
  render: () => <KeyChip secret={SECRET} chipRef={createRef<HTMLElement>()} />,
};

export const Copy: Story = {
  render: () => (
    <CopyButton
      text={SECRET}
      targetRef={createRef<HTMLElement>()}
      label="Скопіювати ключ"
      copiedText="Ключ скопійовано"
      failedText="Не вдалося скопіювати. Виділіть ключ і скопіюйте вручну."
    />
  ),
};

export const KeyWithCopy: Story = {
  render: () => <KeyBlock secret={SECRET} copyLabel="Скопіювати ключ" />,
};

export const OffSteps: Story = { render: () => <OffGuide /> };

export const ScanGuide: Story = {
  render: () => <SetupGuide otpauthUri={OTPAUTH_URI} secret={SECRET} />,
};

export const KeyInfo: Story = { render: () => <KeyInfoTooltip /> };
