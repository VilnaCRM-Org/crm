import type { Meta, StoryObj } from '@storybook/react-webpack5';

import UIButton from '@/components/ui-button';

const meta: Meta<typeof UIButton> = {
  title: 'Components/Inputs/UIButton',
  component: UIButton,
  tags: ['autodocs'],
  args: {
    children: 'Зареєструватися',
    variant: 'contained',
  },
  argTypes: {
    variant: {
      control: 'inline-radio',
      options: ['contained', 'outlined', 'outlinedPill', 'text'],
    },
    size: { control: 'inline-radio', options: ['small', 'medium', 'large'] },
    disabled: { control: 'boolean' },
    loading: { control: 'boolean' },
    fullWidth: { control: 'boolean' },
    to: { control: 'text', description: 'Internal path; renders the button as a link' },
  },
  parameters: {
    docs: {
      description: {
        component:
          'The CRM button: MUI Button under the CRM button theme. It renders a `<button ' +
          'type="button">` by default and an `<a href>` when given `to` or `href`.',
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof UIButton>;

export const Contained: Story = {};

export const Outlined: Story = {
  args: { variant: 'outlined' },
};

export const Text: Story = {
  args: { variant: 'text' },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const Loading: Story = {
  args: { loading: true },
  parameters: {
    docs: {
      description: {
        story: 'MUI native loading state: the button is disabled and keeps its accessible name.',
      },
    },
  },
};

export const AsLink: Story = {
  args: { to: '/sign-in', children: 'Увійти' },
};

export const OutlinedPill: Story = {
  args: { variant: 'outlinedPill', children: 'Скопіювати коди' },
  parameters: {
    docs: {
      description: {
        story:
          'Rest state of the outlined pill: a 40 px minimum height, a 57 px radius, a 1 px ' +
          '`#80878A` border on white and `#1B2327` Golos 500 15/18 text. Hovering fills it ' +
          'with `#F4F5F6`; forced-colors mode draws the border in `ButtonText`.',
      },
    },
  },
};

export const OutlinedPillFocusVisible: Story = {
  args: { variant: 'outlinedPill', children: 'Скопіювати коди' },
  play: ({ canvasElement }) => {
    canvasElement.querySelector('button')?.focus();
  },
  parameters: {
    docs: {
      description: {
        story:
          'Keyboard focus draws the shared 2 px `#404142` ring, offset by 2 px; the story ' +
          'focuses the button on load.',
      },
    },
  },
};

export const OutlinedPillDisabled: Story = {
  args: { variant: 'outlinedPill', children: 'Скасувати', disabled: true },
  parameters: {
    docs: {
      description: {
        story:
          'The native `disabled` state greys the border to `#E1E7EA` and the label to ' +
          '`#969B9D`, and `GrayText` in forced-colors mode.',
      },
    },
  },
};

export const OutlinedPillCompact: Story = {
  args: { variant: 'outlinedPill', size: 'small', children: 'Закрити сповіщення' },
  parameters: {
    docs: {
      description: {
        story:
          'The compact `size="small"` pill used by inline notices: 20 px side padding and the ' +
          'default button letter spacing.',
      },
    },
  },
};
