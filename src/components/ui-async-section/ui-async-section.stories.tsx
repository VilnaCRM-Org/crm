import type { Meta, StoryObj } from '@storybook/react-webpack5';
import i18next from 'i18next';

import UIAsyncSection from '@/components/ui-async-section';

const NAMESPACE = 'storybook_async_section';

const STORY_COPY = {
  en: {
    title: 'Contacts',
    loading: 'Loading…',
    loaded: 'Contacts loaded',
    empty: 'Nothing to show yet',
    error: 'Something went wrong. Please try again later.',
  },
  uk: {
    title: 'Контакти',
    loading: 'Завантаження…',
    loaded: 'Контакти завантажено',
    empty: 'Поки що нічого показати',
    error: 'Щось пішло не так. Спробуйте пізніше.',
  },
} as const;

const registerStoryCopy = async (): Promise<Record<string, never>> => {
  Object.entries(STORY_COPY).forEach(([language, copy]) => {
    i18next.addResourceBundle(language, 'translation', { [NAMESPACE]: copy }, true, true);
  });
  return {};
};

const meta: Meta<typeof UIAsyncSection> = {
  title: 'Components/Feedback/UIAsyncSection',
  component: UIAsyncSection,
  tags: ['autodocs'],
  loaders: [registerStoryCopy],
  args: {
    namespace: NAMESPACE,
    isLoading: false,
    hasError: false,
    count: 3,
    headingLevel: 'h2',
    children: (
      <ul>
        <li>Олена Коваль</li>
        <li>Андрій Шевчук</li>
        <li>Марія Бондар</li>
      </ul>
    ),
  },
  argTypes: {
    namespace: { control: false, description: 'i18n namespace holding title and status copy' },
    children: { control: false },
    headingLevel: {
      control: 'select',
      options: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Shared section chrome for scaffolded list features (issue #108): a heading, the ' +
          'loading / error / empty status copy from `<namespace>.*`, and a polite live region ' +
          'that announces the status after mount. The children render only once the list has ' +
          'loaded with at least one item. This story registers a demo namespace; a generated ' +
          'feature ships its own catalog entries.',
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof UIAsyncSection>;

export const Loaded: Story = {};

export const Loading: Story = {
  args: { isLoading: true },
};

export const Empty: Story = {
  args: { count: 0 },
};

export const Failed: Story = {
  args: { hasError: true },
};
