import type { Meta, StoryObj } from '@storybook/react-webpack5';
import type { JSX } from 'react';

import UITypography from '@/components/ui-typography';
import AuthErrorBoundary from '@auth/components/auth-error-boundary';

function Thrower({ error }: { error: unknown }): JSX.Element {
  throw error;
}

const meta: Meta<typeof AuthErrorBoundary> = {
  title: 'Auth/ErrorBoundary/AuthErrorBoundary',
  component: AuthErrorBoundary,
  tags: ['autodocs'],
  argTypes: {
    children: { control: false },
    fallback: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          'UIErrorBoundary composed for the auth surface: it reports through the auth error ' +
          'reporter (a no-op without a Sentry DSN) and renders AuthErrorFallback.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof AuthErrorBoundary>;

export const Healthy: Story = {
  args: {
    children: <UITypography>Форма автентифікації рендериться без помилок.</UITypography>,
  },
};

export const RenderError: Story = {
  args: {
    children: <Thrower error={new Error('Auth form failed to render')} />,
  },
};

export const ChunkLoadError: Story = {
  args: {
    children: <Thrower error={new Error('Loading chunk 42 failed.')} />,
  },
};
