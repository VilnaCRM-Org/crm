import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { withFormProvider } from '@stories/form-decorators';

import FormField from './form-field';

const REQUIRED_RULES = { required: 'Вкажіть електронну пошту' };

const meta: Meta<typeof FormField> = {
  title: 'Auth/Fields/FormField',
  component: FormField,
  tags: ['autodocs'],
  args: {
    name: 'email',
    type: 'email',
    autoComplete: 'email',
    label: 'E-mail',
    placeholder: 'vilnaCRM@gmail.com',
    rules: REQUIRED_RULES,
  },
  argTypes: {
    name: { control: false },
    rules: { control: false },
    inputProps: { control: false },
    defaultValue: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          'A labelled auth form field: a `<label htmlFor>` paired with the controlled ' +
          'UIFormInputField through the field `name`, reading the form from react-hook-form ' +
          'context. Validation runs once the field has been touched.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof FormField>;

export const Default: Story = {
  decorators: [withFormProvider({ email: '' })],
};

export const ValidationError: Story = {
  decorators: [withFormProvider({ email: '' }, { validateOnMount: true })],
};
