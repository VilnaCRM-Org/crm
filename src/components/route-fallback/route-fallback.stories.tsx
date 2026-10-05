import type { Meta, StoryObj } from '@storybook/react-webpack5';

import RouteFallback from '@/components/route-fallback';

const meta: Meta<typeof RouteFallback> = {
  title: 'Components/Feedback/RouteFallback',
  component: RouteFallback,
  tags: ['autodocs'],
  argTypes: {
    minHeight: { control: 'text', description: 'Minimum height of the spinner area' },
    message: { control: 'text', description: 'Override for the announced loading message' },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Suspense fallback for lazily loaded routes (issue #117). It paints nothing for the ' +
          'first 150 ms so fast chunk loads never flash a loader, then shows a spinner and ' +
          'announces loading through an always-mounted polite live region.',
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof RouteFallback>;

export const Default: Story = {};

export const InPageBoundary: Story = {
  args: {
    minHeight: 'auto',
    message: 'Завантажуємо результат реєстрації…',
  },
  parameters: {
    docs: {
      description: {
        story: 'An in-page boundary reuses the fallback with an auto height and its own message.',
      },
    },
  },
};
