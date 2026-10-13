import type { Meta, StoryObj } from '@storybook/react-webpack5';

import InCardLink from '@auth/components/reset-password/in-card-link';
import { withMemoryRouter } from '@stories/router-decorators';

import styles from './styles';

const meta: Meta<typeof InCardLink> = {
  title: 'Auth/PasswordRecovery/InCardLink',
  component: InCardLink,
  tags: ['autodocs'],
  decorators: [withMemoryRouter('/password-recovery')],
  args: { to: '/sign-in', variant: 'contained', sx: styles.resultAction, children: 'До входу' },
  argTypes: {
    variant: { control: 'radio', options: ['text', 'contained'] },
    sx: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          'A real link that navigates through the router with the focus-on-arrival marker on a ' +
          'plain click or Enter, and leaves modified and middle clicks to the browser.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof InCardLink>;

export const Primary: Story = {};

export const Text: Story = {
  args: { variant: 'text', sx: styles.backControl, children: 'Назад' },
};
