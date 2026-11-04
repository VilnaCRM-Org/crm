import type { Meta, StoryObj } from '@storybook/react-webpack5';

import CardBackControl from '@auth/components/reset-password/card-back-control';
import { withMemoryRouter } from '@stories/router-decorators';
import { noop } from '@stories/story-callbacks';

const meta: Meta<typeof CardBackControl> = {
  title: 'Auth/PasswordRecovery/CardBackControl',
  component: CardBackControl,
  tags: ['autodocs'],
  decorators: [withMemoryRouter('/password-recovery')],
  parameters: {
    docs: {
      description: {
        component:
          'The "Назад" row of the recovery cards: a link when given `to`, a button when given ' +
          '`onClick`. Text and chevron use the Figma #969B9D; the focus ring stays #404142.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof CardBackControl>;

export const AsLink: Story = { args: { to: '/sign-in' } };

export const AsButton: Story = { args: { onClick: noop } };
