import type { Meta, StoryObj } from '@storybook/react-webpack5';

import UITextLink from '@/components/ui-text-link';

const meta: Meta<typeof UITextLink> = {
  title: 'Components/Navigation/UITextLink',
  component: UITextLink,
  tags: ['autodocs'],
  args: {
    href: '/password-recovery',
    children: 'Забули пароль?',
  },
  argTypes: {
    href: { control: 'text' },
  },
  parameters: {
    docs: {
      description: {
        component:
          'A standalone brand text link, as the sign-in "forgot password" link draws it. It ' +
          'wraps the ui-toolkit UiLink with appearance="text" and tone="brand": Golos 15/18, ' +
          '18 px DemiBold from 768 to 1439 px, #1EAEFF and no underline. The brand tone is ' +
          "2.46:1 on white, under WCAG 1.4.3, by the product owner's choice (toolkit DEV-67).",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof UITextLink>;

export const Default: Story = {};
