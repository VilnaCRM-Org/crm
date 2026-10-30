import Box from '@mui/material/Box';
import type { Decorator, Meta, StoryObj } from '@storybook/react-webpack5';
import type { JSX } from 'react';

import HeaderBadge from './header-badge';
import styles from './styles';

const onTheRoundButton: Decorator = (Story): JSX.Element => (
  <Box sx={{ ...styles.iconButton.tablet, margin: '24px' }}>
    <Story />
  </Box>
);

const meta: Meta<typeof HeaderBadge> = {
  title: 'Shell/Header/HeaderBadge',
  component: HeaderBadge,
  tags: ['autodocs'],
  args: { count: 1 },
  decorators: [onTheRoundButton],
  parameters: {
    docs: {
      description: {
        component:
          'The presentational count badge: 18 px, Inter 500 12/18 white digits, 34,30 inside the ' +
          'round button, painted in the disabled variant colour `#D0D4D8` because every header ' +
          'button is disabled. It is aria-hidden; the button description carries the count. ' +
          'It renders only a whole count of at least 1, and shows a count over 99 as 99+ on a ' +
          'badge that widens from its 18 px minimum; a missing, null, zero or fractional count, ' +
          'NaN or Infinity renders nothing. The story draws it on the disabled tablet button.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof HeaderBadge>;

export const One: Story = {};

export const Eight: Story = { args: { count: 8 } };

export const OverNinetyNine: Story = { args: { count: 150 } };

export const NoCount: Story = { args: { count: null } };
