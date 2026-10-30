import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { withMemoryRouter } from '@stories/router-decorators';

import HeaderLogo from './header-logo';

const meta: Meta<typeof HeaderLogo> = {
  title: 'Shell/Header/HeaderLogo',
  component: HeaderLogo,
  tags: ['autodocs'],
  args: { layout: 'desktop' },
  argTypes: { layout: { control: 'select', options: ['desktop', 'tablet', 'mobile'] } },
  decorators: [withMemoryRouter('/settings')],
  parameters: {
    docs: {
      description: {
        component:
          'The logo link to `/`, named "VilnaCRM" with an image that has no name of its own. ' +
          'Desktop and tablet draw the same exported artwork (143×48.12), mobile the exported ' +
          '125×42.07 one inside a 44 px tall target. It routes without a document load and asks ' +
          'the destination to focus `<main>`. A keyboard-focused logo gets a 2 px ring ' +
          'in `#1A1C1E`, ' +
          'a mouse click draws none.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof HeaderLogo>;

export const Desktop: Story = {};

export const Tablet: Story = { args: { layout: 'tablet' } };

export const Mobile: Story = { args: { layout: 'mobile' } };
