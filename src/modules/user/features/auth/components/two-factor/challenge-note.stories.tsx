import type { Meta, StoryObj } from '@storybook/react-webpack5';

import ChallengeNote from '@auth/components/two-factor/challenge-note';

const meta: Meta<typeof ChallengeNote> = {
  title: 'Auth/TwoFactor/ChallengeNote',
  component: ChallengeNote,
  tags: ['autodocs'],
  args: { text: 'Код можна ввести протягом 5 хвилин після входу.' },
  parameters: {
    docs: {
      description: {
        component:
          'The muted line under the challenge subtitle that says how long the code stays ' +
          'valid (issue #331).',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof ChallengeNote>;

export const Default: Story = {};
