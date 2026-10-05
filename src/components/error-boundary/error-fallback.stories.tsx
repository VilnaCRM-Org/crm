import type { Meta, StoryObj } from '@storybook/react-webpack5';

import type { RecoverableError } from '@/lib/reliability/types/recoverable-error';
import { noop } from '@stories/story-callbacks';

import ErrorFallback from './error-fallback';

const recovery = (
  strategy: RecoverableError['strategy'],
  messageKey: string
): RecoverableError => ({
  recoverable: strategy !== 'none',
  strategy,
  messageKey,
  severity: 'error',
});

const meta: Meta<typeof ErrorFallback> = {
  title: 'Components/ErrorBoundary/ErrorFallback',
  component: ErrorFallback,
  tags: ['autodocs'],
  args: {
    error: new Error('Rendering failed'),
    recovery: recovery('retry', 'error_boundary.retryable'),
    reset: noop,
    reload: noop,
    landmark: 'main',
  },
  argTypes: {
    landmark: { control: 'inline-radio', options: ['main', 'region'] },
    error: { control: false },
    recovery: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          'The accessible recovery screen rendered by UIErrorBoundary and RouteError (issue ' +
          '#116): a heading that takes focus on mount, a `role="alert"` message, the action ' +
          'the recovery strategy allows, an unconditional link to the homepage, and the error ' +
          'details outside production builds.',
      },
      story: { inline: false },
    },
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof ErrorFallback>;

export const Retry: Story = {};

export const Reload: Story = {
  args: { recovery: recovery('reload', 'error_boundary.chunk_load') },
};

export const NotRecoverable: Story = {
  args: { recovery: recovery('none', 'error_boundary.unrecoverable') },
};

export const InsideAppLayout: Story = {
  args: { landmark: 'region' },
  parameters: {
    docs: {
      description: {
        story:
          'Under AppLayout the fallback renders a labelled `<section>` instead of a second ' +
          '`<main>`.',
      },
    },
  },
};
