import Box from '@mui/material/Box';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import type { JSX } from 'react';

import UIToast from '@/components/ui-toast/ui-toast';
import { noop } from '@stories/story-callbacks';

const meta: Meta<typeof UIToast> = {
  title: 'Components/Feedback/UIToast',
  component: UIToast,
  tags: ['autodocs'],
  args: {
    toast: { id: 1, tone: 'success', message: 'Зміни збережено' },
    onDismiss: noop,
  },
  parameters: {
    docs: {
      description: {
        component:
          'One elevated toast. Success sits on #E8F4EF with a #2E7D32 check icon, a 1 px edge, a ' +
          '4 px accent and the popover shadow in the same green; error is #FDECEC with #DC3939. ' +
          'It slides in over 180 ms on mount only. A toast carries no role: the stack announces ' +
          'it through its ' +
          'always-mounted status and alert regions. The close button is described by the ' +
          'message. The text, the optional underlined action and the close icon are #1A1C1E. ' +
          'Nothing closes a toast but the person reading it.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof UIToast>;

export const Success: Story = {};

export const SuccessWithAction: Story = {
  args: {
    toast: {
      id: 1,
      tone: 'success',
      message: 'Лист для підтвердження надіслано',
      action: { label: 'Скасувати', onActivate: noop },
    },
  },
};

export const Error: Story = {
  args: { toast: { id: 1, tone: 'error', message: 'Не вдалося зберегти зміни' } },
};

export const ErrorWithAction: Story = {
  args: {
    toast: {
      id: 1,
      tone: 'error',
      message: 'Не вдалося зберегти зміни',
      action: { label: 'Повторити', onActivate: noop },
    },
  },
};

export const ReducedMotion: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'A simulation: Storybook cannot switch `prefers-reduced-motion`, so this story removes ' +
          'every animation in its frame. With the real preference the toast appears at once, ' +
          'with no slide and no fade.',
      },
    },
  },
  decorators: [
    (Story): JSX.Element => (
      <Box sx={{ '& *': { animation: 'none !important' } }}>
        <Story />
      </Box>
    ),
  ],
};
