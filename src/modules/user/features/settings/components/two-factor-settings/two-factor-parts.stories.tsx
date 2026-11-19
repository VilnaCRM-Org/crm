import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { createRef } from 'react';

import { withRefusingClipboard } from '@stories/clipboard-decorators';
import { OTPAUTH_URI, SECRET } from '@stories/two-factor-story-fixtures';
import waitForText from '@stories/wait-for-text';

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

export const KeyWithCopy: Story = {
  render: () => <KeyBlock secret={SECRET} copyLabel="Скопіювати ключ" />,
};

export const KeyWithCopyFailed: Story = {
  render: () => <KeyBlock secret={SECRET} copyLabel="Скопіювати ключ" />,
  decorators: [withRefusingClipboard()],
  play: async ({ canvasElement, userEvent }) => {
    const copy = canvasElement.querySelector<HTMLButtonElement>(
      'button[aria-label="Скопіювати ключ"]'
    );
    if (copy !== null) await userEvent.click(copy);
    await waitForText(canvasElement, 'Не вдалося скопіювати. Виділіть ключ і скопіюйте вручну.');
  },
  parameters: {
    docs: {
      description: {
        story:
          'The clipboard refuses the write, so the key is selected and the manual instruction ' +
          'is shown below it and announced through the live region.',
      },
    },
  },
};

export const OffSteps: Story = { render: () => <OffGuide /> };

export const ScanGuide: Story = {
  render: () => <SetupGuide otpauthUri={OTPAUTH_URI} secret={SECRET} />,
};

export const KeyInfo: Story = { render: () => <KeyInfoTooltip /> };
