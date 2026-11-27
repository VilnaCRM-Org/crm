import Box from '@mui/material/Box';
import type { Decorator, Meta, StoryObj } from '@storybook/react-webpack5';
import type { JSX } from 'react';

import bellStyles from './bell-styles';
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
          'It renders only a whole count of at least 1, as its digits; a missing, null, ' +
          'zero or fractional count, ' +
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

export const Alert: Story = {
  args: { tone: 'alert' },
  decorators: [
    (Story): JSX.Element => (
      <Box sx={{ ...bellStyles.enabled.tablet, margin: '24px' }}>
        <Story />
      </Box>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'The alert tone for the enabled bell: a `#D63333` fill with white 12 px digits, 4.79:1 ' +
          'on the white bell and 4.63:1 on the page, and a 1 px `CanvasText` border in forced ' +
          'colors. It is drawn at desktop and tablet only.',
      },
    },
  },
};

export const NoCount: Story = { args: { count: null } };
