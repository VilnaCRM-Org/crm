import type { Decorator, Meta, StoryObj } from '@storybook/react-webpack5';
import { createRef, type JSX } from 'react';

import { withAcceptingClipboard, withRefusingClipboard } from '@stories/clipboard-decorators';
import { SECRET } from '@stories/two-factor-story-fixtures';
import waitForText from '@stories/wait-for-text';

import CopyButton from './copy-button';
import CopyLabel from './copy-label';

const meta: Meta<typeof CopyButton> = {
  title: 'Settings/TwoFactorSettings/CodesCopy',
  component: CopyButton,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'The recovery-codes copy button. A copy turns its text into the copied text for 3 s; ' +
          'a refused copy shows a line above it (Inter 14 px #404142, hidden from assistive ' +
          'technology). The polite live region carries both announcements.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof CopyButton>;

const CODES_COPIED = 'Коди скопійовано';
const CODES_COPY_FAILED = 'Не вдалося. Виділіть коди вручну.';

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

const copyResultStory = (decorator: Decorator, expected: string, story: string): Story => ({
  render: renderCodesCopy,
  decorators: [decorator],
  play: async ({ canvasElement, userEvent }): Promise<void> => {
    const copy = canvasElement.querySelector<HTMLButtonElement>('button');
    if (copy !== null) await userEvent.click(copy);
    await waitForText(canvasElement, expected);
  },
  parameters: { docs: { description: { story } } },
});

export const Copied: Story = copyResultStory(
  withAcceptingClipboard(),
  CODES_COPIED,
  'The codes were copied: the button reads "Коди скопійовано" for 3 s, keeps its width and ' +
    'returns to "Скопіювати коди"; the live region announces it.'
);

export const CopiedLabel: Story = {
  render: () => <CopyLabel label="Скопіювати коди" copiedText={CODES_COPIED} copied />,
  parameters: {
    docs: {
      description: { story: 'The button text on its own, while it reads "Коди скопійовано".' },
    },
  },
};

export const CopyFailed: Story = copyResultStory(
  withRefusingClipboard(),
  CODES_COPY_FAILED,
  'The clipboard refuses the write: the manual instruction shows above the button until ' +
    'the next copy and is announced through the live region.'
);
