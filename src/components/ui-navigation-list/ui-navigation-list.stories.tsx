import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { storyItems, storyProducts } from '@stories/navigation-story-items';
import { withMemoryRouter } from '@stories/router-decorators';
import { noop } from '@stories/story-callbacks';

import UINavigationList from '.';

const meta: Meta<typeof UINavigationList> = {
  title: 'Shell/UINavigationList',
  component: UINavigationList,
  tags: ['autodocs'],
  args: { layout: 'desktop', variant: 'expanded', items: storyItems, signOut: noop },
  argTypes: {
    layout: { control: 'select', options: ['desktop', 'tablet', 'drawer'] },
    variant: { control: 'select', options: ['expanded', 'rail'] },
  },
  parameters: {
    docs: {
      description: {
        component:
          'One ordered list for the sidebar: the product rows, the Settings group and, last, ' +
          'Sign out after a divider. The current page carries `aria-current="page"`. Sign out ' +
          'runs once however often it is activated. The item set is data, so an RBAC filter ' +
          'can drop a row without leaving a gap.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof UINavigationList>;

const atHome = withMemoryRouter('/');

export const OnHome: Story = { decorators: [atHome] };

export const OnProducts: Story = { decorators: [withMemoryRouter('/products')] };

export const OnSettings: Story = { decorators: [withMemoryRouter('/settings/webhooks')] };

export const Tablet: Story = { args: { layout: 'tablet' }, decorators: [atHome] };

export const Drawer: Story = { args: { layout: 'drawer' }, decorators: [atHome] };

export const Rail: Story = { args: { variant: 'rail' }, decorators: [atHome] };

export const WithoutSettings: Story = { args: { items: storyProducts }, decorators: [atHome] };
