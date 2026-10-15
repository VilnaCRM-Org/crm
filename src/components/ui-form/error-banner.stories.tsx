import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { createRef } from 'react';

import ErrorBanner from './error-banner';

const meta: Meta<typeof ErrorBanner> = {
  title: 'Components/Inputs/UIForm/ErrorBanner',
  component: ErrorBanner,
  tags: ['autodocs'],
  args: {
    error: 'Не вдалося надіслати запит. Перевірте з’єднання та спробуйте ще раз.',
    returnFocusRef: createRef(),
  },
  parameters: {
    docs: {
      description: {
        component:
          'The form-level failure UIForm renders under its subtitle as a `role="alert"` message. ' +
          'It takes focus when it appears; if it disappears while still holding focus, focus ' +
          'moves to the submit button so keyboard users can resubmit.',
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof ErrorBanner>;

export const Default: Story = {};
