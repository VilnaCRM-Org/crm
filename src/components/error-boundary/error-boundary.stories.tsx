import type { Meta, StoryObj } from '@storybook/react-webpack5';
import type { JSX } from 'react';

import UIErrorBoundary from '@/components/error-boundary/ui-error-boundary';

const silentReporter = { report: (): undefined => undefined };

function Thrower({ error }: { error: unknown }): JSX.Element {
  throw error;
}

const meta: Meta<typeof UIErrorBoundary> = {
  title: 'Components/ErrorBoundary/UIErrorBoundary',
  component: UIErrorBoundary,
  tags: ['autodocs'],
  args: {
    surface: 'storybook',
    reporter: silentReporter,
  },
  parameters: {
    docs: {
      description: {
        component:
          'Recovery-aware error boundary (issue #116). It classifies the caught error into a ' +
          'recovery strategy and renders the accessible ErrorFallback: a focused heading, an ' +
          'alert with the localized message, the strategy action, and an always-present ' +
          'link to the homepage.',
      },
    },
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof UIErrorBoundary>;

export const Idle: Story = {
  args: {
    children: <p>Healthy content renders untouched.</p>,
  },
};

export const ErrorWithRetry: Story = {
  args: {
    children: <Thrower error={new Error('Rendering failed')} />,
  },
  parameters: {
    docs: {
      description: {
        story: 'An unexpected render error offers "Try again", which re-mounts the children.',
      },
    },
  },
};

export const NonRecoverable: Story = {
  args: {
    children: (
      <Thrower
        error={{
          recoverable: false,
          strategy: 'none',
          messageKey: 'error_boundary.unrecoverable',
          severity: 'error',
        }}
      />
    ),
  },
  parameters: {
    docs: {
      description: {
        story: 'A non-recoverable error hides the retry action; the homepage link remains.',
      },
    },
  },
};

export const ReloadRequired: Story = {
  args: {
    children: <Thrower error={new Error('Loading chunk 42 failed.')} />,
  },
  parameters: {
    docs: {
      description: {
        story: 'A stale-deploy chunk failure asks for a full reload instead of a retry.',
      },
    },
  },
};
