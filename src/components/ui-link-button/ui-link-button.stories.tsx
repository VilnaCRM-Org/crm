import type { Meta, StoryObj } from '@storybook/react-webpack5';

import UILinkButton from '@/components/ui-link-button';
import { noop } from '@stories/story-callbacks';

const meta: Meta<typeof UILinkButton> = {
  title: 'Components/Inputs/UILinkButton',
  component: UILinkButton,
  tags: ['autodocs'],
  args: {
    children: 'Надіслати повторно',
    onClick: noop,
  },
  parameters: {
    docs: {
      description: {
        component:
          'An action that looks like a text link: a real `type="button"`, underlined in the ' +
          'link token #0074B5 (5.04:1 on white), #00588A on hover, with a 2 px focus ring in ' +
          'the same colour. While `unavailable` it stays focusable and keeps its name, carries ' +
          '`aria-disabled="true"`, dims to 60 % and ignores clicks, so focus never drops while ' +
          'an action runs. `sx` adds layout from the caller (the settings e-mail row places ' +
          '"Надіслати повторно" with it).',
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof UILinkButton>;

export const Default: Story = {};

export const Unavailable: Story = { args: { unavailable: true } };
