import type { Meta, StoryObj } from '@storybook/react-webpack5';

import RecoveryCodesNotice from '@auth/components/recovery-codes-notice';
import { withMemoryRouter } from '@stories/router-decorators';
import { noop } from '@stories/story-callbacks';

const meta: Meta<typeof RecoveryCodesNotice> = {
  title: 'Auth/Components/RecoveryCodesNotice',
  component: RecoveryCodesNotice,
  tags: ['autodocs'],
  decorators: [withMemoryRouter()],
  args: { count: 1, onDismiss: noop },
  argTypes: {
    count: { control: { type: 'number', min: 0, max: 8 } },
    onDismiss: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          'The notice shown at the top of `main` after a sign-in that used a recovery code and ' +
          'left two or fewer. A polite status region that mounts empty and is filled in an ' +
          'effect, never focused, with a link to /settings (#0074B5) and an outlined ' +
          '"Закрити сповіщення" button (border #80878A, text #1B2327). There is no Figma frame ' +
          'for it; it takes the card tokens of the settings page.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof RecoveryCodesNotice>;

export const OneLeft: Story = {};

export const TwoLeft: Story = { args: { count: 2 } };

export const NoneLeft: Story = { args: { count: 0 } };
