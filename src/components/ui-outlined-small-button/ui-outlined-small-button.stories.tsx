import type { Meta, StoryObj } from '@storybook/react-webpack5';

import UIOutlinedSmallButton from '@/components/ui-outlined-small-button';
import { noop } from '@stories/story-callbacks';

const meta: Meta<typeof UIOutlinedSmallButton> = {
  title: 'Components/Inputs/UIOutlinedSmallButton',
  component: UIOutlinedSmallButton,
  tags: ['autodocs'],
  args: { children: 'Відключити', 'aria-disabled': false, onClick: noop },
  argTypes: {
    'aria-disabled': { control: 'boolean' },
    onClick: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Trial seam for the linked social tile (S3.4, the labelled variant). It renders the ' +
          'ui-toolkit UiButton pinned to variant="outlined", size="small" and disableRipple: ' +
          'the Figma UI kit secondary pill 439:19257, Golos 500 15/18 #1B2327 on white with a ' +
          '1 px #969B9D border and a pill radius. It forwards `ref`, `aria-label`, ' +
          '`aria-disabled`, `onClick`, `sx` and its children; `aria-disabled` never sets the ' +
          'native disabled attribute, so the button keeps keyboard focus. Toolkit story: ' +
          'uicomponents-uibutton--outlined. The seam is removed if its variant loses.',
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof UIOutlinedSmallButton>;

export const Rest: Story = {};

export const AriaDisabled: Story = { args: { 'aria-disabled': true } };
