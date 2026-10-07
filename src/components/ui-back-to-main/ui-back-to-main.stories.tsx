import type { Meta, StoryObj } from '@storybook/react-webpack5';

import UIBackToMain from '@/components/ui-back-to-main';

const meta: Meta<typeof UIBackToMain> = {
  title: 'Components/Navigation/UIBackToMain',
  component: UIBackToMain,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'The "back to the main page" link shown above the auth and not-found pages. It ' +
          'wraps the ui-toolkit UiBackToMain with the localized label and a decorative arrow.',
      },
    },
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof UIBackToMain>;

export const Default: Story = {};
