import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { type JSX, lazy } from 'react';

import UITypography from '@/components/ui-typography';
import AuthPageLayout from '@auth/components/auth-page-layout';
import { withMemoryRouter } from '@stories/router-decorators';

const PendingFormSection = lazy(
  (): Promise<{ default: () => JSX.Element }> => new Promise<never>(() => undefined)
);

const meta: Meta<typeof AuthPageLayout> = {
  title: 'Auth/Layouts/AuthPageLayout',
  component: AuthPageLayout,
  tags: ['autodocs'],
  decorators: [withMemoryRouter('/sign-in')],
  args: {
    children: (
      <UITypography component="h1" variant="h4">
        Вміст сторінки автентифікації
      </UITypography>
    ),
  },
  argTypes: {
    children: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          'The frame of the sign-in and sign-up pages: the back-to-main link, a focusable ' +
          '`<main>` holding the AuthErrorBoundary and a Suspense boundary whose fallback is ' +
          'AuthSkeleton, and the footer.',
      },
      story: { inline: false },
    },
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof AuthPageLayout>;

export const WithContent: Story = {};

export const FormLoading: Story = {
  args: { children: <PendingFormSection /> },
  parameters: {
    docs: {
      description: {
        story: 'The form chunk has not resolved yet, so the AuthSkeleton fallback shows.',
      },
    },
  },
};
