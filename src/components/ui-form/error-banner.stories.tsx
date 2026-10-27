import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { createRef } from 'react';

import { noop } from '@stories/story-callbacks';

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
          'moves to the element `returnFocusRef` points at, which UIForm sets to its submit ' +
          'button so keyboard users can resubmit. This story renders the banner on its own ' +
          'with an unattached ref, so it shows the message only.',
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof ErrorBanner>;

export const Default: Story = {};

export const WithAction: Story = {
  args: {
    action: { label: 'Спробувати ще раз', onClick: noop },
  },
  parameters: {
    docs: {
      description: {
        story:
          'With an `action`, a link button follows the alert text inside the focused banner, ' +
          'so it is the next Tab stop. UIForm passes it through `errorAction`; it renders only ' +
          'while there is an error.',
      },
    },
  },
};
