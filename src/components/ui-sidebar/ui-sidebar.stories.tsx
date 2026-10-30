import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { storyItems } from '@stories/navigation-story-items';
import { withMemoryRouter } from '@stories/router-decorators';
import { noop } from '@stories/story-callbacks';

import UISidebar from '.';

const meta: Meta<typeof UISidebar> = {
  title: 'Shell/UISidebar',
  component: UISidebar,
  tags: ['autodocs'],
  args: { layout: 'desktop', items: storyItems, signOut: noop },
  argTypes: { layout: { control: 'select', options: ['desktop', 'tablet'] } },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The persistent sidebar: one `<nav>` named "Main navigation" in a 238 px panel ' +
          '(791 px desktop, 1142 px tablet) with a `#E1E7EA` border, radius 12 and a soft ' +
          'shadow. The handle collapses it to the 72 px (76 px tablet) rail, where each row ' +
          'shows a tooltip on hover and keyboard focus. The state is not persisted. The rail ' +
          'stories collapse it on load by activating the handle; on a short viewport the rail ' +
          'list scrolls inside the card with Sign out kept at its foot.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof UISidebar>;

const atHome = withMemoryRouter('/');

export const Desktop: Story = { decorators: [atHome] };

export const DesktopOnSettings: Story = { decorators: [withMemoryRouter('/settings')] };

export const Tablet: Story = { args: { layout: 'tablet' }, decorators: [atHome] };

export const TabletOnSettings: Story = {
  args: { layout: 'tablet' },
  decorators: [withMemoryRouter('/settings/integrations')],
};

const collapseOnLoad: Story['play'] = ({ canvasElement }) => {
  canvasElement.querySelector<HTMLButtonElement>('button[aria-expanded="true"]')?.click();
};

export const DesktopRail: Story = { decorators: [atHome], play: collapseOnLoad };

export const TabletRail: Story = {
  args: { layout: 'tablet' },
  decorators: [atHome],
  play: collapseOnLoad,
};
