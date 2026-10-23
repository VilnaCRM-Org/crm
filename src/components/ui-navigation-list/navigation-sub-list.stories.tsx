import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { storyGroup } from '@stories/navigation-story-items';
import { withMemoryRouter } from '@stories/router-decorators';

import NavigationSubList from './navigation-sub-list';

const meta: Meta<typeof NavigationSubList> = {
  title: 'Shell/Navigation/NavigationSubList',
  component: NavigationSubList,
  tags: ['autodocs'],
  decorators: [withMemoryRouter('/settings/webhooks')],
  args: { layout: 'desktop', id: 'sub-items', leaves: storyGroup.children, currentId: null },
  argTypes: { layout: { control: 'select', options: ['desktop', 'tablet'] } },
  parameters: {
    docs: {
      description: {
        component:
          'The nested list of the three Settings sub-items: Inter 400 on a 42 px (46 px tablet) ' +
          'row box, text at x 56 (60). Hover and current reuse the row states.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof NavigationSubList>;

export const Default: Story = {};

export const CurrentWebhooks: Story = { args: { currentId: 'webhooks' } };

export const Tablet: Story = { args: { layout: 'tablet' } };
