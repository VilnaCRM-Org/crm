import styled from '@emotion/styled';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import type { JSX } from 'react';

import styles from '@/components/layouts/app-layout.styles';
import AppShellPlaceholders from '@/components/layouts/app-shell-placeholders';

const OutlinedFrame = styled('div')(styles.frame, {
  minHeight: '100vh',
  '& > [aria-hidden="true"]': { outline: '2px dashed #0074B5', outlineOffset: '-2px' },
});

const meta: Meta<typeof AppShellPlaceholders> = {
  title: 'Layouts/AppShellPlaceholders',
  component: AppShellPlaceholders,
  tags: ['autodocs'],
  decorators: [
    (Story): JSX.Element => (
      <OutlinedFrame>
        <Story />
      </OutlinedFrame>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'The two empty, aria-hidden boxes AppLayout renders while the ui-app-shell chunk ' +
          'loads and after it fails: a 64 px sticky header slot across the frame and, from ' +
          '1024 px, the navigation column (251 px up to 1439 px, 250 px from 1440 px). They ' +
          'hold the shell boxes so nothing shifts when the shell arrives. The dashed outline ' +
          'is drawn by this story only; in the app the boxes are invisible.',
      },
      story: { inline: false },
    },
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof AppShellPlaceholders>;

export const Desktop: Story = {
  globals: { viewport: { value: 'xl', isRotated: false } },
};

export const Tablet: Story = {
  globals: { viewport: { value: 'lg', isRotated: false } },
};

export const Mobile: Story = {
  globals: { viewport: { value: 'xs', isRotated: false } },
};
