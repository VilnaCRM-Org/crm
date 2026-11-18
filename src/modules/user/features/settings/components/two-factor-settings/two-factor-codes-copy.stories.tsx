import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { createRef, type JSX } from 'react';

import { withAcceptingClipboard, withRefusingClipboard } from '@stories/clipboard-decorators';
import { SECRET } from '@stories/two-factor-story-fixtures';
import waitForText from '@stories/wait-for-text';

import CopiedLine from './copied-line';
import CopyButton from './copy-button';

const meta: Meta<typeof CopyButton> = {
  title: 'Settings/TwoFactorSettings/CodesCopy',
  component: CopyButton,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'The recovery-codes copy button. It never changes; the result shows as a line above it ' +
          '(Inter 14 px #404142, hidden from assistive technology) while the polite live region ' +
          'carries the announcement.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof CopyButton>;

const CODES_COPIED = 'Коди скопійовано';
const CODES_COPY_FAILED = 'Не вдалося скопіювати. Виділіть коди і скопіюйте вручну.';

const renderCodesCopy = (): JSX.Element => (
  <CopyButton
    text={SECRET}
    targetRef={createRef<HTMLElement>()}
    label="Скопіювати коди"
    copiedText={CODES_COPIED}
    failedText={CODES_COPY_FAILED}
  />
);

export const Copy: Story = { render: renderCodesCopy };

export const Copied: Story = {
  render: renderCodesCopy,
  decorators: [withAcceptingClipboard()],
  play: async ({ canvasElement, userEvent }) => {
    const copy = canvasElement.querySelector<HTMLButtonElement>('button');
    if (copy !== null) await userEvent.click(copy);
    await waitForText(canvasElement, CODES_COPIED);
  },
  parameters: {
    docs: {
      description: {
        story:
          'The codes were copied: "Коди скопійовано" shows above the unchanged button for 3 s ' +
          'and fades out over 0.4 s (at once with reduced motion); the live region announces it.',
      },
    },
  },
};

export const CopiedNotice: Story = {
  render: () => <CopiedLine text={CODES_COPIED} />,
  parameters: {
    docs: {
      description: {
        story:
          'The copied line on its own: Inter 14 px #404142, hidden from assistive technology, ' +
          'removed after 3 s plus the 0.4 s fade.',
      },
    },
  },
};

export const CopyFailed: Story = {
  render: renderCodesCopy,
  decorators: [withRefusingClipboard()],
  play: async ({ canvasElement, userEvent }) => {
    const copy = canvasElement.querySelector<HTMLButtonElement>('button');
    if (copy !== null) await userEvent.click(copy);
    await waitForText(canvasElement, CODES_COPY_FAILED);
  },
  parameters: {
    docs: {
      description: {
        story:
          'The clipboard refuses the write: the manual instruction shows above the button until ' +
          'the next copy and is announced through the live region.',
      },
    },
  },
};
