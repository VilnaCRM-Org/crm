import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { createRef } from 'react';

import FormLead from './form-lead';

const meta: Meta<typeof FormLead> = {
  title: 'Components/Inputs/UIForm/FormLead',
  component: FormLead,
  tags: ['autodocs'],
  args: {
    header: {
      title: 'Вхід',
      subtitle: 'Увійдіть до свого аккаунту',
      showTitle: true,
      showSubtitle: true,
      titleComponent: 'h1',
    },
    lead: { error: null },
    liveOfflineNotice: true,
    offline: {
      online: true,
      noticeId: 'form-lead-offline-notice',
      noticeRef: createRef(),
      submitRef: createRef(),
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          'The top of every UIForm: the title and subtitle, an optional notice, the error ' +
          'banner and the offline notice. It owns the banner focus-return state, so a cleared ' +
          'error returns focus to the submit button even when the banner was remounted for a ' +
          'new occurrence.',
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof FormLead>;

export const Default: Story = {};

export const WithError: Story = {
  args: {
    lead: {
      error: 'Не вдалося надіслати запит. Перевірте з’єднання та спробуйте ще раз.',
      errorOccurrence: 1,
    },
    offline: {
      online: true,
      noticeId: 'form-lead-offline-notice-with-error',
      noticeRef: createRef(),
      submitRef: createRef(),
    },
  },
  parameters: { docs: { story: { inline: false } } },
};

export const Offline: Story = {
  args: {
    offline: {
      online: false,
      noticeId: 'form-lead-offline-notice-offline',
      noticeRef: createRef(),
      submitRef: createRef(),
    },
  },
};
