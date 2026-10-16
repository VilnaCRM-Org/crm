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
    onDismiss: noop,
    returnFocusRef: { current: null },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Up to three toasts, fixed bottom-right from 480 px and across the bottom below it, ' +
          'with one always-mounted visually hidden status region before them that announces the ' +
          'success texts once. Closing a toast moves focus to the next close button, or back to ' +
          'the control the page passes in. No toast takes focus when it appears and none times ' +
          'out.',
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
  },
};

export const Empty: Story = {
  args: { toasts: { items: [] }, announcement: '' },
};
