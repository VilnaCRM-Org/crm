import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { withUserMenuFrame, withUserMenuPadding } from '@stories/user-menu-story-frame';

import UserChipBody from './user-chip-body';

const meta: Meta<typeof UserChipBody> = {
  title: 'Settings/UserMenu/UserChipBody',
  component: UserChipBody,
  tags: ['autodocs'],
  args: { layout: 'desktop', identity: { displayName: 'Єва Мельник', monogram: 'ЄМ' } },
  argTypes: { layout: { control: 'select', options: ['desktop', 'tablet'] } },
  decorators: [withUserMenuFrame, withUserMenuPadding],
  parameters: {
    docs: {
      description: {
        component:
          'The face of the chip: the monogram disc, the name at its Figma offset and the ' +
          'decorative caret. Without an identity it draws the person glyph and no name.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof UserChipBody>;

export const Desktop: Story = {};

export const Tablet: Story = { args: { layout: 'tablet' } };

export const UnknownIdentity: Story = { args: { identity: null } };
