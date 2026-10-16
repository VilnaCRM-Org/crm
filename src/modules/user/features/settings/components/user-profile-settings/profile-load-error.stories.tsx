import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { noop } from '@stories/story-callbacks';

import ProfileLoadError from './profile-load-error';

const meta: Meta<typeof ProfileLoadError> = {
  title: 'Settings/ProfileLoadError',
  component: ProfileLoadError,
  tags: ['autodocs'],
  args: { onRetry: noop, focus: false },
  parameters: {
    docs: {
      description: {
        component:
          'The failure state of the profile read: "Не вдалося завантажити профіль" in a ' +
          '`role="alert"` region and a "Спробувати ще раз" button. After a retry that fails ' +
          'again the button takes focus, because the one that held it was replaced by the ' +
          'skeleton.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof ProfileLoadError>;

export const Default: Story = {};

export const FocusedAfterRetry: Story = { args: { focus: true } };
