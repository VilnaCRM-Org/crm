import type { Meta, StoryObj } from '@storybook/react-webpack5';

import type { RecoverableError } from '@/lib/reliability/types/recoverable-error';
import { noop } from '@stories/story-callbacks';

import AuthErrorFallback from './auth-error-fallback';

const recovery = (
  strategy: RecoverableError['strategy'],
  messageKey: string
): RecoverableError => ({
  recoverable: strategy !== 'none',
  strategy,
  messageKey,
  severity: 'error',
});

const meta: Meta<typeof AuthErrorFallback> = {
  title: 'Auth/ErrorBoundary/AuthErrorFallback',
  component: AuthErrorFallback,
  tags: ['autodocs'],
  args: {
    error: new Error('Auth form failed to render'),
    recovery: recovery('retry', 'error_boundary.retryable'),
    reset: noop,
    reload: noop,
  },
  argTypes: {
    error: { control: false },
    recovery: { control: false },
    fallback: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          'The fallback AuthErrorBoundary renders inside the auth page `<main>`: a focusable ' +
          'wrapper with a heading, an alert, and the action the recovery strategy allows. ' +
          'Exit-only strategies show the unrecoverable copy and no button; a chunk failure ' +
          'asks for a reload.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof AuthErrorFallback>;

export const TryAgain: Story = {};

export const ReloadRequired: Story = {
  args: { recovery: recovery('reload', 'error_boundary.chunk_load') },
};

export const Unrecoverable: Story = {
  args: { recovery: recovery('none', 'error_boundary.unrecoverable') },
};

export const CustomContent: Story = {
  args: { fallback: 'Не вдалося завантажити форму входу.' },
};
