import type { Meta, StoryObj } from '@storybook/react-webpack5';

import UINotificationContent from '@/components/ui-notification-content';
import { noop } from '@stories/story-callbacks';

const meta: Meta<typeof UINotificationContent> = {
  title: 'Components/Feedback/UINotificationContent',
  component: UINotificationContent,
  tags: ['autodocs'],
  args: {
    view: { id: '1', kind: 'success', message: 'Зміни збережено' },
    onClose: noop,
  },
  parameters: {
    docs: {
      description: {
        component:
          'The one content piece of every variant: icon, message, optional underlined action, ' +
          'optional time and optional close button, all `#1A1C1E` text. It carries no role, ' +
          '`aria-live` or `aria-atomic`: the page outlet announces the outcome once. The close ' +
          'button is described by the message, and the time is visible text that is never ' +
          'announced.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof UINotificationContent>;

export const Success: Story = {};

export const ErrorWithRetry: Story = {
  args: {
    view: {
      id: '2',
      kind: 'error',
      message: 'Не вдалося зберегти зміни',
      action: { label: 'Повторити', onActivate: noop },
    },
  },
};

export const WithTime: Story = {
  args: {
    view: {
      id: '3',
      kind: 'success',
      message: 'Ви успішно змінили пароль',
      time: '10 листопада, 09:15',
    },
  },
};

export const WithoutClose: Story = { args: { onClose: undefined } };
