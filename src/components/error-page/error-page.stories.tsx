import type { Meta, StoryObj } from '@storybook/react-webpack5';

import ErrorPage from '@/components/error-page';

const MOBILE = { viewport: { value: 'xs', isRotated: false } };

const meta: Meta<typeof ErrorPage> = {
  title: 'Pages/ErrorPage',
  component: ErrorPage,
  tags: ['autodocs'],
  args: {
    variant: 'notFound',
    landmark: 'main',
  },
  argTypes: {
    variant: { control: 'inline-radio', options: ['notFound', 'forbidden', 'serverError'] },
    landmark: { control: 'inline-radio', options: ['main', 'region'] },
  },
  parameters: {
    docs: {
      description: {
        component:
          'The designed error page (issue #309, ADR-018) shared by the catch-all 404, ' +
          '`/forbidden` and `/server-error`, and shown by RouteError for a 404, 403 or 5xx ' +
          'response: the status digits over the decorative illustration, a card whose heading ' +
          'takes focus on mount, the variant actions, and the footer. It has three ' +
          'compositions: desktop above 1024 px, tablet from 768 px and mobile below 768 px. ' +
          'Each story renders in its own iframe, because every story mounts the page heading ' +
          'with the same id and moves focus to it.',
      },
      story: { inline: false, height: '1100px' },
    },
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof ErrorPage>;

export const NotFound: Story = {};

export const Forbidden: Story = {
  args: { variant: 'forbidden' },
};

export const ServerError: Story = {
  args: { variant: 'serverError' },
};

export const NotFoundMobile: Story = {
  globals: MOBILE,
};

export const ForbiddenMobile: Story = {
  args: { variant: 'forbidden' },
  globals: MOBILE,
  parameters: {
    docs: {
      description: {
        story:
          'Below 768 px the two 403 actions stack at the full card width with "Request access" ' +
          'first, as the 403 mobile frame draws them. The order changes in the DOM, not with ' +
          'CSS, so the focus order follows the visual order.',
      },
    },
  },
};

export const ServerErrorMobile: Story = {
  args: { variant: 'serverError' },
  globals: MOBILE,
};

export const RegionLandmark: Story = {
  args: { landmark: 'region' },
  parameters: {
    docs: {
      description: {
        story:
          'With `landmark="region"` the page renders a `<section>` labelled by its heading and ' +
          'no footer, the variant RouteError selects under AppLayout, whose own `<main>` and ' +
          'footer already wrap it.',
      },
    },
  },
};
