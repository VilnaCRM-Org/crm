import type { Meta, StoryObj } from '@storybook/react-webpack5';

import UIToastStack from '@/components/ui-toast';
import { noop } from '@stories/story-callbacks';

const meta: Meta<typeof UIToastStack> = {
  title: 'Components/Feedback/UIToastStack',
  component: UIToastStack,
  tags: ['autodocs'],
  args: {
    toasts: { items: [{ id: 1, tone: 'success', message: 'Зміни збережено' }] },
    announcement: 'Зміни збережено',
    alert: '',
    onDismiss: noop,
    returnFocusRef: { current: null },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Up to three toasts, fixed bottom-right from 480 px and across the bottom below it, ' +
          'with two always-mounted visually hidden regions before them: a status region that ' +
          'announces the success texts once and an alert region that announces the error texts. ' +
          'Closing a toast moves focus to the next close button, then to the previous one, then ' +
          'back to the control the page passes in while it is enabled, and otherwise to the ' +
          'fallback target. No toast takes focus when it appears and none times out.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof UIToastStack>;

export const One: Story = {};

export const Three: Story = {
  args: {
    toasts: {
      items: [
        { id: 1, tone: 'success', message: 'Особисті дані збережено' },
        { id: 2, tone: 'success', message: 'Пароль змінено' },
        { id: 3, tone: 'success', message: 'Лист для підтвердження надіслано' },
      ],
    },
    announcement: 'Особисті дані збережено Пароль змінено Лист для підтвердження надіслано',
  },
};

export const Mixed: Story = {
  args: {
    toasts: {
      items: [
        { id: 1, tone: 'success', message: 'Особисті дані збережено' },
        {
          id: 2,
          tone: 'error',
          message: 'Не вдалося змінити пароль',
          action: { label: 'Повторити', onActivate: noop },
        },
      ],
    },
    announcement: 'Особисті дані збережено',
    alert: 'Не вдалося змінити пароль',
  },
};

export const Empty: Story = {
  args: { toasts: { items: [] }, announcement: '', alert: '' },
};
