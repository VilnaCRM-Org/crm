import type { Meta, StoryObj } from '@storybook/react-webpack5';

import UITypography from '@/components/ui-typography';

import UIShellContent from '.';

const meta: Meta<typeof UIShellContent> = {
  title: 'Shell/UIShellContent',
  component: UIShellContent,
  tags: ['autodocs'],
  args: {
    children: (
      <UITypography component="h1" sx={{ margin: 0, outline: '1px dashed #969B9D' }}>
        Вміст сторінки починається від внутрішнього відступу оболонки.
      </UITypography>
    ),
  },
  argTypes: { children: { control: false } },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The content container of a page inside the app shell: full width, with 15 px side ' +
          'insets on mobile, 26 px from 768 px and 12 px from 1024 px, where the sidebar sits ' +
          'beside it, so page content starts 12 px from the sidebar. It adds no landmark; ' +
          'AppLayout owns `<main>`. The settings and home pages render inside it.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof UIShellContent>;

export const Mobile: Story = {
  globals: { viewport: { value: 'xs', isRotated: false } },
};

export const Tablet: Story = {
  globals: { viewport: { value: 'md', isRotated: false } },
};

export const WithSidebar: Story = {
  globals: { viewport: { value: 'lg', isRotated: false } },
};

export const Desktop: Story = {
  globals: { viewport: { value: 'xl', isRotated: false } },
};
