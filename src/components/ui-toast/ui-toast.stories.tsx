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
          'One toast. Success sits on #E8F4EF with a #38B386 check icon and carries no role: the ' +
          'stack announces it. Error sits on #FDECEC with a #DC3939 icon and is a ' +
          '`role="alert"`. The text, the optional underlined action and the close icon are ' +
          '#1A1C1E. Nothing closes a toast but the person reading it.',
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
