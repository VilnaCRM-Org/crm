import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { ReactComponent as BoardsIcon } from '@/assets/icons/shell/layout-alt-01.svg';
import { ReactComponent as SignOutIcon } from '@/assets/icons/shell/log-in-02.svg';
import { withMemoryRouter } from '@stories/router-decorators';
import { noop } from '@stories/story-callbacks';

import NavigationRow from './navigation-row';

const meta: Meta<typeof NavigationRow> = {
  title: 'Shell/Navigation/NavigationRow',
  component: NavigationRow,
  tags: ['autodocs'],
  decorators: [withMemoryRouter('/')],
  args: {
    layout: 'desktop',
    variant: 'item',
    id: 'boards',
    label: 'Дошки',
    icon: BoardsIcon,
    href: '/boards',
  },
  argTypes: {
    layout: { control: 'select', options: ['desktop', 'tablet'] },
    variant: { control: 'select', options: ['item', 'sub', 'rail'] },
  },
  parameters: {
    docs: {
      description: {
        component:
          'One navigation row. A link with `href`, a button without. Default: `#404142` label ' +
          'and `#969B9D` stroke icon. Hover: `#F4F5F6`, label `#1A1C1E`, icon `#404142`. Current ' +
          '(`aria-current="page"`): `#1EAEFF` at 10 %, label and icon `#0399ED`. The focus ring ' +
          'is an inset 2 px `#1A1C1E`. The rail variant keeps its label as hidden text.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof NavigationRow>;

export const Default: Story = {};

export const Current: Story = { args: { current: true } };

export const Tablet: Story = { args: { layout: 'tablet' } };

export const SubItem: Story = {
  args: { variant: 'sub', id: 'integrations', label: 'Інтеграції', icon: undefined },
};

export const Rail: Story = { args: { variant: 'rail' } };

export const SignOut: Story = {
  args: { id: 'signOut', label: 'Вийти', icon: SignOutIcon, href: undefined, onActivate: noop },
};
