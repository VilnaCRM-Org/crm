import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { createRef } from 'react';

import { noop } from '@stories/story-callbacks';

import CodesBlock from './codes-block';
import CopyButton from './copy-button';
import KeyBlock from './key-block';
import KeyChip from './key-chip';
import OffGuide from './off-guide';
import SavedCheckbox from './saved-checkbox';
import SetupGuide from './setup-guide';
import StatusHeading from './status-heading';
import StepItem from './step-item';

const OTPAUTH_URI =
  'otpauth://totp/VilnaCRM%3Airyna%40example.com?secret=JBSWY3DPEHPK3PXP&issuer=VilnaCRM';

const meta: Meta<typeof StepItem> = {
  title: 'Settings/TwoFactorSettings/Parts',
  component: StepItem,
  tags: ['autodocs'],
  args: { position: 1, text: 'Завантажте й установіть застосунок автентифікації' },
  argTypes: { position: { control: 'number' }, text: { control: 'text' } },
  parameters: {
    docs: {
      description: {
        component:
          'The small pieces of the two-factor card: a numbered step (24 px #E1E7EA badge, ' +
          'text #57595B), the key chip (#EAECEE, text #57595B) and its outlined copy button, ' +
          'and the guides that group them.',
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
  render: () => <KeyChip secret="JBSWY3DPEHPK3PXP" chipRef={createRef<HTMLElement>()} />,
};

export const Copy: Story = {
  render: () => (
    <CopyButton
      text="JBSWY3DPEHPK3PXP"
      targetRef={createRef<HTMLElement>()}
      label="Скопіювати ключ"
      copiedText="Ключ скопійовано"
      failedText="Не вдалося скопіювати. Виділіть ключ і скопіюйте вручну."
    />
  ),
};

export const KeyWithCopy: Story = { render: () => <KeyBlock secret="JBSWY3DPEHPK3PXP" /> };

export const OffSteps: Story = { render: () => <OffGuide /> };

export const ScanGuide: Story = { render: () => <SetupGuide otpauthUri={OTPAUTH_URI} /> };

export const RecoveryCodes: Story = {
  render: () => (
    <CodesBlock
      codes={{
        items: ['K7QM-4RTD', 'W2XB-9NHF', 'P5ZC-1LVA', 'D8GJ-6YSE'].map((value) => ({ value })),
      }}
    />
  ),
};

export const StatusWithIcon: Story = {
  render: () => <StatusHeading text="Двофакторну автентифікацію ввімкнено" icon />,
};

export const StatusWithoutIcon: Story = {
  render: () => <StatusHeading text="Налаштування застаріло. Почніть знову." icon={false} />,
};

export const SavedAcknowledgement: Story = {
  render: () => <SavedCheckbox checked={false} onChange={noop} />,
};
