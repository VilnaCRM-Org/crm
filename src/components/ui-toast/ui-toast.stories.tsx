import type { Meta, StoryObj } from '@storybook/react-webpack5';

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
          'One toast. Success sits on #E8F4EF with a #2E7D32 check icon, error on #FDECEC with a ' +
          '#DC3939 icon. A toast carries no role: the stack announces it through its ' +
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

export const ErrorTone: Story = {
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
