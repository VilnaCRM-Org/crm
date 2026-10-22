import type { Meta, StoryObj } from '@storybook/react-webpack5';
import type { JSX } from 'react';

import SettingsGrid from './index';

const meta: Meta<typeof SettingsGrid> = {
  title: 'Settings/SettingsGrid',
  component: SettingsGrid,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'The layout grid of the settings page. Its sections arrive as children: one column on ' +
          'small screens, two side by side from the lg breakpoint with the first child first in ' +
          'DOM order. With a single child the card keeps its desktop width.',
      },
    },
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof SettingsGrid>;

const card = (label: string): JSX.Element => (
  <section aria-label={label} style={{ border: '1px solid #EAECEE', padding: 24 }}>
    {label}
  </section>
);

export const OneSection: Story = { args: { children: card('Profile') } };

export const TwoSections: Story = { args: { children: [card('Profile'), card('Second')] } };
