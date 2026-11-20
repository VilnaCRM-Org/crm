import Box from '@mui/material/Box';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import type { JSX } from 'react';

import UIInlineStatus from '@/components/ui-inline-status';
import { noop } from '@stories/story-callbacks';

const meta: Meta<typeof UIInlineStatus> = {
  title: 'Components/Feedback/UIInlineStatus',
  component: UIInlineStatus,
  tags: ['autodocs'],
  args: {
    views: { items: [{ id: '1', kind: 'success', message: 'Зміни збережено' }] },
  },
  decorators: [
    (Story): JSX.Element => (
      <Box sx={{ maxWidth: '27rem', padding: '1rem', backgroundColor: '#FFFFFF' }}>
        <Story />
      </Box>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'The inline status block of variant B: up to three outcome lines right below the ' +
          'action row, 16 px under it (8 px for the e-mail placement). Fill and the 4 px inset ' +
          'accent take the tone of the most severe line, success `#E8F4EF` and `#2E7D32` or ' +
          'error `#FDECEC` and `#DC3939`. It fades in over 160 ms and animates no geometry. It ' +
          'carries no role, `aria-live` or `aria-atomic`: the page outlet announces the ' +
          'outcome once. It never closes by itself and never moves focus; if it is not wholly ' +
          'in view it scrolls the nearest amount.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof UIInlineStatus>;

export const One: Story = {};

export const Three: Story = {
  args: {
    views: {
      items: [
        { id: '1', kind: 'success', message: "Ім'я збережено" },
        { id: '2', kind: 'success', message: 'Лист для підтвердження надіслано' },
        { id: '3', kind: 'success', message: 'Пароль змінено' },
      ],
    },
  },
};

export const TransientWithRetry: Story = {
  args: {
    views: {
      items: [
        {
          id: '1',
          kind: 'error',
          message: 'Не вдалося зберегти зміни',
          action: { label: 'Повторити', onActivate: noop },
        },
      ],
    },
  },
};

export const PermanentError: Story = {
  args: {
    views: { items: [{ id: '1', kind: 'error', message: 'Цю адресу вже використано' }] },
  },
};

export const Mixed: Story = {
  args: {
    views: {
      items: [
        { id: '1', kind: 'success', message: "Ім'я збережено" },
        {
          id: '2',
          kind: 'error',
          message: 'Не вдалося надіслати лист',
          action: { label: 'Повторити', onActivate: noop },
        },
        { id: '3', kind: 'success', message: 'Пароль змінено' },
      ],
    },
  },
};

export const ReducedMotion: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'A simulation: Storybook cannot switch `prefers-reduced-motion`, so this story removes ' +
          'every animation in its frame. With the real preference the block appears at once, ' +
          'with no fade, and the reveal scroll uses `behavior: auto`.',
      },
    },
  },
  decorators: [
    (Story): JSX.Element => (
      <Box sx={{ '& *': { animation: 'none !important' } }}>
        <Story />
      </Box>
    ),
  ],
};
